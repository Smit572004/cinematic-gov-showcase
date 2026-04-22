import { useEffect, useRef, useState } from "react";

/**
 * Instagram Landing Page — React port of the original public/ig.html.
 * Self-contained (no Navbar/Footer), scoped CSS via a unique root class so
 * styles don't leak into the rest of the app, and now fully editable via
 * Visual Edits.
 */
const IgLandingPage = () => {
  const mainVisible = true;
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

  // ---- Cinematic effects: reveals, word splits, parallax, tilt, aurora ----
  useEffect(() => {
    if (!mainVisible) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Staggered reveal
    const io = new IntersectionObserver(
      (entries) => {
        const groups = new Map<Element, Element[]>();
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const parent = e.target.parentElement || document.body;
          if (!groups.has(parent)) groups.set(parent, []);
          groups.get(parent)!.push(e.target);
        });
        groups.forEach((els) => {
          els.forEach((el, i) => {
            const base = parseInt((el as HTMLElement).dataset.delay || "0", 10);
            (el as HTMLElement).style.setProperty("--d", base + i * 110 + "ms");
            el.classList.add("in");
            io.unobserve(el);
          });
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".ig-page .reveal").forEach((el) => io.observe(el));

    // Word splitting for [data-words] headings
    document.querySelectorAll<HTMLElement>(".ig-page [data-words]").forEach((h) => {
      if (h.dataset.split === "1") return;
      h.dataset.split = "1";
      const wrap = document.createElement("span");
      wrap.className = "word-reveal";
      const frag = document.createDocumentFragment();
      let wi = 0;
      const stagger = 70;
      Array.from(h.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          (node.textContent || "").split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const s = document.createElement("span");
            s.className = "w";
            s.style.setProperty("--wd", wi * stagger + "ms");
            s.textContent = part;
            frag.appendChild(s);
            wi++;
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const s = document.createElement("span");
          s.className = "w";
          s.style.setProperty("--wd", wi * stagger + "ms");
          s.appendChild(node.cloneNode(true));
          frag.appendChild(s);
          wi++;
        }
      });
      wrap.appendChild(frag);
      h.innerHTML = "";
      h.appendChild(wrap);
      const wordIO = new IntersectionObserver(
        (es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              wrap.classList.add("in");
              wordIO.unobserve(h);
            }
          });
        },
        { threshold: 0.2 }
      );
      wordIO.observe(h);
    });

    // Hero parallax
    const hero = heroRef.current;
    const heroInner = hero?.querySelector<HTMLElement>(".hero-inner") || null;
    const orbs = hero ? hero.querySelectorAll<HTMLElement>(".orb") : ([] as unknown as NodeListOf<HTMLElement>);
    const layers = hero
      ? hero.querySelectorAll<HTMLElement>("[data-layer]")
      : ([] as unknown as NodeListOf<HTMLElement>);
    let scrolling = false;
    const onScroll = () => {
      if (scrolling || reduce) return;
      scrolling = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const h = window.innerHeight;
        const t = Math.min(y / h, 1.2);
        if (hero) hero.style.setProperty("--py", `${-y * 0.18}px`);
        orbs.forEach((o) => {
          const d = parseFloat(o.dataset.depth || "0.05");
          o.style.transform = `translate3d(${y * d * 0.4}px, ${-y * d}px, 0) scale(${1 + t * 0.05})`;
        });
        if (heroInner) heroInner.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
        layers.forEach((el) => {
          const l = parseFloat(el.dataset.layer || "0.4");
          el.style.opacity = String(Math.max(0, 1 - t * (0.5 + l * 0.5)));
        });
        scrolling = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Inject the scoped ::before transform style (only once)
    let injectedStyle: HTMLStyleElement | null = null;
    if (!reduce) {
      injectedStyle = document.createElement("style");
      injectedStyle.textContent = `.ig-page .hero::before { transform: translate3d(0, var(--py, 0px), 0) scale(1.12); }`;
      document.head.appendChild(injectedStyle);
    }

    // 3D pointer tilt (desktop)
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const tiltCleanups: Array<() => void> = [];
    if (!reduce && !isCoarse) {
      document.querySelectorAll<HTMLElement>(".ig-page [data-tilt]").forEach((el) => {
        let raf = 0;
        const move = (ev: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const x = (ev.clientX - r.left) / r.width;
          const y = (ev.clientY - r.top) / r.height;
          const rx = (0.5 - y) * 10;
          const ry = (x - 0.5) * 12;
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
            el.style.setProperty("--mx", x * 100 + "%");
            el.style.setProperty("--my", y * 100 + "%");
          });
        };
        const leave = () => {
          el.style.transform = "";
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        tiltCleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    // Mobile subtle tilt on scroll
    let mobileTilt: IntersectionObserver | null = null;
    if (!reduce && isCoarse) {
      mobileTilt = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const r = e.target.getBoundingClientRect();
            const center = window.innerHeight / 2;
            const offset = (r.top + r.height / 2 - center) / center;
            (e.target as HTMLElement).style.transform = `perspective(900px) rotateX(${offset * 4}deg)`;
          });
        },
        { threshold: Array.from({ length: 11 }, (_, i) => i / 10) }
      );
      document.querySelectorAll(".ig-page .card").forEach((c) => mobileTilt!.observe(c));
    }

    // Aurora light follows scroll
    let aurRaf = 0;
    const auroraScroll = () => {
      cancelAnimationFrame(aurRaf);
      aurRaf = requestAnimationFrame(() => {
        const p = Math.min(
          1,
          window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight)
        );
        document.body.style.setProperty("--aur-x", 20 + p * 60 + "%");
        document.body.style.setProperty("--aur-y", 15 + p * 70 + "%");
      });
    };
    if (!reduce) window.addEventListener("scroll", auroraScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", auroraScroll);
      io.disconnect();
      mobileTilt?.disconnect();
      tiltCleanups.forEach((fn) => fn());
      if (injectedStyle && injectedStyle.parentNode) injectedStyle.parentNode.removeChild(injectedStyle);
    };
  }, [mainVisible]);

  const year = new Date().getFullYear();

  return (
    <>
      <style>{IG_STYLES}</style>

      {/* Access gate */}
      {gateOpen && (
        <div id="ig-gate" className="ig-gate show" role="dialog" aria-modal="true">
          <div className="box">
            <h1>Willkommen 👋</h1>
            <p>
              Diese Seite ist eigentlich für unsere Instagram-Besucher gedacht. Du kannst sie
              trotzdem ansehen — viel Spaß beim Stöbern!
            </p>
            <button
              type="button"
              className="gate-btn"
              onClick={() => {
                try {
                  localStorage.setItem("ig_ok", "1");
                } catch {
                  /* ignore */
                }
                setGateOpen(false);
                setMainVisible(true);
              }}
            >
              Seite ansehen →
            </button>
          </div>
        </div>
      )}

      {mainVisible && (
        <main className="ig-page" id="ig-main">
          {/* HERO */}
          <section className="hero" data-parallax ref={heroRef}>
            <span className="orb o1" data-depth="0.05"></span>
            <span className="orb o2" data-depth="0.09"></span>
            <span className="orb o3" data-depth="0.07"></span>
            <div className="hero-inner">
              <span className="eyebrow reveal reveal-blur" data-layer="0.4">
                <span className="dot"></span> Direkt vom Erzeuger · Magdeburg
              </span>
              <h1 className="reveal reveal-blur" data-layer="0.8" data-words>
                Frische Pflanzen direkt vom Erzeuger –{" "}
                <span className="accent">nur 15 Minuten</span> von Magdeburg
              </h1>
              <p className="lead reveal" data-layer="0.5">
                Bessere Qualität. Bessere Preise. Direkt aus dem Gewächshaus.
              </p>
              <div className="cta-row reveal reveal-zoom" data-layer="0.3">
                <a href="#offers" className="btn btn-primary">
                  Angebote ansehen →
                </a>
                <a href="#location" className="btn btn-ghost">
                  So findest du uns
                </a>
              </div>
            </div>
            <div className="scroll-hint">
              <span></span>scroll
            </div>
          </section>

          {/* OFFERS */}
          <section id="offers" className="offers-bg section-zoom reveal">
            <div className="container">
              <div className="section-head reveal">
                <span className="section-tag">Angebote</span>
                <h2>Erzeugerpreise — direkt zu dir</h2>
                <p>Faire Preise statt Großhandel. Hier kommt eine kleine Auswahl unserer Saisonpflanzen.</p>
              </div>
              <div className="grid">
                <div className="card reveal reveal-zoom tilt" data-tilt>
                  <span className="shine"></span>
                  <span className="badge">Tomaten</span>
                  <h3>Tomatenpflanzen</h3>
                  <p className="desc">Veredelte und samenechte Sorten — kräftige Jungpflanzen.</p>
                  <div className="price">
                    ab €0,88<small>/ Stück</small>
                  </div>
                </div>
                <div className="card reveal reveal-zoom tilt" data-tilt>
                  <span className="shine"></span>
                  <span className="badge">Paprika</span>
                  <h3>Paprikapflanzen</h3>
                  <p className="desc">Süß und scharf — handverlesen, im Gewächshaus aufgezogen.</p>
                  <div className="price">
                    €1,20<small>/ Stück</small>
                  </div>
                </div>
                <div className="card reveal reveal-zoom tilt" data-tilt>
                  <span className="shine"></span>
                  <span className="badge">Zucchini</span>
                  <h3>Zucchini</h3>
                  <p className="desc">Robust, ertragreich und perfekt für Garten oder Hochbeet.</p>
                  <div className="price">
                    €1,25<small>/ Stück</small>
                  </div>
                </div>
              </div>
              <p className="producer-banner reveal">— Direkt vom Erzeuger — keine Zwischenhändler —</p>
            </div>
          </section>

          {/* GALLERY */}
          <section className="section-zoom reveal">
            <div className="container">
              <div className="section-head reveal">
                <span className="section-tag">Einblicke</span>
                <h2>Aus dem Gewächshaus</h2>
              </div>
              <div className="gallery">
                <div className="tile wide reveal reveal-zoom">
                  <img loading="lazy" src="/ig-seedlings.jpg" alt="Bunte Jungpflanzen im Gewächshaus" />
                </div>
                <div className="tile reveal reveal-left">
                  <img loading="lazy" src="/ig-pansies.jpg" alt="Blühende Stiefmütterchen in vielen Farben" />
                </div>
                <div className="tile reveal reveal-right">
                  <img loading="lazy" src="/ig-flowers.jpg" alt="Petunien und Husarenknopf" />
                </div>
              </div>
            </div>
          </section>

          {/* HOURS + LOCATION */}
          <section id="location" className="offers-bg section-zoom reveal">
            <div className="container">
              <div className="section-head reveal">
                <span className="section-tag">Besuch uns</span>
                <h2>Öffnungszeiten & Standort</h2>
              </div>
              <div className="split">
                <div className="panel reveal">
                  <h3>Öffnungszeiten</h3>
                  <ul className="hours-list">
                    <li><span className="day">Montag</span><span className="time">9:00 – 18:00</span></li>
                    <li><span className="day">Dienstag</span><span className="time">9:00 – 18:00</span></li>
                    <li><span className="day">Mittwoch</span><span className="time">9:00 – 18:00</span></li>
                    <li><span className="day">Donnerstag</span><span className="time">9:00 – 18:00</span></li>
                    <li><span className="day">Freitag</span><span className="time">9:00 – 18:00</span></li>
                    <li><span className="day">Samstag</span><span className="time">9:00 – 18:00</span></li>
                    <li className="closed"><span className="day">Sonntag</span><span className="time">Geschlossen</span></li>
                  </ul>
                </div>
                <div className="panel reveal">
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
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer>
            <div className="logo">TinPlant 🌱</div>
            <div className="contact">
              Magdeburger Landstraße 33 · 39164 Wanzleben-Börde<br />
              <a href="tel:+4900000000000">+49 (0) 0000 000 000</a>
            </div>
            <div className="copy">© {year} TinPlant — Direkt vom Erzeuger</div>
          </footer>
        </main>
      )}
    </>
  );
};

export default IgLandingPage;

/* ---- Scoped CSS for the IG landing page (everything under .ig-page) ---- */
const IG_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700;900&family=Inter:wght@400;500;600;700&display=swap');

.ig-page {
  --bg-1: #fffdf8; --bg-2: #fff5ec; --bg-3: #fdeef7; --cream: #ffffff;
  --ink: #1a1530; --ink-soft: #4a3f5e; --ink-mute: #7a6f8a;
  --yellow: #ffd233; --yellow-soft: #fff0a8; --orange: #ff8a3d; --orange-soft: #ffc9a3;
  --pink: #ff6fae; --pink-soft: #ffc4dd; --red: #ff5a5a; --red-soft: #ffb3b3;
  --purple: #b67aff; --purple-soft: #e0c8ff; --green: #4ec57a; --green-soft: #b8f0c8;
  --teal: #2dd4bf; --teal-soft: #a8f0e8;
  --soft: rgba(255,255,255,0.65); --line: rgba(26,21,48,0.08); --line-strong: rgba(26,21,48,0.14);
  --shadow: 0 24px 60px -22px rgba(182,122,255,.35);
  --shadow-soft: 0 14px 40px -18px rgba(255,111,174,.3);
  --radius: 22px;
  font-family: 'Inter', system-ui, -apple-system, Segoe UI, sans-serif;
  color: var(--ink); line-height: 1.55; -webkit-font-smoothing: antialiased;
  display: block;
}
.ig-page * { box-sizing: border-box; }
.ig-page h1, .ig-page h2, .ig-page h3 { font-family: 'Fraunces', Georgia, serif; font-weight: 700; letter-spacing: -0.02em; line-height: 1.05; margin: 0; }
.ig-page p { margin: 0; }
.ig-page ul { margin: 0; padding: 0; }
.ig-page a { color: inherit; text-decoration: none; }
.ig-page img { max-width: 100%; display: block; }

/* Body background only when the IG page is mounted */
body.ig-page-body {
  background: var(--bg-1, #fffdf8);
  background-image:
    radial-gradient(ellipse 60% 50% at 8% 0%, rgba(255,210,51,.28), transparent 60%),
    radial-gradient(ellipse 55% 45% at 95% 8%, rgba(255,111,174,.25), transparent 60%),
    radial-gradient(ellipse 50% 40% at 50% 35%, rgba(182,122,255,.16), transparent 60%),
    radial-gradient(ellipse 60% 50% at 0% 60%, rgba(78,197,122,.18), transparent 60%),
    radial-gradient(ellipse 60% 50% at 100% 80%, rgba(255,138,61,.22), transparent 60%),
    radial-gradient(ellipse 50% 40% at 50% 100%, rgba(45,212,191,.18), transparent 60%);
  overflow-x: hidden;
}
body.ig-page-body::before {
  content: ""; position: fixed; inset: -20vh -20vw; z-index: -1; pointer-events: none;
  background:
    radial-gradient(ellipse 50% 35% at var(--aur-x, 30%) var(--aur-y, 20%), rgba(255,210,51,.18), transparent 60%),
    radial-gradient(ellipse 45% 35% at calc(100% - var(--aur-x, 30%)) calc(100% - var(--aur-y, 20%)), rgba(255,111,174,.16), transparent 60%);
  transition: background 2s linear;
  animation: igAuroraDrift 22s ease-in-out infinite alternate;
}
body.ig-page-body::after {
  content: ""; position: fixed; inset: 0; z-index: 9998; pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  opacity: .055; mix-blend-mode: multiply;
  animation: igGrainShift 1.2s steps(3) infinite;
}
@keyframes igAuroraDrift {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(2vw, 3vh, 0) scale(1.05); }
  100% { transform: translate3d(-2vw, -2vh, 0) scale(1.02); }
}
@keyframes igGrainShift {
  0% { transform: translate(0, 0); } 33% { transform: translate(-4px, 3px); }
  66% { transform: translate(3px, -2px); } 100% { transform: translate(0, 0); }
}

/* Gate */
.ig-gate {
  position: fixed; inset: 0; z-index: 9999;
  display: none; align-items: center; justify-content: center;
  background:
    radial-gradient(ellipse at 25% 20%, rgba(255,210,51,.4), transparent 55%),
    radial-gradient(ellipse at 75% 80%, rgba(255,111,174,.4), transparent 55%),
    #fffdf8;
  color: #1a1530; padding: 24px; text-align: center;
  font-family: 'Inter', system-ui, sans-serif;
}
.ig-gate.show { display: flex; }
.ig-gate .box { max-width: 460px; }
.ig-gate h1 {
  font-family: 'Fraunces', Georgia, serif;
  font-size: clamp(28px, 5vw, 40px); margin-bottom: 14px;
  background: linear-gradient(135deg, #ff6fae, #ff8a3d);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ig-gate p { color: #4a3f5e; font-size: 15px; margin-bottom: 24px; }
.ig-gate .gate-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 28px; border-radius: 999px; border: 0; cursor: pointer;
  font-family: 'Inter', system-ui, sans-serif; font-weight: 700; font-size: 15px; color: #fff;
  background: linear-gradient(135deg, #ff6fae, #ff8a3d 55%, #ffd233);
  box-shadow: 0 16px 42px -10px rgba(255,111,174,.6);
  transition: transform .25s ease, box-shadow .25s ease, filter .25s ease;
}
.ig-gate .gate-btn:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 22px 52px -12px rgba(255,138,61,.7); }

/* Hero */
.ig-page .hero {
  position: relative; min-height: 100svh;
  display: flex; flex-direction: column; justify-content: center;
  padding: 72px 24px 48px; overflow: hidden; perspective: 1200px;
}
.ig-page .hero::before {
  content: ""; position: absolute; inset: 0;
  background: url('/ig-hero.jpg') center 40%/cover no-repeat;
  transform: scale(1.08); will-change: transform; z-index: 0;
  transition: transform .9s cubic-bezier(.2,.8,.2,1);
}
.ig-page .hero::after {
  content: ""; position: absolute; inset: 0; z-index: 1;
  background:
    linear-gradient(180deg, rgba(26,21,48,.15) 0%, rgba(26,21,48,.35) 55%, rgba(255,253,248,.96) 100%),
    linear-gradient(120deg, rgba(255,210,51,.18), rgba(255,111,174,.14) 40%, rgba(78,197,122,.18));
}
.ig-page .hero-inner { position: relative; z-index: 2; max-width: 980px; margin: 0 auto; width: 100%; transform-style: preserve-3d; }
.ig-page .hero-inner > * { transform: translateZ(0); transition: transform .8s cubic-bezier(.2,.8,.2,1); }
.ig-page .eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
  background: rgba(255,255,255,.92); border: 1px solid var(--line-strong);
  padding: 8px 14px; border-radius: 999px; backdrop-filter: blur(10px);
  color: var(--ink); font-weight: 700; margin-bottom: 22px;
  box-shadow: 0 6px 22px -10px rgba(255,111,174,.45);
}
.ig-page .eyebrow .dot { width: 7px; height: 7px; background: var(--pink); border-radius: 50%; box-shadow: 0 0 12px var(--pink); }
.ig-page .hero h1 {
  font-size: clamp(36px, 6.4vw, 76px); margin-bottom: 18px;
  color: #ffffff; text-shadow: 0 4px 26px rgba(26,21,48,.45), 0 1px 2px rgba(26,21,48,.35);
}
.ig-page .hero h1 .accent {
  font-style: italic; font-weight: 500;
  background: linear-gradient(135deg, var(--yellow), var(--pink) 55%, var(--orange));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  -webkit-text-fill-color: transparent; text-shadow: none;
}
.ig-page .hero p.lead {
  font-size: clamp(16px, 1.8vw, 20px); max-width: 560px;
  color: #ffffff; text-shadow: 0 2px 12px rgba(26,21,48,.5);
  margin-bottom: 32px; font-weight: 500;
}
.ig-page .cta-row { display: flex; flex-wrap: wrap; gap: 14px; }
.ig-page .btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 28px; border-radius: 999px;
  font-weight: 700; font-size: 15px;
  border: 1px solid transparent; cursor: pointer;
  transition: transform .25s ease, box-shadow .25s ease, filter .25s ease;
  will-change: transform; color: #fff;
}
.ig-page .btn-primary {
  background: linear-gradient(135deg, var(--pink), var(--orange) 55%, var(--yellow));
  box-shadow: 0 16px 42px -10px rgba(255,111,174,.6);
}
.ig-page .btn-primary:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 22px 52px -12px rgba(255,138,61,.7); }
.ig-page .btn-ghost {
  background: rgba(255,255,255,.95); color: var(--ink);
  border-color: var(--line-strong); backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px -10px rgba(26,21,48,.25);
}
.ig-page .btn-ghost:hover { background: #fff; transform: translateY(-2px); }

.ig-page .scroll-hint {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  z-index: 2; font-size: 11px; letter-spacing: .25em; text-transform: uppercase;
  color: var(--ink); display: flex; flex-direction: column; align-items: center; gap: 8px;
  font-weight: 700;
}
.ig-page .scroll-hint span { width: 1px; height: 28px; background: linear-gradient(180deg, transparent, var(--ink)); animation: igDrop 2s ease-in-out infinite; }
@keyframes igDrop { 0%,100% { transform: scaleY(.4); transform-origin: top; } 50% { transform: scaleY(1); } }

/* Hero orbs */
.ig-page .hero .orb {
  position: absolute; z-index: 1; border-radius: 50%;
  filter: blur(60px); opacity: .55; pointer-events: none; will-change: transform;
}
.ig-page .hero .orb.o1 { width: 380px; height: 380px; top: -80px; left: -60px; background: radial-gradient(circle, var(--yellow) 0%, transparent 65%); }
.ig-page .hero .orb.o2 { width: 320px; height: 320px; top: 30%; right: -80px; background: radial-gradient(circle, var(--pink) 0%, transparent 65%); }
.ig-page .hero .orb.o3 { width: 300px; height: 300px; bottom: -60px; left: 30%; background: radial-gradient(circle, var(--purple) 0%, transparent 65%); }

/* Sections */
.ig-page section { padding: clamp(64px, 9vw, 120px) 24px; position: relative; isolation: isolate; }
.ig-page section + section::before {
  content: ""; position: absolute; left: 0; right: 0; top: -1px; height: 120px;
  background: linear-gradient(180deg, rgba(255,253,248,0) 0%, rgba(255,253,248,.6) 60%, rgba(255,253,248,0) 100%);
  pointer-events: none; z-index: 1;
}
.ig-page .container { max-width: 1100px; margin: 0 auto; }
.ig-page .section-head { max-width: 720px; margin: 0 auto clamp(40px, 6vw, 64px); text-align: center; }
.ig-page .section-tag {
  font-size: 12px; letter-spacing: .2em; text-transform: uppercase;
  margin-bottom: 14px; display: inline-block;
  background: linear-gradient(135deg, var(--purple), var(--pink));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  font-weight: 700;
}
.ig-page .section-head h2 { font-size: clamp(32px, 4.8vw, 56px); margin-bottom: 14px; color: var(--ink); }
.ig-page .section-head p { color: var(--ink-soft); font-size: 17px; }

/* Offers */
.ig-page .offers-bg {
  background:
    radial-gradient(ellipse at 0% 0%, rgba(255,111,174,.22), transparent 50%),
    radial-gradient(ellipse at 100% 100%, rgba(78,197,122,.2), transparent 55%),
    radial-gradient(ellipse at 50% 50%, rgba(255,210,51,.12), transparent 60%),
    linear-gradient(180deg, var(--bg-2) 0%, var(--bg-3) 100%);
}
.ig-page .grid { display: grid; gap: 22px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); perspective: 1400px; }
.ig-page .card {
  background: rgba(255,255,255,.85);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 32px 28px;
  backdrop-filter: blur(14px);
  transition: transform .35s cubic-bezier(.2,.8,.2,1), border-color .3s ease, box-shadow .35s ease;
  position: relative; overflow: hidden;
  box-shadow: 0 12px 32px -16px rgba(26,21,48,.18);
  transform-style: preserve-3d;
}
.ig-page .card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--accent, var(--pink)); }
.ig-page .card:nth-child(1) { --accent: linear-gradient(90deg, var(--pink), var(--red)); }
.ig-page .card:nth-child(2) { --accent: linear-gradient(90deg, var(--yellow), var(--orange), var(--green)); }
.ig-page .card:nth-child(3) { --accent: linear-gradient(90deg, var(--purple), var(--teal)); }
.ig-page .card:hover { box-shadow: 0 32px 60px -22px rgba(182,122,255,.45); }
.ig-page .card .badge, .ig-page .card h3, .ig-page .card .price, .ig-page .card .desc { transform: translateZ(28px); transition: transform .35s cubic-bezier(.2,.8,.2,1); }
.ig-page .card .badge {
  display: inline-block; font-size: 11px; letter-spacing: .15em; text-transform: uppercase;
  padding: 5px 12px; border-radius: 999px; margin-bottom: 16px; font-weight: 700;
}
.ig-page .card:nth-child(1) .badge { background: var(--pink-soft); color: #b32a6a; }
.ig-page .card:nth-child(2) .badge { background: var(--yellow-soft); color: #8a6500; }
.ig-page .card:nth-child(3) .badge { background: var(--purple-soft); color: #5d2db2; }
.ig-page .card h3 { font-size: 26px; margin-bottom: 8px; color: var(--ink); }
.ig-page .card .price {
  font-family: 'Fraunces', serif; font-size: 44px; font-weight: 700;
  line-height: 1; margin: 18px 0 6px;
  background: linear-gradient(135deg, var(--pink), var(--red));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ig-page .card:nth-child(2) .price { background: linear-gradient(135deg, var(--orange), var(--green)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.ig-page .card:nth-child(3) .price { background: linear-gradient(135deg, var(--purple), var(--teal)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.ig-page .card .price small { font-size: 14px; color: var(--ink-mute); font-weight: 500; margin-left: 4px; -webkit-text-fill-color: var(--ink-mute); }
.ig-page .card .desc { color: var(--ink-soft); font-size: 14px; }
.ig-page .card .shine {
  position: absolute; inset: 0; pointer-events: none; opacity: 0;
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,.55), transparent 45%);
  transition: opacity .4s ease; mix-blend-mode: overlay;
}
.ig-page .card:hover .shine { opacity: 1; }

.ig-page .producer-banner {
  text-align: center; margin-top: 40px;
  font-size: 13px; letter-spacing: .25em; text-transform: uppercase; font-weight: 700;
  background: linear-gradient(135deg, var(--orange), var(--pink), var(--purple));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

/* Gallery */
.ig-page .gallery { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); perspective: 1600px; }
.ig-page .gallery .tile {
  border-radius: var(--radius); overflow: hidden; aspect-ratio: 4/5;
  border: 1px solid var(--line-strong); position: relative;
  background: var(--bg-2); box-shadow: 0 12px 28px -16px rgba(26,21,48,.25);
  transform: translateZ(0) rotateX(0deg);
  transition: transform .6s cubic-bezier(.2,.8,.2,1), box-shadow .5s ease;
  will-change: transform;
}
.ig-page .gallery .tile img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s cubic-bezier(.2,.8,.2,1); }
.ig-page .gallery .tile:hover { transform: translateZ(40px) rotateX(2deg) rotateY(-2deg); box-shadow: 0 40px 80px -30px rgba(26,21,48,.45); }
.ig-page .gallery .tile:hover img { transform: scale(1.06); }
.ig-page .gallery .tile.wide { aspect-ratio: 16/10; grid-column: span 2; }
@media (max-width: 600px) { .ig-page .gallery .tile.wide { grid-column: span 1; aspect-ratio: 4/5; } }

/* Hours + Location */
.ig-page .split { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
@media (max-width: 800px) { .ig-page .split { grid-template-columns: 1fr; } }
.ig-page .panel {
  background: rgba(255,255,255,.88);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  padding: 36px 32px; backdrop-filter: blur(14px);
  box-shadow: 0 14px 36px -20px rgba(26,21,48,.22);
}
.ig-page .panel h3 {
  font-size: 24px; margin-bottom: 18px;
  background: linear-gradient(135deg, var(--green), var(--teal));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ig-page .panel:nth-of-type(2) h3 {
  background: linear-gradient(135deg, var(--orange), var(--pink));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ig-page .hours-list { list-style: none; }
.ig-page .hours-list li {
  display: flex; justify-content: space-between; padding: 14px 0;
  border-bottom: 1px solid var(--line); font-size: 16px; color: var(--ink);
}
.ig-page .hours-list li:last-child { border-bottom: 0; }
.ig-page .hours-list .day { font-weight: 500; }
.ig-page .hours-list .time { color: #1a8c79; font-variant-numeric: tabular-nums; font-weight: 600; }
.ig-page .hours-list li.closed .time { color: var(--ink-mute); }

.ig-page .map-wrap {
  border-radius: var(--radius); overflow: hidden;
  border: 1px solid var(--line-strong); aspect-ratio: 16/10;
  margin-top: 20px; background: var(--bg-2);
}
.ig-page .map-wrap iframe { width: 100%; height: 100%; border: 0; }
.ig-page .address { font-size: 16px; line-height: 1.7; color: var(--ink); }
.ig-page .address strong { color: #c44a16; display: block; margin-bottom: 4px; }

/* Footer */
.ig-page footer {
  padding: 48px 24px 36px; text-align: center;
  border-top: 1px solid var(--line);
  background: var(--bg-2);
  position: relative; overflow: hidden;
}
.ig-page footer::before {
  content: ""; position: absolute; inset: -50% -10% auto -10%; height: 280px;
  background: radial-gradient(ellipse at center, rgba(255,111,174,.25), transparent 70%);
  filter: blur(40px); pointer-events: none; z-index: 0;
}
.ig-page footer > * { position: relative; z-index: 1; }
.ig-page footer .logo {
  font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700;
  margin-bottom: 12px; letter-spacing: -.02em;
  background: linear-gradient(135deg, var(--pink), var(--orange), var(--yellow), var(--green), var(--purple));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ig-page footer .contact { font-size: 14px; color: var(--ink-soft); }
.ig-page footer .contact a { color: #c44a16; font-weight: 600; }
.ig-page footer .copy { font-size: 12px; color: var(--ink-mute); margin-top: 14px; }

/* Cinematic reveals */
.ig-page .reveal { opacity: 0; transform: translate3d(0, 44px, 0); transition: opacity 1.1s cubic-bezier(.16,.84,.24,1), transform 1.2s cubic-bezier(.16,.84,.24,1); will-change: transform, opacity; transition-delay: var(--d, 0ms); }
.ig-page .reveal.in { opacity: 1; transform: translate3d(0, 0, 0); }
.ig-page .reveal-left { transform: translate3d(-56px, 0, 0); }
.ig-page .reveal-right { transform: translate3d(56px, 0, 0); }
.ig-page .reveal-zoom { transform: scale(.9); }
.ig-page .reveal-zoom.in { transform: scale(1); }
.ig-page .reveal-blur { filter: blur(16px); transition: opacity 1.1s cubic-bezier(.16,.84,.24,1), transform 1.2s cubic-bezier(.16,.84,.24,1), filter 1.3s ease-out; }
.ig-page .reveal-blur.in { filter: blur(0); }

.ig-page .word-reveal { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: .12em; }
.ig-page .word-reveal .w { display: inline-block; transform: translate3d(0, 110%, 0) rotate(6deg); opacity: 0; transition: transform 1.05s cubic-bezier(.16,.84,.24,1), opacity .9s ease-out; transition-delay: var(--wd, 0ms); will-change: transform, opacity; }
.ig-page .word-reveal.in .w { transform: translate3d(0, 0, 0) rotate(0); opacity: 1; }

.ig-page .section-zoom { transform: scale(.985); transition: transform 1.4s cubic-bezier(.16,.84,.24,1); transform-origin: 50% 30%; }
.ig-page .section-zoom.in { transform: scale(1); }

@media (prefers-reduced-motion: reduce) {
  .ig-page .reveal, .ig-page .reveal-left, .ig-page .reveal-right, .ig-page .reveal-zoom, .ig-page .reveal-blur, .ig-page .section-zoom { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
  .ig-page .word-reveal .w { opacity: 1 !important; transform: none !important; transition: none !important; }
  .ig-page .hero::before { transform: none !important; }
  .ig-page .hero .orb { display: none; }
  .ig-page .card, .ig-page .gallery .tile { transform: none !important; transition: none !important; }
  body.ig-page-body::before, body.ig-page-body::after { animation: none !important; }
}
`;
