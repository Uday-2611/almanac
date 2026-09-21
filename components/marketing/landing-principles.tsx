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

export function LandingPrinciples() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
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
    if (!isInView || isHovered || hasFocusWithin || reduceMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % principles.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [isInView, isHovered, hasFocusWithin, reduceMotion]);

  const activePrinciple = principles[activeIndex];

  return (
    <section
      className={styles.principlesSection}
      aria-labelledby="principles-title"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocusWithin(false);
      }}
      onFocus={() => setHasFocusWithin(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={sectionRef}
    >
      <header className={styles.principlesHeader} data-reveal>
        <span>Almanac principles</span>
        <h2 id="principles-title">The way we keep things matters.</h2>
      </header>

      <div className={styles.principlesBody}>
        <div className={styles.principleTerms} aria-label="Explore Almanac principles" data-reveal role="group">
          {principles.map((principle, index) => (
            <button
              aria-pressed={activeIndex === index}
              className={activeIndex === index ? styles.principleActive : undefined}
              key={principle.key}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <span aria-hidden="true" className={styles.principleTermNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span>{principle.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.principleDetail} data-reveal>
          <div className={styles.principleMeta}>
            <span>{String(activeIndex + 1).padStart(2, "0")} / {String(principles.length).padStart(2, "0")}</span>
            <span>{activePrinciple.label}</span>
          </div>
          <strong className={styles.principleFieldText} key={`${activePrinciple.key}-statement`}>
            {activePrinciple.fieldText}
          </strong>
          <p className={styles.principleDescription} key={`${activePrinciple.key}-description`}>
            {activePrinciple.description}
          </p>
        </div>
      </div>
    </section>
  );
}
