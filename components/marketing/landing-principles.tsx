"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./landing-experience.module.css";

const principles = [
  {
    key: "privacy",
    label: "Privacy.",
    fieldText: "Kept for you.",
    description: "Your archive belongs to you. No public profile, no audience, and no feed—only what you chose to keep.",
  },
  {
    key: "simplicity",
    label: "Simplicity.",
    fieldText: "Less, kept well.",
    description: "Log the details that matter without turning reflection into administration or taste into a scorecard.",
  },
  {
    key: "continuity",
    label: "Continuity.",
    fieldText: "Return and refine.",
    description: "Each film, series, or book remains one living entry that can change as your memory of it changes.",
  },
  {
    key: "connection",
    label: "Connection.",
    fieldText: "Ideas recur.",
    description: "Reusable tags let a thought travel between films, series, and books without becoming a public taxonomy.",
  },
  {
    key: "ownership",
    label: "Ownership.",
    fieldText: "Bring your history.",
    description: "Import the collections you already built, then keep the resulting archive under your own account.",
  },
  {
    key: "longevity",
    label: "Longevity.",
    fieldText: "Made to return to.",
    description: "Almanac is designed as a durable personal record, not a stream that disappears beneath the next update.",
  },
] as const;

const archiveMarks = Array.from({ length: 25 }, (_, index) => index);

export function LandingPrinciples() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.25 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || isPaused || reduceMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % principles.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [isInView, isPaused, reduceMotion]);

  const activePrinciple = principles[activeIndex];

  return (
    <section
      className={styles.principlesSection}
      aria-labelledby="principles-title"
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={sectionRef}
    >
      <div className={styles.principleIndex} data-reveal>
        <h2 id="principles-title">Almanac principles</h2>
        <div className={styles.principleTerms}>
          {principles.map((principle, index) => (
            <button
              aria-pressed={activeIndex === index}
              className={activeIndex === index ? styles.principleActive : undefined}
              key={principle.key}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <i aria-hidden="true" />
              <span>{principle.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.principleDetail}>
        <figure
          aria-label={`${activePrinciple.label} ${activePrinciple.fieldText}`}
          className={styles.principlePlate}
          data-principle={activePrinciple.key}
          data-reveal
        >
          <span className={styles.principleNumber}>{String(activeIndex + 1).padStart(2, "0")}</span>
          <strong className={styles.principleFieldText} key={activePrinciple.key}>
            {activePrinciple.fieldText}
          </strong>
          <div className={styles.archiveMarks} aria-hidden="true">
            {archiveMarks.map((mark) => <i key={mark} />)}
          </div>
        </figure>
        <p className={styles.principleDescription} data-reveal key={activePrinciple.key}>
          {activePrinciple.description}
        </p>
      </div>
    </section>
  );
}
