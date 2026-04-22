import { useEffect, useRef, useState } from "react";

/** Hours per weekday (0=Sun ... 6=Sat). null = closed. */
const HOURS: Record<number, { open: number; close: number } | null> = {
  0: null,
  1: { open: 9, close: 18 },
  2: { open: 9, close: 18 },
  3: { open: 9, close: 18 },
  4: { open: 9, close: 18 },
  5: { open: 9, close: 18 },
  6: { open: 9, close: 18 },
};

const LiveStatusBadge = () => {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const day = now.getDay();
  const hours = HOURS[day];
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const isOpen = !!hours && minsNow >= hours.open * 60 && minsNow < hours.close * 60;

  let label = "Geschlossen";
  if (isOpen && hours) {
    const closeMins = hours.close * 60 - minsNow;
    if (closeMins <= 60) label = `Schließt in ${closeMins} Min.`;
    else label = `Geöffnet · bis ${hours.close}:00`;
  } else {
    for (let i = 0; i < 7; i++) {
      const next = (day + i) % 7;
      const h = HOURS[next];
      if (!h) continue;
      if (i === 0 && minsNow < h.open * 60) {
        label = `Öffnet heute um ${h.open}:00`;
        break;
      }
      if (i > 0) {
        const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
        label = `Öffnet ${i === 1 ? "morgen" : dayNames[next]} um ${h.open}:00`;
        break;
      }
    }
  }

  return (
    <span className={`live-status ${isOpen ? "is-open" : "is-closed"}`} aria-live="polite">
      <span className="live-dot" aria-hidden="true" />
      {label}
    </span>
  );
};

/**
 * Instagram Landing Page — Earthy & Natural redesign.
 * Story-style snap-scroll sections, warm green/beige palette, organic shapes,
 * hand-drawn touches. All content (offers, gallery, location, footer) is
 * preserved from the previous version.
 */
const IgLandingPage = () => {
  const heroRef = useRef<HTMLElement | null>(null);

  // ---- Page meta + body class for scoped background ----
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Frische Pflanzen direkt vom Erzeuger – 15 Min. von Magdeburg";
    document.body.classList.add("ig-page-body");
    return () => {
      document.title = prevTitle;
      document.body.classList.remove("ig-page-body");
    };
  }, []);

  // ---- Reveal-on-scroll observer (no parallax / no orbs anymore) ----
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".ig-page .reveal").forEach((el) => io.observe(el));

    // Subtle leaf drift on hero — pure CSS handles motion;
    // we just attach a will-change hint when not reduced-motion.
    if (!reduce && heroRef.current) {
      heroRef.current.classList.add("hero-anim");
    }

    // Mark "today" in hours list
    const today = new Date().getDay();
    document.querySelectorAll<HTMLElement>(".ig-page .hours-list li").forEach((li) => {
      if (Number(li.dataset.day) === today) li.classList.add("is-today");
    });

    return () => io.disconnect();
  }, []);

  const year = new Date().getFullYear();

  return (
    <>
      <style>{IG_STYLES}</style>

      <main className="ig-page" id="ig-main">
        {/* ============== HERO ============== */}
        <section className="snap-section hero" ref={heroRef}>
          <div className="hero-photo" aria-hidden="true" />
          <div className="hero-photo-tint" aria-hidden="true" />

          {/* Floating leaves */}
          <svg className="leaf leaf-1" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M8 56 C 18 28, 40 18, 60 6 C 56 30, 38 50, 12 60 Z" fill="currentColor" opacity=".55" />
            <path d="M14 54 C 28 38, 44 26, 58 12" stroke="rgba(0,0,0,.15)" strokeWidth="1.4" fill="none" />
          </svg>
          <svg className="leaf leaf-2" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M8 56 C 18 28, 40 18, 60 6 C 56 30, 38 50, 12 60 Z" fill="currentColor" opacity=".45" />
          </svg>
          <svg className="leaf leaf-3" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M8 56 C 18 28, 40 18, 60 6 C 56 30, 38 50, 12 60 Z" fill="currentColor" opacity=".35" />
          </svg>

          <div className="hero-content reveal">
            <span className="eyebrow">
              <span className="eb-dot" /> Direkt vom Erzeuger · Magdeburg
            </span>
            <h1>
              Frische Pflanzen,
              <br />
              <span className="hand-underline">
                direkt aus dem Gewächshaus
                <svg viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M2 8 C 60 2, 130 12, 200 6 C 240 2, 280 8, 298 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="lead">
              Bessere Qualität. Faire Preise. Nur 15 Minuten von Magdeburg —
              gewachsen, nicht gehandelt.
            </p>
            <div className="cta-row">
              <a href="#offers" className="btn btn-primary">
                Angebote ansehen
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </a>
              <a href="#location" className="btn btn-ghost">So findest du uns</a>
            </div>
          </div>

          {/* Hand-drawn arrow scroll hint */}
          <a href="#offers" className="scroll-hint" aria-label="Weiter scrollen">
            <span>weiterlesen</span>
            <svg width="22" height="34" viewBox="0 0 22 34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 2 C 14 12, 8 22, 11 32" />
              <path d="M5 26 L 11 32 L 17 26" />
            </svg>
          </a>

          {/* Organic divider */}
          <svg className="divider-bottom" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 50 C 240 90, 480 10, 720 40 C 960 70, 1200 20, 1440 50 L 1440 80 L 0 80 Z" fill="var(--cream)" />
          </svg>
        </section>

        {/* ============== OFFERS ============== */}
        <section id="offers" className="snap-section section section-cream">
          <div className="container">
            <div className="section-head reveal">
              <span className="section-tag">
                <span className="tag-leaf" aria-hidden="true">🌱</span> Saisonangebote
              </span>
              <h2>Erzeugerpreise — direkt zu dir</h2>
              <p>Faire Preise statt Großhandel. Eine kleine Auswahl unserer Saisonpflanzen.</p>
            </div>
            <div className="grid">
              <article className="card reveal">
                <div className="card-illust" data-color="tomato">
                  <span className="illust-emoji" aria-hidden="true">🍅</span>
                </div>
                <span className="badge">Tomaten</span>
                <h3>Tomatenpflanzen</h3>
                <p className="desc">Veredelte und samenechte Sorten — kräftige Jungpflanzen.</p>
                <div className="price-row">
                  <span className="price">ab €0,88</span>
                  <span className="price-unit">/ Stück</span>
                </div>
              </article>
              <article className="card reveal">
                <div className="card-illust" data-color="pepper">
                  <span className="illust-emoji" aria-hidden="true">🌶️</span>
                </div>
                <span className="badge">Paprika</span>
                <h3>Paprikapflanzen</h3>
                <p className="desc">Süß und scharf — handverlesen, im Gewächshaus aufgezogen.</p>
                <div className="price-row">
                  <span className="price">€1,20</span>
                  <span className="price-unit">/ Stück</span>
                </div>
              </article>
              <article className="card reveal">
                <div className="card-illust" data-color="zucchini">
                  <span className="illust-emoji" aria-hidden="true">🥒</span>
                </div>
                <span className="badge">Zucchini</span>
                <h3>Zucchini</h3>
                <p className="desc">Robust, ertragreich und perfekt für Garten oder Hochbeet.</p>
                <div className="price-row">
                  <span className="price">€1,25</span>
                  <span className="price-unit">/ Stück</span>
                </div>
              </article>
            </div>
            <p className="producer-banner reveal">
              <span aria-hidden="true">— </span>Direkt vom Erzeuger · keine Zwischenhändler<span aria-hidden="true"> —</span>
            </p>
          </div>
        </section>

        {/* ============== GALLERY ============== */}
        <section className="snap-section section section-moss">
          <div className="container">
            <div className="section-head reveal">
              <span className="section-tag light">
                <span className="tag-leaf" aria-hidden="true">📸</span> Einblicke
              </span>
              <h2 className="on-dark">Aus dem Gewächshaus</h2>
              <p className="on-dark-soft">
                Echte Fotos. Echte Pflanzen. Gewachsen mit Sorgfalt vor deiner Haustür.
              </p>
            </div>
            <div className="gallery">
              <figure className="tile wide reveal">
                <img loading="lazy" src="/ig-seedlings.jpg" alt="Bunte Jungpflanzen im Gewächshaus" />
              </figure>
              <figure className="tile reveal">
                <img loading="lazy" src="/ig-pansies.jpg" alt="Blühende Stiefmütterchen in vielen Farben" />
              </figure>
              <figure className="tile reveal">
                <img loading="lazy" src="/ig-flowers.jpg" alt="Petunien und Husarenknopf" />
              </figure>
            </div>
          </div>
        </section>

        {/* ============== HOURS + LOCATION ============== */}
        <section id="location" className="snap-section section section-sand">
          <div className="container">
            <div className="section-head reveal">
              <span className="section-tag">
                <span className="tag-leaf" aria-hidden="true">📍</span> Besuch uns
              </span>
              <h2>Öffnungszeiten & Standort</h2>
              <p>Komm vorbei — wir freuen uns auf dich im Gewächshaus.</p>
            </div>
            <div className="split">
              <div className="panel hours-panel reveal">
                <div className="panel-head">
                  <h3>Öffnungszeiten</h3>
                  <LiveStatusBadge />
                </div>
                <ul className="hours-list">
                  <li data-day="1"><span className="day">Montag</span><span className="time">9:00 – 18:00</span></li>
                  <li data-day="2"><span className="day">Dienstag</span><span className="time">9:00 – 18:00</span></li>
                  <li data-day="3"><span className="day">Mittwoch</span><span className="time">9:00 – 18:00</span></li>
                  <li data-day="4"><span className="day">Donnerstag</span><span className="time">9:00 – 18:00</span></li>
                  <li data-day="5"><span className="day">Freitag</span><span className="time">9:00 – 18:00</span></li>
                  <li data-day="6"><span className="day">Samstag</span><span className="time">9:00 – 18:00</span></li>
                  <li className="closed" data-day="0"><span className="day">Sonntag</span><span className="time">Geschlossen</span></li>
                </ul>

                <div className="quick-actions">
                  <a className="qa-btn qa-call" href="tel:+4900000000000" aria-label="Anrufen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Anrufen
                  </a>
                  <a className="qa-btn qa-wa" href="https://wa.me/4900000000000?text=Hallo%20TinPlant%2C%20ich%20habe%20eine%20Frage%20zu%20euren%20Pflanzen." target="_blank" rel="noopener noreferrer" aria-label="WhatsApp schreiben">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.5 3.5A11.4 11.4 0 0 0 12 0C5.6 0 .4 5.2.4 11.6c0 2 .5 3.9 1.5 5.6L.3 24l7-1.8a11.6 11.6 0 0 0 4.7 1c6.4 0 11.6-5.2 11.6-11.6 0-3.1-1.2-6-3.1-8.1zM12 21.4a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-4.1 1.1 1.1-4-.3-.4a9.6 9.6 0 0 1-1.5-5.1c0-5.3 4.3-9.6 9.6-9.6 2.6 0 5 1 6.8 2.8a9.6 9.6 0 0 1 2.8 6.8c0 5.3-4.3 9.6-9.6 9.6zm5.5-7.2c-.3-.2-1.8-.9-2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0c-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5l.3-.5c.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.4-.3.4-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3 4.8 4.2 1.7.7 2.4.7 3.2.6.5-.1 1.6-.6 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4z"/>
                    </svg>
                    WhatsApp
                  </a>
                  <a className="qa-btn qa-mail" href="mailto:hallo@tinplant.de?subject=Anfrage%20Pflanzen" aria-label="E-Mail schreiben">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <polyline points="2,7 12,13 22,7"/>
                    </svg>
                    E-Mail
                  </a>
                </div>
              </div>

              <div className="panel address-panel reveal">
                <h3>So findest du uns</h3>
                <p className="address">
                  <strong>TinPlant Gewächshaus</strong>
                  Magdeburger Landstraße 33<br />
                  39164 Wanzleben-Börde
                </p>

                <div className="map-wrap">
                  <iframe
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src="https://www.google.com/maps?q=Magdeburger+Landstra%C3%9Fe+33,+39164+Wanzleben-B%C3%B6rde&output=embed"
                    title="Standort auf Google Maps"
                  />
                  <a
                    className="map-overlay-btn"
                    href="https://www.google.com/maps/dir/?api=1&destination=Magdeburger+Landstra%C3%9Fe+33%2C+39164+Wanzleben-B%C3%B6rde"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="In Google Maps öffnen"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    In Google Maps öffnen
                  </a>
                </div>

                <div className="route-actions">
                  <a
                    className="qa-btn qa-route"
                    href="https://www.google.com/maps/dir/?api=1&destination=Magdeburger+Landstra%C3%9Fe+33%2C+39164+Wanzleben-B%C3%B6rde&travelmode=driving"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor"/>
                    </svg>
                    Route
                  </a>
                  <a
                    className="qa-btn qa-apple"
                    href="https://maps.apple.com/?daddr=Magdeburger+Landstra%C3%9Fe+33,+39164+Wanzleben-B%C3%B6rde"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16.4 12.7c0-2.7 2.2-4 2.3-4-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.3 1-4.1 1-.9 0-2.1-1-3.6-.9-1.8 0-3.5 1.1-4.5 2.7-1.9 3.3-.5 8.2 1.4 10.9.9 1.3 2 2.8 3.5 2.7 1.4-.1 1.9-.9 3.6-.9 1.7 0 2.2.9 3.6.9 1.5 0 2.5-1.3 3.4-2.7.7-1 1-1.5 1.6-2.7-.1 0-3.3-1.3-3.3-4.9zM13.7 4.6c.7-.9 1.3-2.2 1.1-3.5-1.1.1-2.5.8-3.3 1.7-.7.8-1.4 2.1-1.2 3.4 1.2.1 2.6-.7 3.4-1.6z"/>
                    </svg>
                    Apple Maps
                  </a>
                  <a
                    className="qa-btn qa-share"
                    href="https://www.google.com/maps?q=Magdeburger+Landstra%C3%9Fe+33,+39164+Wanzleben-B%C3%B6rde"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const url = "https://www.google.com/maps?q=Magdeburger+Landstra%C3%9Fe+33,+39164+Wanzleben-B%C3%B6rde";
                      const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
                      if (typeof nav.share === "function") {
                        e.preventDefault();
                        nav.share({ title: "TinPlant Gewächshaus", text: "Magdeburger Landstraße 33, 39164 Wanzleben-Börde", url }).catch(() => {});
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>
                    </svg>
                    Teilen
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== FOOTER ============== */}
        <footer className="ig-footer">
          <div className="container footer-grid">
            <div className="footer-brand">
              <div className="logo">TinPlant <span aria-hidden="true">🌱</span></div>
              <p className="tagline">Direkt vom Erzeuger — gewachsen mit Sorgfalt.</p>
            </div>
            <div className="footer-contact">
              <p>Magdeburger Landstraße 33<br />39164 Wanzleben-Börde</p>
              <a href="tel:+4900000000000">+49 (0) 0000 000 000</a>
            </div>
            <div className="footer-copy">© {year} TinPlant</div>
          </div>
        </footer>
      </main>
    </>
  );
};

export default IgLandingPage;

/* ---- Scoped CSS (everything under .ig-page) ---- */
const IG_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap');

.ig-page {
  /* Earthy / natural palette */
  --cream: #f7f1e3;
  --cream-2: #efe6d2;
  --sand: #e8dcc1;
  --moss-1: #2f4a32;
  --moss-2: #3e6240;
  --moss-3: #5b7d52;
  --leaf: #8aa86b;
  --bark: #5a4632;
  --bark-soft: #8a6f54;
  --ink: #20221c;
  --ink-soft: #4a4a3e;
  --ink-mute: #7a7867;
  --tomato: #c9533a;
  --pepper: #d97a26;
  --line: rgba(32, 34, 28, 0.10);
  --line-strong: rgba(32, 34, 28, 0.18);
  --shadow-soft: 0 18px 40px -22px rgba(47, 74, 50, 0.45);
  --shadow: 0 28px 60px -28px rgba(32, 34, 28, 0.35);
  --radius: 22px;

  font-family: 'Inter', system-ui, -apple-system, Segoe UI, sans-serif;
  color: var(--ink);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  display: block;
}
.ig-page * { box-sizing: border-box; }
.ig-page h1, .ig-page h2, .ig-page h3 {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.08;
  margin: 0;
  color: var(--ink);
}
.ig-page p { margin: 0; }
.ig-page ul { margin: 0; padding: 0; list-style: none; }
.ig-page a { color: inherit; text-decoration: none; }
.ig-page img { max-width: 100%; display: block; }

/* Body background — warm cream + paper grain */
body.ig-page-body {
  background: var(--cream, #f7f1e3);
  background-image:
    radial-gradient(ellipse 60% 50% at 8% 0%, rgba(138, 168, 107, 0.18), transparent 60%),
    radial-gradient(ellipse 55% 45% at 95% 100%, rgba(90, 70, 50, 0.10), transparent 60%);
  overflow-x: hidden;
}
body.ig-page-body::before {
  content: ""; position: fixed; inset: 0; z-index: 9998; pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.18  0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  opacity: 0.05;
  mix-blend-mode: multiply;
}

/* Snap-scroll story sections */
.ig-page {
  scroll-snap-type: y proximity;
}
.ig-page .snap-section {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(72px, 9vw, 120px) 24px;
  overflow: hidden;
}
.ig-page .container {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

/* Reveal animation */
.ig-page .reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity .9s cubic-bezier(.2,.8,.2,1), transform .9s cubic-bezier(.2,.8,.2,1);
}
.ig-page .reveal.in {
  opacity: 1;
  transform: translateY(0);
}

/* ============== HERO ============== */
.ig-page .hero {
  background: linear-gradient(180deg, #2f4a32 0%, #3e6240 100%);
  color: #fffaf0;
  padding-top: clamp(80px, 10vw, 120px);
  padding-bottom: clamp(120px, 14vw, 180px);
}
.ig-page .hero h1, .ig-page .hero h3 { color: #fffaf0; }
.ig-page .hero-photo {
  position: absolute; inset: 0;
  background: url('/ig-hero.jpg') center 40% / cover no-repeat;
  opacity: 0.35;
  filter: saturate(.85) contrast(1.05);
}
.ig-page .hero-photo-tint {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(47, 74, 50, 0.2) 0%, rgba(32, 34, 28, 0.65) 70%),
    linear-gradient(180deg, rgba(47, 74, 50, 0.55) 0%, rgba(47, 74, 50, 0.85) 100%);
}
.ig-page .hero-content {
  position: relative; z-index: 3;
  max-width: 820px;
  text-align: center;
  margin: 0 auto;
  padding: 0 12px;
}
.ig-page .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  background: rgba(255, 250, 240, 0.12);
  border: 1px solid rgba(255, 250, 240, 0.3);
  padding: 8px 16px;
  border-radius: 999px;
  color: #fffaf0;
  font-weight: 600;
  margin-bottom: 28px;
  backdrop-filter: blur(8px);
}
.ig-page .eyebrow .eb-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--leaf);
  box-shadow: 0 0 10px var(--leaf);
}
.ig-page .hero h1 {
  font-size: clamp(38px, 6.4vw, 78px);
  font-weight: 700;
  margin-bottom: 22px;
  letter-spacing: -0.02em;
}
.ig-page .hand-underline {
  position: relative;
  display: inline-block;
  font-style: italic;
  font-weight: 500;
  color: #f5e7b8;
}
.ig-page .hand-underline svg {
  position: absolute;
  left: 0; right: 0; bottom: -10px;
  width: 100%; height: 12px;
  color: var(--leaf);
  opacity: 0;
  stroke-dasharray: 320;
  stroke-dashoffset: 320;
}
.ig-page .reveal.in .hand-underline svg {
  opacity: 1;
  animation: igDraw 1.4s cubic-bezier(.2,.8,.2,1) .6s forwards;
}
@keyframes igDraw { to { stroke-dashoffset: 0; } }

.ig-page .hero p.lead {
  font-size: clamp(16px, 1.7vw, 19px);
  max-width: 560px;
  margin: 0 auto 36px;
  color: rgba(255, 250, 240, 0.88);
  line-height: 1.6;
}

.ig-page .cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
}
.ig-page .btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 28px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 15px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease;
  font-family: inherit;
}
.ig-page .btn-primary {
  background: var(--cream);
  color: var(--moss-1);
  box-shadow: 0 14px 30px -12px rgba(0, 0, 0, 0.4);
}
.ig-page .btn-primary:hover {
  transform: translateY(-2px);
  background: #fffaf0;
  box-shadow: 0 18px 38px -14px rgba(0, 0, 0, 0.5);
}
.ig-page .btn-ghost {
  background: transparent;
  color: #fffaf0;
  border-color: rgba(255, 250, 240, 0.45);
}
.ig-page .btn-ghost:hover {
  background: rgba(255, 250, 240, 0.1);
  border-color: rgba(255, 250, 240, 0.7);
  transform: translateY(-2px);
}

/* Floating leaves */
.ig-page .leaf {
  position: absolute;
  color: var(--leaf);
  z-index: 2;
  pointer-events: none;
}
.ig-page .leaf-1 { width: 90px; top: 12%; left: 6%; transform: rotate(-15deg); }
.ig-page .leaf-2 { width: 70px; top: 22%; right: 8%; transform: rotate(40deg); }
.ig-page .leaf-3 { width: 110px; bottom: 18%; right: 14%; transform: rotate(-30deg); color: #c0d49a; }
.ig-page.ig-page .hero-anim .leaf-1 { animation: igLeafA 8s ease-in-out infinite; }
.ig-page.ig-page .hero-anim .leaf-2 { animation: igLeafB 9s ease-in-out infinite; }
.ig-page.ig-page .hero-anim .leaf-3 { animation: igLeafA 11s ease-in-out infinite reverse; }
@keyframes igLeafA {
  0%, 100% { transform: rotate(-15deg) translate(0, 0); }
  50%      { transform: rotate(-8deg) translate(8px, -10px); }
}
@keyframes igLeafB {
  0%, 100% { transform: rotate(40deg) translate(0, 0); }
  50%      { transform: rotate(48deg) translate(-6px, 8px); }
}

/* Scroll hint */
.ig-page .scroll-hint {
  position: absolute;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  color: rgba(255, 250, 240, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  font-weight: 600;
  transition: opacity .25s ease, transform .25s ease;
}
.ig-page .scroll-hint:hover { opacity: 1; transform: translate(-50%, -3px); }
.ig-page .scroll-hint svg { animation: igFloat 2.4s ease-in-out infinite; }
@keyframes igFloat {
  0%, 100% { transform: translateY(0); opacity: .85; }
  50%      { transform: translateY(5px); opacity: 1; }
}

/* Organic divider */
.ig-page .divider-bottom {
  position: absolute;
  left: 0; right: 0; bottom: -1px;
  width: 100%;
  height: 80px;
  z-index: 4;
  pointer-events: none;
}

/* ============== SECTION DEFAULTS ============== */
.ig-page .section { padding: clamp(72px, 9vw, 120px) 24px; }
.ig-page .section-cream { background: var(--cream); }
.ig-page .section-sand  { background: var(--sand); }
.ig-page .section-moss  {
  background: linear-gradient(180deg, var(--moss-2) 0%, var(--moss-1) 100%);
  color: #fffaf0;
}

.ig-page .section-head {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 56px;
}
.ig-page .section-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--moss-1);
  background: rgba(138, 168, 107, 0.18);
  border: 1px solid rgba(138, 168, 107, 0.35);
  padding: 7px 14px;
  border-radius: 999px;
  margin-bottom: 18px;
}
.ig-page .section-tag.light {
  color: #f5e7b8;
  background: rgba(255, 250, 240, 0.1);
  border-color: rgba(255, 250, 240, 0.25);
}
.ig-page .section-tag .tag-leaf { font-size: 13px; }
.ig-page .section-head h2 {
  font-size: clamp(30px, 4.6vw, 52px);
  margin-bottom: 14px;
}
.ig-page .section-head h2.on-dark { color: #fffaf0; }
.ig-page .section-head p {
  font-size: clamp(15px, 1.4vw, 17px);
  color: var(--ink-soft);
  max-width: 560px;
  margin: 0 auto;
}
.ig-page .section-head p.on-dark-soft { color: rgba(255, 250, 240, 0.82); }

/* ============== OFFERS / CARDS ============== */
.ig-page .grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
.ig-page .card {
  background: #fffaf0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0 28px 28px;
  position: relative;
  box-shadow: var(--shadow-soft);
  transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease;
  overflow: hidden;
}
.ig-page .card:hover {
  transform: translateY(-6px) rotate(-0.4deg);
  box-shadow: var(--shadow);
}
.ig-page .card-illust {
  margin: 0 -28px 22px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.ig-page .card-illust[data-color="tomato"]   { background: linear-gradient(135deg, #f6dcd2, #ecb8a6); }
.ig-page .card-illust[data-color="pepper"]   { background: linear-gradient(135deg, #f5e0c4, #e9c191); }
.ig-page .card-illust[data-color="zucchini"] { background: linear-gradient(135deg, #d8e6c4, #b8d098); }
.ig-page .card-illust::after {
  content: ""; position: absolute; inset: -20%;
  background-image: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 50%);
  pointer-events: none;
}
.ig-page .illust-emoji {
  font-size: 64px;
  line-height: 1;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.18));
  transition: transform .4s cubic-bezier(.2,.8,.2,1);
  position: relative; z-index: 1;
}
.ig-page .card:hover .illust-emoji { transform: scale(1.1) rotate(-6deg); }

.ig-page .badge {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(47, 74, 50, 0.1);
  color: var(--moss-1);
  font-weight: 700;
  margin-bottom: 12px;
}
.ig-page .card h3 {
  font-size: 26px;
  margin-bottom: 8px;
}
.ig-page .card .desc {
  color: var(--ink-soft);
  font-size: 14.5px;
  margin-bottom: 18px;
}
.ig-page .price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding-top: 16px;
  border-top: 1px dashed var(--line-strong);
}
.ig-page .price {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--moss-1);
}
.ig-page .price-unit {
  font-size: 13px;
  color: var(--ink-mute);
}
.ig-page .producer-banner {
  text-align: center;
  margin-top: 56px;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 15px;
  color: var(--bark);
  letter-spacing: 0.04em;
}

/* ============== GALLERY ============== */
.ig-page .gallery {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, 1fr);
}
.ig-page .tile {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 22px 50px -22px rgba(0, 0, 0, 0.5);
  margin: 0;
  background: var(--moss-1);
  aspect-ratio: 4 / 3;
  transition: transform .5s cubic-bezier(.2,.8,.2,1);
}
.ig-page .tile.wide { grid-column: 1 / -1; aspect-ratio: 16 / 7; }
.ig-page .tile img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .8s cubic-bezier(.2,.8,.2,1);
}
.ig-page .tile:hover { transform: translateY(-4px); }
.ig-page .tile:hover img { transform: scale(1.05); }

/* ============== HOURS + LOCATION ============== */
.ig-page .split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}
.ig-page .panel {
  background: #fffaf0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 36px 32px;
  box-shadow: var(--shadow-soft);
}
.ig-page .panel h3 {
  font-size: 24px;
  margin-bottom: 22px;
  color: var(--moss-1);
}
.ig-page .hours-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed var(--line);
  font-size: 15px;
}
.ig-page .hours-list li:last-child { border-bottom: none; }
.ig-page .hours-list .day { font-weight: 600; color: var(--ink); }
.ig-page .hours-list .time { color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.ig-page .hours-list li.closed .time {
  color: var(--tomato);
  font-weight: 600;
}
.ig-page .address {
  color: var(--ink-soft);
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 22px;
}
.ig-page .address strong {
  display: block;
  color: var(--ink);
  font-family: 'Fraunces', Georgia, serif;
  font-size: 19px;
  margin-bottom: 6px;
  font-weight: 700;
}
.ig-page .map-wrap {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--line);
  aspect-ratio: 4 / 3;
}
.ig-page .map-wrap iframe {
  width: 100%; height: 100%; border: 0;
  filter: saturate(.85) hue-rotate(-10deg);
}

/* ============== FOOTER ============== */
.ig-page .ig-footer {
  background: var(--moss-1);
  color: rgba(255, 250, 240, 0.85);
  padding: 60px 24px 40px;
}
.ig-page .footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 32px;
  align-items: center;
}
.ig-page .footer-brand .logo {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 28px;
  font-weight: 700;
  color: #fffaf0;
  margin-bottom: 6px;
}
.ig-page .footer-brand .tagline {
  font-style: italic;
  font-size: 14px;
  color: rgba(255, 250, 240, 0.7);
}
.ig-page .footer-contact {
  font-size: 14px;
  line-height: 1.7;
}
.ig-page .footer-contact a {
  display: inline-block;
  margin-top: 8px;
  color: var(--leaf);
  font-weight: 600;
  border-bottom: 1px dashed currentColor;
}
.ig-page .footer-copy {
  text-align: right;
  font-size: 13px;
  color: rgba(255, 250, 240, 0.55);
}

/* ============== RESPONSIVE ============== */
@media (max-width: 820px) {
  .ig-page .split { grid-template-columns: 1fr; }
  .ig-page .gallery { grid-template-columns: 1fr; }
  .ig-page .tile.wide { aspect-ratio: 4 / 3; }
  .ig-page .footer-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .ig-page .footer-copy { text-align: center; }
  .ig-page .leaf-1 { width: 60px; }
  .ig-page .leaf-2 { width: 50px; }
  .ig-page .leaf-3 { width: 70px; }
}

@media (prefers-reduced-motion: reduce) {
  .ig-page .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .ig-page .leaf,
  .ig-page .scroll-hint svg,
  .ig-page .hand-underline svg { animation: none !important; }
  .ig-page .hand-underline svg { stroke-dashoffset: 0 !important; opacity: 1 !important; }
}
`;
