import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import styles from "@/components/auth/auth-shell.module.css";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Login" };

const oauthErrorMessages: Record<string, string> = {
  account_not_linked: "Sign in with your Almanac password once, then connect Google from Settings.",
  access_denied: "Google sign-in was cancelled.",
};

const reelColumns = [
  [
    { src: "/images/cosmos_1160915857.jpeg", width: 1080, height: 1350 },
    { src: "/images/cosmos_282709694.jpeg", width: 735, height: 567 },
    { src: "/images/cosmos_711496836.jpeg", width: 810, height: 1199 },
    { src: "/images/cosmos_993880358.jpeg", width: 736, height: 1113 },
  ],
  [
    { src: "/images/cosmos_1228848868.jpeg", width: 1080, height: 1350 },
    { src: "/images/cosmos_1539474326.jpeg", width: 1080, height: 1080 },
    { src: "/images/cosmos_329592747.jpeg", width: 502, height: 640 },
    { src: "/images/cosmos_88458509.jpeg", width: 858, height: 1200 },
  ],
  [
    { src: "/images/cosmos_1513610993.jpeg", width: 1080, height: 1350 },
    { src: "/images/cosmos_452458236.jpeg", width: 1200, height: 1776 },
    { src: "/images/cosmos_486212616.gif", width: 480, height: 240 },
    { src: "/images/cosmos_1065735536.jpeg", width: 700, height: 1049 },
  ],
  [
    { src: "/images/cosmos_1281293179.jpeg", width: 1144, height: 1216 },
    { src: "/images/cosmos_1301929845.jpeg", width: 1080, height: 810 },
    { src: "/images/cosmos_2050115722.jpeg", width: 1080, height: 608 },
    { src: "/images/cosmos_1712722043.jpeg", width: 1080, height: 1346 },
  ],
] as const;

function ArchiveReel() {
  return (
    <div className={styles.reels} aria-hidden="true">
      {reelColumns.map((images, columnIndex) => (
        <div className={styles.reelColumn} key={columnIndex}>
          <div className={styles.reelTrack}>
            {[0, 1].map((copy) => (
              <div className={styles.reelSet} key={copy}>
                {images.map((image, tileIndex) => (
                  <figure
                    className={styles.reelImage}
                    key={`${copy}-${tileIndex}`}
                  >
                    <Image
                      alt=""
                      height={image.height}
                      loading="eager"
                      sizes="(max-width: 860px) 25vw, 16vw"
                      src={image.src}
                      unoptimized={image.src.endsWith(".gif")}
                      width={image.width}
                    />
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/movies");

  const { error } = await searchParams;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const afterEmailSignIn = error === "account_not_linked" ? "/settings" : "/movies";
  const oauthError = error
    ? oauthErrorMessages[error] ?? "Google sign-in could not be completed. Please try again."
    : null;

  return (
    <main className={styles.page}>
      <section className={styles.authShell} aria-label="Almanac account access">
        <aside className={styles.archivePanel}>
          <ArchiveReel />

          <div className={styles.archiveHeader}>
            <Link className={`${styles.wordmark} almanac-wordmark`} href="/">
              Almanac
            </Link>
            <span>Private archive · 2026</span>
          </div>

          <div className={styles.archiveCopy}>
            <p>Films · series · books</p>
            <h2>Keep what stays.</h2>
            <span>Your private record of the work you return to.</span>
          </div>
        </aside>

        <div className={styles.formPane}>
          <AuthForm
            googleEnabled={googleEnabled}
            oauthError={oauthError}
            afterEmailSignIn={afterEmailSignIn}
          />
        </div>
      </section>
    </main>
  );
}
