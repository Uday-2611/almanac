"use client";

import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import { GoogleAccountLink } from "@/components/settings/google-account-link";

import styles from "./profile-settings.module.css";

type EditableField = "name" | "email";

type OrbStyle = CSSProperties & {
  "--orb-base": string;
  "--orb-deep": string;
  "--orb-light": string;
  "--orb-mid": string;
  "--orb-light-x": string;
  "--orb-light-y": string;
  "--orb-shadow-x": string;
  "--orb-shadow-y": string;
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function createOrbStyle(id: string): OrbStyle {
  const seed = hashSeed(id);
  const hue = seed % 360;
  const neighboringHue = (hue + 352 + ((seed >>> 6) % 17)) % 360;

  return {
    "--orb-base": `hsl(${hue} 76% 48%)`,
    "--orb-deep": `hsl(${neighboringHue} 82% 23%)`,
    "--orb-mid": `hsl(${hue} 78% 58%)`,
    "--orb-light": `hsl(${(hue + 7) % 360} 82% 76%)`,
    "--orb-light-x": `${26 + ((seed >>> 4) % 30)}%`,
    "--orb-light-y": `${58 + ((seed >>> 9) % 20)}%`,
    "--orb-shadow-x": `${48 + ((seed >>> 14) % 28)}%`,
    "--orb-shadow-y": `${8 + ((seed >>> 19) % 25)}%`,
  };
}

export function ProfileSettings({ id, initialName, initialEmail, googleEnabled, children }: {
  id: string;
  initialName: string;
  initialEmail: string;
  googleEnabled: boolean;
  children?: ReactNode;
}) {
  const router = useRouter();
  const orbStyle = useMemo(() => createOrbStyle(id), [id]);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function beginEditing(field: EditableField) {
    setProfileMessage("");
    setProfileError("");
    setEditing(field);
    setDraft(field === "name" ? name : email);
  }

  function cancelEditing() {
    setEditing(null);
    setDraft("");
    setProfileError("");
  }

  async function saveField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;

    const nextName = editing === "name" ? draft : name;
    const nextEmail = editing === "email" ? draft : email;
    setSaving(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName, email: nextEmail }),
      });
      const body = await response.json().catch(() => null) as {
        error?: string;
        user?: { name: string; email: string };
      } | null;

      if (!response.ok || !body?.user) {
        setProfileError(body?.error ?? "Your profile could not be saved. Try again.");
        return;
      }

      setName(body.user.name);
      setEmail(body.user.email);
      setEditing(null);
      setDraft("");
      setProfileMessage(`${editing === "name" ? "Name" : "Email"} saved.`);
      router.refresh();
    } catch {
      setProfileError("Your profile could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError(result.error.message ?? "Sign out failed. Try again.");
        return;
      }
      router.replace("/");
    } catch {
      setSignOutError("Sign out failed. Check your connection and try again.");
    } finally {
      setSigningOut(false);
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deletePhrase !== "DELETE" || deleting) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const result = await authClient.deleteUser({
        callbackURL: "/",
        ...(password ? { password } : {}),
      });
      if (result.error) {
        setDeleteError(
          result.error.message ?? "The account could not be deleted. Sign in again and retry.",
        );
        return;
      }
      router.replace("/");
    } catch {
      setDeleteError("The account could not be deleted. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  }

  const rows: Array<{ field: EditableField; label: string; value: string; type: "text" | "email" }> = [
    { field: "name", label: "Name", value: name, type: "text" },
    { field: "email", label: "Email", value: email, type: "email" },
  ];

  return (
    <>
      <header className={styles.profileHeader}>
        <div className={styles.orb} style={orbStyle} aria-hidden="true" />
        <div className={styles.profileIntroduction}>
          <p>My profile</p>
          <h1>{name}</h1>
          <span>{email}</span>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="identity-heading">
        <div className={styles.sectionIntroduction}>
          <p>Profile</p>
          <div>
            <h2 id="identity-heading">Personal details</h2>
            <span>The name and email attached to your private archive.</span>
          </div>
        </div>

        <div className={styles.detailRows}>
          {rows.map((row) => (
            <div className={styles.detailRow} key={row.field}>
              <span className={styles.detailLabel}>{row.label}</span>
              {editing === row.field ? (
                <form className={styles.editForm} onSubmit={saveField}>
                  <label className={styles.visuallyHidden} htmlFor={`profile-${row.field}`}>
                    {row.label}
                  </label>
                  <input
                    id={`profile-${row.field}`}
                    type={row.type}
                    value={draft}
                    maxLength={row.field === "name" ? 80 : 254}
                    autoComplete={row.field}
                    autoFocus
                    disabled={saving}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <div className={styles.editActions}>
                    <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                    <button type="button" disabled={saving} onClick={cancelEditing}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <span className={styles.detailValue}>{row.value}</span>
                  <button className={styles.textAction} type="button" onClick={() => beginEditing(row.field)}>
                    Edit
                  </button>
                </>
              )}
            </div>
          ))}
          <GoogleAccountLink enabled={googleEnabled} />
        </div>
        <div className={styles.profileStatus} aria-live="polite">
          {profileError ? <p className={styles.error} role="alert">{profileError}</p> : null}
          {profileMessage ? <p>{profileMessage}</p> : null}
        </div>
      </section>

      {children}

      <section className={styles.section} aria-labelledby="account-heading">
        <div className={styles.sectionIntroduction}>
          <p>Account</p>
          <div>
            <h2 id="account-heading">Account access</h2>
            <span>End this session or permanently remove the archive.</span>
          </div>
        </div>

        <div className={styles.accountRows}>
          <div className={styles.accountRow}>
            <div>
              <h3>Sign out</h3>
              <p>Your archive remains here for the next time you sign in.</p>
            </div>
            <button className={styles.textAction} type="button" disabled={signingOut} onClick={() => void signOut()}>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
          {signOutError ? <p className={styles.error} role="alert">{signOutError}</p> : null}

          <div className={`${styles.accountRow} ${styles.dangerRow}`}>
            <div>
              <h3>Delete account</h3>
              <p>Permanently deletes your movies, books, notes, tags, lists, and account.</p>
            </div>
            <button
              className={`${styles.textAction} ${styles.dangerAction}`}
              type="button"
              aria-expanded={confirmingDelete}
              aria-controls="delete-account-confirmation"
              onClick={() => {
                setConfirmingDelete((visible) => !visible);
                setDeleteError("");
              }}
            >
              {confirmingDelete ? "Cancel" : "Delete account"}
            </button>
          </div>

          {confirmingDelete ? (
            <form id="delete-account-confirmation" className={styles.deleteForm} onSubmit={deleteAccount}>
              <p>This cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
              <div className={styles.deleteFields}>
                <label>
                  <span>Confirmation</span>
                  <input
                    value={deletePhrase}
                    autoComplete="off"
                    disabled={deleting}
                    onChange={(event) => setDeletePhrase(event.target.value)}
                    placeholder="DELETE"
                  />
                </label>
                <label>
                  <span>Current password, if your account uses one</span>
                  <input
                    type="password"
                    value={password}
                    autoComplete="current-password"
                    disabled={deleting}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              </div>
              <button
                className={styles.deleteButton}
                type="submit"
                disabled={deletePhrase !== "DELETE" || deleting}
              >
                {deleting ? "Deleting account…" : "Permanently delete account"}
              </button>
              {deleteError ? <p className={styles.error} role="alert">{deleteError}</p> : null}
            </form>
          ) : null}
        </div>
      </section>
    </>
  );
}
