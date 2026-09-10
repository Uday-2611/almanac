import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const baseUrl = process.env.BOOK_FLOW_BASE_URL ?? "http://localhost:3000";
const email = `book-flow-${randomUUID()}@example.invalid`;
const password = `Book-flow-${randomUUID()}`;
const sql = neon(process.env.DATABASE_URL);
let userId = null;
let otherUserId = null;

async function jsonRequest(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path} failed (${response.status}): ${data?.error ?? "Unknown error"}`);
  return { data, response };
}

try {
  const signup = await jsonRequest("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ email, name: "Book Flow Test", password }),
  });
  userId = signup.data?.user?.id ?? null;
  if (!userId) throw new Error("Temporary user was not returned by Better Auth.");

  const setCookies = typeof signup.response.headers.getSetCookie === "function"
    ? signup.response.headers.getSetCookie()
    : [signup.response.headers.get("set-cookie")].filter(Boolean);
  const cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const headers = { "Content-Type": "application/json", Cookie: cookie, Origin: baseUrl };

  const search = await jsonRequest("/api/books/search?q=The%20Left%20Hand%20of%20Darkness", { headers });
  const result = search.data?.results?.[0];
  if (!result?.providerId) throw new Error("Open Library search returned no usable result.");

  const preview = await jsonRequest(`/api/books/preview?provider=${encodeURIComponent(result.provider)}&providerId=${encodeURIComponent(result.providerId)}`, { headers });
  if (!preview.data?.preview?.title || preview.data.preview.kind !== "book") {
    throw new Error("Book preview returned no usable information.");
  }

  if (result.coverUrl) {
    const imageUrl = `${baseUrl}/_next/image?url=${encodeURIComponent(result.coverUrl)}&w=128&q=75`;
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Open Library cover optimization failed (${imageResponse.status}).`);
  }

  const created = await jsonRequest("/api/books", {
    method: "POST",
    headers,
    body: JSON.stringify({ provider: result.provider, providerId: result.providerId, status: "read" }),
  });
  const bookId = created.data?.book?.id;
  if (!bookId) throw new Error("Book creation returned no ID.");

  await jsonRequest(`/api/books/${bookId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ rating: 5, review: "**Verified** through the authenticated route.", loggedDate: "2026-09-08" }),
  });

  const duplicate = await jsonRequest("/api/books", {
    method: "POST",
    headers,
    body: JSON.stringify({ provider: result.provider, providerId: result.providerId, status: "want_to_read" }),
  });
  if (duplicate.data.created !== false || duplicate.data.book.id !== bookId || duplicate.data.book.status !== "read") {
    throw new Error("Re-adding a saved book was not idempotent or unexpectedly changed its status.");
  }

  let googleTitle = "not configured";
  if (process.env.GOOGLE_BOOKS_API_KEY?.trim()) {
    const googleSearch = await jsonRequest("/api/books/search?q=The%20Hobbit&provider=google_books", { headers });
    const googleResult = googleSearch.data?.results?.find((book) => book.provider === "google_books");
    if (!googleResult?.providerId) throw new Error("Google Books fallback returned no usable result.");

    if (googleResult.coverUrl) {
      const imageUrl = `${baseUrl}/_next/image?url=${encodeURIComponent(googleResult.coverUrl)}&w=128&q=75`;
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) throw new Error(`Google Books cover optimization failed (${imageResponse.status}).`);
    }

    const googleCreated = await jsonRequest("/api/books", {
      method: "POST",
      headers,
      body: JSON.stringify({ provider: "google_books", providerId: googleResult.providerId, status: "want_to_read" }),
    });
    if (googleCreated.data?.book?.provider !== "google_books") {
      throw new Error("Google Books result was not persisted under its provider namespace.");
    }
    googleTitle = googleResult.title;
  }

  const otherSignup = await jsonRequest("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({
      email: `book-flow-${randomUUID()}@example.invalid`,
      name: "Other Book Flow Test",
      password: `Book-flow-${randomUUID()}`,
    }),
  });
  otherUserId = otherSignup.data?.user?.id ?? null;
  if (!otherUserId) throw new Error("Second temporary user was not returned by Better Auth.");

  const otherCookies = typeof otherSignup.response.headers.getSetCookie === "function"
    ? otherSignup.response.headers.getSetCookie()
    : [otherSignup.response.headers.get("set-cookie")].filter(Boolean);
  const otherCookie = otherCookies.map((value) => value.split(";", 1)[0]).join("; ");
  const otherHeaders = { "Content-Type": "application/json", Cookie: otherCookie, Origin: baseUrl };
  const foreignRead = await fetch(`${baseUrl}/api/books/${bookId}`, { headers: otherHeaders });
  if (foreignRead.status !== 404) throw new Error(`Another user could read the saved book (${foreignRead.status}).`);

  const otherList = await jsonRequest("/api/book-lists", {
    method: "POST",
    headers: otherHeaders,
    body: JSON.stringify({ name: "Other User List" }),
  });
  const foreignMembership = await fetch(`${baseUrl}/api/book-lists/${otherList.data.list.id}/books`, {
    method: "POST",
    headers: otherHeaders,
    body: JSON.stringify({ bookId }),
  });
  if (foreignMembership.status !== 409) {
    throw new Error(`Another user could add the saved book to a list (${foreignMembership.status}).`);
  }

  const list = await jsonRequest("/api/book-lists", {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "Verified Books" }),
  });
  const listId = list.data?.list?.id;
  await jsonRequest(`/api/book-lists/${listId}/books`, {
    method: "POST",
    headers,
    body: JSON.stringify({ bookId }),
  });

  await jsonRequest(`/api/books/${bookId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "want_to_read" }),
  });

  const memberships = await sql`select count(*)::int as count from book_list_items where book_id = ${bookId}`;
  if (memberships[0].count !== 0) throw new Error("Status downgrade did not remove custom-list membership.");

  const saved = await jsonRequest(`/api/books/${bookId}`, { headers });
  if (saved.data.book.status !== "want_to_read" || saved.data.book.rating !== null || saved.data.book.review !== null) {
    throw new Error("Want to Read transition did not clear Read-only details.");
  }

  console.log(`Authenticated book flow verified with Open Library (${result.title}); Google Books: ${googleTitle}.`);
} finally {
  if (userId) await sql`delete from "user" where id = ${userId}`;
  else await sql`delete from "user" where email = ${email}`;
  if (otherUserId) await sql`delete from "user" where id = ${otherUserId}`;
}
