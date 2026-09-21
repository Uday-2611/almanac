"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./landing-experience.module.css";

const EMAIL = "udayagarwal234@gmail.com";

export function CopyContactEmail() {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setStatus("copied");
    } catch {
      setStatus("error");
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <button className={styles.footerCopyEmail} onClick={copyEmail} type="button">
      <span>Contact us</span>
      <span className={styles.footerCopyAddressWrap}>
        <span className={styles.footerCopyAddress}>{EMAIL}</span>
        <span
          aria-live="polite"
          className={styles.footerCopyFeedback}
          data-visible={status !== "idle"}
          role="status"
        >
          {status === "copied" ? "Copied" : status === "error" ? "Could not copy" : ""}
        </span>
      </span>
    </button>
  );
}
