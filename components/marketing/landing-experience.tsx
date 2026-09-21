import Image from "next/image";
import Link from "next/link";

import styles from "./landing-experience.module.css";
import { CopyContactEmail } from "./copy-contact-email";
import { LandingPrinciples } from "./landing-principles";
import { LandingRevealObserver } from "./landing-reveal-observer";

const differences = [
  ["Private by default", "No public profiles, followers, likes, or feeds."],
  ["One living entry", "Return to a work and refine the same record over time."],
  ["Words over metrics", "Ratings stay optional. Your notes carry the memory."],
  ["Bring your history", "Import Letterboxd and Goodreads once, then keep it yours."],
] as const;

const socialDirectory = [
  { label: "Instagram", href: "https://www.instagram.com/uday.agarwal26/" },
  { label: "Goodreads", href: "https://www.goodreads.com/user/show/174831125-uday-agarwal" },
  { label: "Letterboxd", href: "https://letterboxd.com/Uday2611/" },
  { label: "Twitter", href: "https://x.com/AgarwalUday26" },
] as const;

const heroTiles = [
  { className: styles.heroTile1, src: "/images/cosmos_1335304847.jpeg" },
  { className: styles.heroTile2, src: "/images/cosmos_1423649926.jpeg" },
  { className: styles.heroTile3, src: "/images/cosmos_1787164284.jpeg" },
  { className: styles.heroTile4, src: "/images/cosmos_1281293179.jpeg" },
  { className: styles.heroTile5, src: "/images/cosmos_1301929845.jpeg" },
  { className: styles.heroTile6, src: "/images/cosmos_2050115722.jpeg" },
  { className: styles.heroTile7, src: "/images/cosmos_283664499.jpeg" },
  { className: styles.heroTile8, src: "/images/cosmos_987046112.jpeg" },
  { className: styles.heroTile9, src: "/images/cosmos_418996863.jpeg" },
] as const;

export function LandingExperience() {
  return (
    <main className={styles.page} data-landing-root>
      <LandingRevealObserver />
      <a className={styles.skipLink} href="#story">Skip to the story</a>

      <section className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.heroMosaic} data-reveal>
          {heroTiles.map((tile) => (
            <figure
              className={`${styles.heroTile} ${tile.className}`}
              key={tile.src}
            >
              <Image
                alt=""
                fill
                loading="eager"
                sizes="(max-width: 640px) 50vw, 34vw"
                src={tile.src}
              />
            </figure>
          ))}

          <div className={styles.heroEdition}>
            <span>Private archive · Est. 2026</span>
            <span>Films · Series · Books</span>
          </div>

          <div className={styles.heroTitleBlock}>
            <h1 id="landing-title">Almanac</h1>
            <span className={styles.heroRule} aria-hidden="true" />
            <span className={styles.heroIssue}>01</span>
          </div>

          <div className={styles.heroFootnote}>
            <p>A private space for what you watch, read, and want to remember.</p>
            <Link href="/login">Enter Almanac <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <div id="story">
        <section className={styles.statementSection} aria-labelledby="statement-title">
          <p data-reveal>A private cultural archive</p>
          <h2 id="statement-title" data-reveal>Every entry keeps a world.</h2>
          <span data-reveal>
            Your collections, your notes, your connections. Searchable, considered, yours.
          </span>
        </section>

        <section className={styles.processSection} aria-labelledby="process-title">
          <header className={styles.processHeader} data-reveal>
            <span>The private ledger</span>
            <h2 id="process-title">
              Keep what moved you<br />and return when it changes.
            </h2>
          </header>

          <div className={styles.processGrid}>
            <article className={styles.processTextCell} data-reveal>
              <div><span>01</span><h3>Discover a title</h3></div>
              <footer><span>Films · series · books</span><i aria-hidden="true" /></footer>
            </article>

            <article className={`${styles.processImageCell} ${styles.processImageOne}`} data-reveal>
              <Image alt="A film poster set against dense woodland" fill sizes="(max-width: 640px) 100vw, 50vw" src="/images/cosmos_1065735536.jpeg" />
              <div><span>02</span><h3>Save it in seconds</h3></div>
              <strong>ONE</strong>
              <footer><span>One living entry</span><i aria-hidden="true" /></footer>
            </article>

            <article className={styles.processTextCell} data-reveal>
              <div><span>03</span><h3>Finish the work</h3></div>
              <footer><span>Watchlist → watched</span><i aria-hidden="true" /></footer>
            </article>

            <article className={`${styles.processImageCell} ${styles.processImageTwo}`} data-reveal>
              <Image alt="A quiet cinematic poster of two figures held close" fill sizes="(max-width: 640px) 100vw, 50vw" src="/images/cosmos_576186231.jpeg" />
              <div><span>04</span><h3>Add the memory</h3></div>
              <footer><span>Review · rating · date</span><i aria-hidden="true" /></footer>
            </article>

            <article className={styles.processTextCell} data-reveal>
              <div><span>05</span><h3>Link it with tags</h3></div>
              <footer><span>Reusable connections</span><i aria-hidden="true" /></footer>
            </article>

            <article className={`${styles.processImageCell} ${styles.processImageThree}`} data-reveal>
              <Image alt="An archival film image with soft botanical detail" fill sizes="(max-width: 640px) 100vw, 25vw" src="/images/cosmos_1831969347.jpeg" />
              <div><span>06</span><h3>Return years later</h3></div>
              <footer><span>Your archive stays yours</span><i aria-hidden="true" /></footer>
            </article>
          </div>
        </section>

        <section className={styles.featureSection} aria-labelledby="features-title">
          <header className={styles.featureHeader} data-reveal>
            <span>Inside Almanac</span>
            <div>
              <h2 id="features-title">One quiet place for everything worth remembering.</h2>
              <p>
                Almanac turns scattered watchlists, reading lists, and private thoughts into
                one considered cultural record.
              </p>
            </div>
          </header>

          <div className={styles.featureGrid}>
            <article data-reveal>
              <figure className={`${styles.featureVisual} ${styles.featureLog}`}>
                <Image
                  alt="A monochrome cinematic figure in motion"
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  src="/images/cosmos_1552553325.jpeg"
                />
                <div className={styles.logSlip}>
                  <span>Perfect Days</span>
                  <strong>14.09</strong>
                  <small>Watched · 2023</small>
                </div>
              </figure>
              <h3>Minimal logging</h3>
              <p>Find a film, series, or book, save the essential details, and move on.</p>
            </article>

            <article data-reveal>
              <figure className={`${styles.featureVisual} ${styles.featureTags}`}>
                <Image
                  alt="A monochrome city landscape viewed from above"
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  src="/images/cosmos_1494056299.jpeg"
                />
                <div className={styles.tagIndex} aria-label="Example reusable tags">
                  <span>ritual</span><i aria-hidden="true">/</i>
                  <span>solitude</span><i aria-hidden="true">/</i>
                  <span>light</span>
                </div>
              </figure>
              <h3>Reusable tags</h3>
              <p>Follow the same connection across films, series, and books.</p>
            </article>

            <article data-reveal>
              <figure className={`${styles.featureVisual} ${styles.featureNote}`}>
                <Image
                  alt="A dark film poster with a figure framed by a box"
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  src="/images/cosmos_1712722043.jpeg"
                />
                <blockquote>
                  <p>Attention turns repetition into ritual.</p>
                  <footer>Private note · 14 Sep 2026</footer>
                </blockquote>
              </figure>
              <h3>Archive Notes</h3>
              <p>Keep the thought behind the rating without publishing a performance.</p>
            </article>
          </div>
        </section>

        <section className={styles.previewSection} aria-labelledby="preview-title">
          <header className={styles.previewHeader} data-reveal>
            <span>Inside Almanac</span>
            <div>
              <h2 id="preview-title">Your archive, at any size.</h2>
              <p>Browse by image or return to the quiet clarity of a list. The collection stays yours on every screen.</p>
            </div>
          </header>

          <div className={styles.previewSpread}>
            <figure className={styles.previewDesktop} data-reveal>
              <Image
                alt="Almanac desktop collection showing a horizontal rail of saved film and series posters"
                height={937}
                sizes="(max-width: 700px) 100vw, 72vw"
                src="/images/Screenshot 2026-09-21 194357.png"
                width={1920}
              />
              <figcaption><span>Desktop</span><span>Image view</span></figcaption>
            </figure>
            <figure className={styles.previewMobile} data-reveal>
              <Image
                alt="Almanac mobile collection showing saved titles, dates, creators, and text filters in list view"
                height={2223}
                sizes="(max-width: 700px) 68vw, 22vw"
                src="/images/almanac-mobile.jpg"
                width={1170}
              />
              <figcaption><span>Mobile</span><span>List view</span></figcaption>
            </figure>
          </div>
        </section>

        <section className={styles.editorialSection} aria-labelledby="editorial-title">
          <header className={styles.editorialHeader} data-reveal>
            <span>Works that stay</span>
            <h2 id="editorial-title">The image stays with you, too.</h2>
            <p>Posters, covers, and scenes become part of how we remember what we watched and read.</p>
          </header>
          <div className={styles.editorialGallery}>
            <figure className={`${styles.editorialImage} ${styles.editorialPoster}`} data-reveal>
              <Image alt="La La Land film poster at a dark theatre" fill sizes="(max-width: 700px) 48vw, 22vw" src="/images/cosmos_1768234398.jpeg" />
            </figure>
            <figure className={`${styles.editorialImage} ${styles.editorialStill}`} data-reveal>
              <Image alt="Three people gathered at a table, seen through a large window" fill sizes="(max-width: 700px) 100vw, 57vw" src="/images/cosmos_1037838399.jpeg" />
            </figure>
            <figure className={`${styles.editorialImage} ${styles.editorialBook}`} data-reveal>
              <Image alt="Cover of A Breath of Life by Clarice Lispector" fill sizes="(max-width: 700px) 48vw, 21vw" src="/images/cosmos_688297974.jpeg" />
            </figure>
          </div>
        </section>

        <LandingPrinciples />

        <section className={styles.differenceSection} aria-labelledby="difference-title">
          <div className={styles.differenceIntro} data-reveal>
            <p>Why Almanac</p>
            <h2 id="difference-title">A ledger,<br />not a feed.</h2>
            <span>Most logging tools turn taste into public activity. Almanac removes the audience.</span>
          </div>

          <div className={styles.differenceList} data-reveal>
            {differences.map(([title, description]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.closingSection} aria-labelledby="closing-title">
          <span data-reveal>Almanac</span>
          <h2 id="closing-title" data-reveal>Your archive is waiting.</h2>
          <p data-reveal>Begin with one film, series, or book.</p>
          <Link className={styles.primaryAction} href="/login" data-reveal>
            Enter Almanac <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerFrame}>
          <div className={styles.footerMain}>
            <div className={styles.footerBrand}>
              <span className={`${styles.footerWordmark} almanac-wordmark`}>Almanac</span>
              <p>A private place for the films, series, and books that stay with you.</p>
              <div className={styles.footerSocials} aria-label="Social directory">
                {socialDirectory.map((social) => (
                  <a href={social.href} key={social.label} rel="noreferrer" target="_blank">
                    {social.label}<span className={styles.externalArrow} aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </div>
            <div className={styles.footerLinks}>
              <h2>Explore</h2>
              <Link href="/login">Sign in</Link>
              <a href="https://github.com/Uday-2611/almanac" rel="noreferrer" target="_blank">
                Project source <span className={styles.externalArrow} aria-hidden="true">↗</span>
              </a>
            </div>
            <div className={styles.footerContact}>
              <h2>Contact</h2>
              <p>Questions, thoughts, or a note about Almanac.</p>
              <CopyContactEmail />
            </div>
          </div>
          <div className={styles.footerColophon}>
            <span>Films · Series · Books</span>
            <span>Private by design</span>
            <span>© 2026 Almanac</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
