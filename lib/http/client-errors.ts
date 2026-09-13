export async function responseErrorMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null) as { error?: unknown } | null;

  if (response.status === 401) return "Your session expired. Sign in again to continue.";
  if (response.status === 429) return "Too many requests. Wait a moment and try again.";
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
  return fallback;
}
