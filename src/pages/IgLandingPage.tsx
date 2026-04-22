import { useEffect, useMemo, useRef, useState } from "react";
import logoWhite from "@/assets/tinplant-logo-white.png";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  HOUR_KEYS,
  parseHours,
  useIgContent,
  useIgGallery,
  useIgOffers,
} from "@/hooks/useIgContent";

type LangKey = "de" | "en";

/* ---------------- Helpers ---------------- */

const pick = (
  content: Record<string, { value_de: string; value_en: string }> | undefined,
  key: string,
  lang: LangKey,
  fallback = "",
): string => {
  const row = content?.[key];
  if (!row) return fallback;
  return (lang === "de" ? row.value_de : row.value_en) || row.value_de || fallback;
};

const pad = (s: string) => s.padStart(5, "0");

const minutesFromHHMM = (s: string): number => {
  const [h, m] = s.split(":").map(Number);
  if (Number.isNaN(h)) return 0;
  return h * 60 + (m || 0);
};

const formatHHMM = (s: string): string => {
  // "9:00" -> "9:00", "09:00" -> "9:00" — keep as user typed but strip leading 0
  if (!s) return s;
  const [h, m] = s.split(":");
  const hi = parseInt(h, 10);
  return `${Number.isNaN(hi) ? h : hi}:${m ?? "00"}`;
};

/* ---------------- Live status badge (data-driven) ---------------- */

type StatusTemplates = {
  closed: string;
  openUntil: string; // uses {time}
  closesIn: string; // uses {minutes}
  opensToday: string; // uses {time}
  opensTomorrow: string; // uses {time}
  opensOn: string; // uses {day} and {time}
  dayShort: string[]; // Sun..Sat
};

const fillTemplate = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

const LiveStatusBadge = ({
  hours,
  templates,
}: {
  hours: ({ open: string; close: string } | null)[];
  templates: StatusTemplates;
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const day = now.getDay(); // 0 = Sunday
  const today = hours[day];
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const isOpen =
    !!today &&
    minsNow >= minutesFromHHMM(today.open) &&
    minsNow < minutesFromHHMM(today.close);

  let label = templates.closed;
  if (isOpen && today) {
    const closeMins = minutesFromHHMM(today.close) - minsNow;
    if (closeMins <= 60)
      label = fillTemplate(templates.closesIn, { minutes: closeMins });
    else label = fillTemplate(templates.openUntil, { time: formatHHMM(today.close) });
  } else {
    for (let i = 0; i < 7; i++) {
      const next = (day + i) % 7;
      const h = hours[next];
      if (!h) continue;
      const openMins = minutesFromHHMM(h.open);
      if (i === 0 && minsNow < openMins) {
        label = fillTemplate(templates.opensToday, { time: formatHHMM(h.open) });
        break;
      }
      if (i > 0) {
        if (i === 1) {
          label = fillTemplate(templates.opensTomorrow, { time: formatHHMM(h.open) });
        } else {
          label = fillTemplate(templates.opensOn, {
            day: templates.dayShort[next] ?? "",
            time: formatHHMM(h.open),
          });
        }
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

/* ---------------- Sticky nav with animated indicator ---------------- */

type NavItem = { id: string; label: string };

const StickyIgNav = ({
  items,
  ariaLabel,
  activeSection,
  navScrolled,
  logo,
}: {
  items: NavItem[];
  ariaLabel: string;
  activeSection: string;
  navScrolled: boolean;
  logo: string;
}) => {
  const linksWrapRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });

  useEffect(() => {
    const measure = () => {
      const wrap = linksWrapRef.current;
      const el = linkRefs.current[activeSection];
      if (!wrap || !el) {
        setIndicator((p) => ({ ...p, visible: false }));
        return;
      }
      const wrapBox = wrap.getBoundingClientRect();
      const elBox = el.getBoundingClientRect();
      setIndicator({
        left: elBox.left - wrapBox.left,
        width: elBox.width,
        visible: true,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeSection, items]);

  return (
    <nav
      className={`hero-nav sticky-nav ${navScrolled ? "is-scrolled" : ""}`}
      aria-label={ariaLabel}
    >
      <a href="#ig-main" className="hn-logo" aria-label="TinPlant">
        <img src={logo} alt="TinPlant" />
      </a>
      <span className="hn-divider" aria-hidden="true" />
      <div className="hn-links" ref={linksWrapRef}>
        <span
          className="hn-indicator"
          aria-hidden="true"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
            opacity: indicator.visible ? 1 : 0,
          }}
        />
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            ref={(el) => {
              linkRefs.current[it.id] = el;
            }}
            className={`hn-link ${activeSection === it.id ? "is-active" : ""}`}
          >
            <span className="hn-dot" aria-hidden="true" />
            <span className="hn-label">{it.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};

/* ---------------- Page ---------------- */

const IgLandingPage = () => {
  const { lang } = useLanguage();
  const heroRef = useRef<HTMLElement | null>(null);

  const { data: content } = useIgContent();
  const { data: offers = [] } = useIgOffers();
  const { data: gallery = [] } = useIgGallery();

  // Hours indexed Sun..Sat
  const hoursByDay = useMemo(
    () => HOUR_KEYS.map((k) => parseHours(content?.[k]?.value_de)),
    [content],
  );

  // Active offers and gallery (admin already controls is_active server-side, but be safe)
  const activeOffers = useMemo(() => offers.filter((o) => o.is_active), [offers]);
  const activeGallery = useMemo(() => gallery.filter((g) => g.is_active && g.image_url), [gallery]);

  // ---- Page meta ----
  useEffect(() => {
    const prevTitle = document.title;
    document.title =
      lang === "de"
        ? "Frische Pflanzen direkt vom Erzeuger – 15 Min. von Magdeburg"
        : "Fresh plants direct from the grower — 15 min from Magdeburg";
    document.body.classList.add("ig-page-body");
    return () => {
      document.title = prevTitle;
      document.body.classList.remove("ig-page-body");
    };
  }, [lang]);

  // ---- Reveal-on-scroll observer ----
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
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".ig-page .reveal").forEach((el) => io.observe(el));
    if (!reduce && heroRef.current) heroRef.current.classList.add("hero-anim");

    const today = new Date().getDay();
    document.querySelectorAll<HTMLElement>(".ig-page .hours-list li").forEach((li) => {
      if (Number(li.dataset.day) === today) li.classList.add("is-today");
    });

    return () => io.disconnect();
  }, [content, activeOffers.length, activeGallery.length]);

  const year = new Date().getFullYear();

  /* Resolved content shortcuts */
  const heroPhoto = pick(content, "ig_hero_image_url", "de", "/ig-hero.jpg");
  const heroEyebrow = pick(content, "ig_hero_eyebrow", lang, "Direkt vom Erzeuger · Magdeburg");
  const heroTitleA = pick(content, "ig_hero_title_a", lang, "Frische Pflanzen direkt");
  const heroTitleB = pick(
    content,
    "ig_hero_title_b",
    lang,
    lang === "de" ? "vom Erzeuger – {{nur 15 Minuten}} von Magdeburg" : "from the grower — {{just 15 minutes}} from Magdeburg",
  );
  const heroLead = pick(
    content,
    "ig_hero_lead",
    lang,
    "Bessere Qualität. Faire Preise. Nur 15 Minuten von Magdeburg — gewachsen, nicht gehandelt.",
  );
  const ctaPrimary = pick(content, "ig_hero_cta_primary", lang, "Angebote ansehen");
  const ctaGhost = pick(content, "ig_hero_cta_ghost", lang, "So findest du uns");

  const offersEyebrow = pick(content, "ig_offers_eyebrow", lang, "Saisonangebote");
  const offersTitle = pick(content, "ig_offers_title", lang, "Erzeugerpreise — direkt zu dir");
  const offersSubtitle = pick(content, "ig_offers_subtitle", lang, "");
  const offersBanner = pick(content, "ig_offers_banner", lang, "");

  const galleryEyebrow = pick(content, "ig_gallery_eyebrow", lang, "Einblicke");
  const galleryTitle = pick(content, "ig_gallery_title", lang, "Aus dem Gewächshaus");
  const gallerySubtitle = pick(content, "ig_gallery_subtitle", lang, "");

  const locEyebrow = pick(content, "ig_location_eyebrow", lang, "Besuch uns");
  const locTitle = pick(content, "ig_location_title", lang, "Öffnungszeiten & Standort");
  const locSubtitle = pick(content, "ig_location_subtitle", lang, "");

  const addrName = pick(content, "ig_address_name", lang, "TinPlant Gewächshaus");
  const addrStreet = pick(content, "ig_address_street", lang, "Magdeburger Landstraße 33");
  const addrCity = pick(content, "ig_address_city", lang, "39164 Wanzleben-Börde");
  const phoneDisplay = pick(content, "ig_contact_phone", lang, "+49 39209 69 69 0");
  const phoneTel = pick(content, "ig_contact_phone_tel", "de", "+493920969690");
  const whatsappNumber = pick(content, "ig_contact_whatsapp", "de", "+493920969690").replace(
    /[^0-9]/g,
    "",
  );
  const email = pick(content, "ig_contact_email", "de", "info@tinplant-gmbh.de");
  const mapQuery =
    pick(content, "ig_map_query", "de", "Magdeburger Landstraße 33, 39164 Wanzleben-Börde");
  const footerTagline = pick(
    content,
    "ig_footer_tagline",
    lang,
    "Direkt vom Erzeuger — gewachsen mit Sorgfalt.",
  );

  const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const mapDir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;
  const mapApple = `https://maps.apple.com/?daddr=${encodeURIComponent(mapQuery)}`;
  const mapShare = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`;

  const dayLabelsDe = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const dayLabelsEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayLabels = lang === "de" ? dayLabelsDe : dayLabelsEn;
  // Display order: Mon..Sun
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  const closedLabel = lang === "de" ? "Geschlossen" : "Closed";

  // ---- Scroll spy for sticky nav ----
  const [activeSection, setActiveSection] = useState<string>("ig-main");
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const ids = ["ig-main", "offers", "location", "contact"];
    const onScroll = () => {
      setNavScrolled(window.scrollY > 40);
      const probe = window.innerHeight * 0.35;
      let current = "ig-main";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= probe) current = id;
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [content]);

  return (
    <>
      <style>{IG_STYLES}</style>

      <main className="ig-page" id="ig-main">
        {/* ============== STICKY NAV ============== */}
        <StickyIgNav
          lang={lang as LangKey}
          activeSection={activeSection}
          navScrolled={navScrolled}
          logo={logoWhite}
        />

        {/* ============== HERO ============== */}
        <section className="snap-section hero" ref={heroRef}>
          <div
            className="hero-photo"
            aria-hidden="true"
            style={{ backgroundImage: `url('${heroPhoto}')` }}
          />
          <div className="hero-photo-tint" aria-hidden="true" />

          <div className="hero-content reveal">
            <span className="eyebrow">
              <span className="eb-dot" /> {heroEyebrow}
            </span>
            <h1>
              {heroTitleA}
              <br />
              {(() => {
                const m = heroTitleB.match(/^(.*?)\{\{(.+?)\}\}(.*)$/);
                if (m) {
                  return (
                    <>
                      {m[1]}
                      <span className="title-accent">{m[2]}</span>
                      {m[3]}
                    </>
                  );
                }
                return heroTitleB;
              })()}
            </h1>
            <p className="lead">{heroLead}</p>
            <div className="cta-row">
              <a href="#offers" className="btn btn-primary">
                {ctaPrimary}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </a>
              <a href="#location" className="btn btn-ghost">{ctaGhost}</a>
            </div>
          </div>

          <a href="#offers" className="scroll-hint" aria-label={lang === "de" ? "Weiter scrollen" : "Scroll down"}>
            <span className="scroll-line" aria-hidden="true" />
            <span className="scroll-text">{lang === "de" ? "SCROLL" : "SCROLL"}</span>
          </a>

          <svg className="divider-bottom" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 50 C 240 90, 480 10, 720 40 C 960 70, 1200 20, 1440 50 L 1440 80 L 0 80 Z" fill="var(--cream)" />
          </svg>
        </section>

        {/* ============== OFFERS ============== */}
        {activeOffers.length > 0 && (
          <section id="offers" className="snap-section section section-cream">
            <div className="container">
              <div className="section-head reveal">
                <span className="section-tag">
                  <span className="tag-leaf" aria-hidden="true">🌱</span> {offersEyebrow}
                </span>
                <h2>{offersTitle}</h2>
                {offersSubtitle && <p>{offersSubtitle}</p>}
              </div>
              <div className="grid">
                {activeOffers.map((o) => {
                  const title = lang === "de" ? o.title_de : o.title_en || o.title_de;
                  const desc = lang === "de" ? o.description_de : o.description_en || o.description_de;
                  const badge = lang === "de" ? o.badge_de : o.badge_en || o.badge_de;
                  return (
                    <article key={o.id} className="card reveal">
                      <div className="card-illust" data-color={o.color_tag}>
                        <span className="illust-emoji" aria-hidden="true">{o.emoji}</span>
                      </div>
                      {badge && <span className="badge">{badge}</span>}
                      <h3>{title}</h3>
                      {desc && <p className="desc">{desc}</p>}
                      {(o.price_text || o.unit_text) && (
                        <div className="price-row">
                          {o.price_text && <span className="price">{o.price_text}</span>}
                          {o.unit_text && <span className="price-unit">{o.unit_text}</span>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              {offersBanner && (
                <p className="producer-banner reveal">
                  <span aria-hidden="true">— </span>{offersBanner}<span aria-hidden="true"> —</span>
                </p>
              )}
            </div>
          </section>
        )}

        {/* ============== GALLERY ============== */}
        {activeGallery.length > 0 && (
          <section className="snap-section section section-moss">
            <div className="container">
              <div className="section-head reveal">
                <span className="section-tag light">
                  <span className="tag-leaf" aria-hidden="true">📸</span> {galleryEyebrow}
                </span>
                <h2 className="on-dark">{galleryTitle}</h2>
                {gallerySubtitle && <p className="on-dark-soft">{gallerySubtitle}</p>}
              </div>
              <div className="gallery">
                {activeGallery.map((g) => {
                  const alt = lang === "de" ? g.title_de : g.title_en || g.title_de;
                  return (
                    <figure key={g.id} className={`tile reveal ${g.span === "wide" ? "wide" : ""}`}>
                      <img loading="lazy" src={g.image_url!} alt={alt} />
                    </figure>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ============== HOURS + LOCATION ============== */}
        <section id="location" className="snap-section section section-sand">
          <div className="container">
            <div className="section-head reveal">
              <span className="section-tag">
                <span className="tag-leaf" aria-hidden="true">📍</span> {locEyebrow}
              </span>
              <h2>{locTitle}</h2>
              {locSubtitle && <p>{locSubtitle}</p>}
            </div>
            <div className="split">
              <div className="panel hours-panel reveal">
                <div className="panel-head">
                  <h3>{lang === "de" ? "Öffnungszeiten" : "Hours"}</h3>
                  <LiveStatusBadge hours={hoursByDay} lang={lang as LangKey} />
                </div>
                <ul className="hours-list">
                  {displayOrder.map((dayIdx) => {
                    const h = hoursByDay[dayIdx];
                    return (
                      <li key={dayIdx} className={h ? "" : "closed"} data-day={dayIdx}>
                        <span className="day">{dayLabels[dayIdx]}</span>
                        <span className="time">
                          {h ? `${formatHHMM(h.open)} – ${formatHHMM(h.close)}` : closedLabel}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="quick-actions">
                  <a className="qa-btn qa-call" href={`tel:${phoneTel}`} aria-label="Anrufen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {lang === "de" ? "Anrufen" : "Call"}
                  </a>
                  <a
                    className="qa-btn qa-wa"
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      lang === "de"
                        ? "Hallo TinPlant, ich habe eine Frage zu euren Pflanzen."
                        : "Hello TinPlant, I have a question about your plants.",
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.5 3.5A11.4 11.4 0 0 0 12 0C5.6 0 .4 5.2.4 11.6c0 2 .5 3.9 1.5 5.6L.3 24l7-1.8a11.6 11.6 0 0 0 4.7 1c6.4 0 11.6-5.2 11.6-11.6 0-3.1-1.2-6-3.1-8.1zM12 21.4a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-4.1 1.1 1.1-4-.3-.4a9.6 9.6 0 0 1-1.5-5.1c0-5.3 4.3-9.6 9.6-9.6 2.6 0 5 1 6.8 2.8a9.6 9.6 0 0 1 2.8 6.8c0 5.3-4.3 9.6-9.6 9.6zm5.5-7.2c-.3-.2-1.8-.9-2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0c-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5l.3-.5c.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.4-.3.4-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3 4.8 4.2 1.7.7 2.4.7 3.2.6.5-.1 1.6-.6 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4z"/>
                    </svg>
                    WhatsApp
                  </a>
                  <a className="qa-btn qa-mail" href={`mailto:${email}?subject=${encodeURIComponent(lang === "de" ? "Anfrage Pflanzen" : "Plant inquiry")}`} aria-label="E-Mail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <polyline points="2,7 12,13 22,7"/>
                    </svg>
                    {lang === "de" ? "E-Mail" : "Email"}
                  </a>
                </div>
              </div>

              <div className="panel address-panel reveal">
                <h3>{lang === "de" ? "So findest du uns" : "How to find us"}</h3>
                <p className="address">
                  <strong>{addrName}</strong>
                  {addrStreet}<br />
                  {addrCity}
                </p>

                <div className="map-wrap">
                  <iframe
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={mapEmbed}
                    title="Standort auf Google Maps"
                  />
                  <a
                    className="map-overlay-btn"
                    href={mapDir}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="In Google Maps öffnen"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {lang === "de" ? "In Google Maps öffnen" : "Open in Google Maps"}
                  </a>
                </div>

                <div className="route-actions">
                  <a className="qa-btn qa-route" href={`${mapDir}&travelmode=driving`} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor"/>
                    </svg>
                    {lang === "de" ? "Route" : "Route"}
                  </a>
                  <a className="qa-btn qa-apple" href={mapApple} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16.4 12.7c0-2.7 2.2-4 2.3-4-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.3 1-4.1 1-.9 0-2.1-1-3.6-.9-1.8 0-3.5 1.1-4.5 2.7-1.9 3.3-.5 8.2 1.4 10.9.9 1.3 2 2.8 3.5 2.7 1.4-.1 1.9-.9 3.6-.9 1.7 0 2.2.9 3.6.9 1.5 0 2.5-1.3 3.4-2.7.7-1 1-1.5 1.6-2.7-.1 0-3.3-1.3-3.3-4.9zM13.7 4.6c.7-.9 1.3-2.2 1.1-3.5-1.1.1-2.5.8-3.3 1.7-.7.8-1.4 2.1-1.2 3.4 1.2.1 2.6-.7 3.4-1.6z"/>
                    </svg>
                    Apple Maps
                  </a>
                  <a
                    className="qa-btn qa-share"
                    href={mapShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
                      if (typeof nav.share === "function") {
                        e.preventDefault();
                        nav.share({ title: addrName, text: `${addrStreet}, ${addrCity}`, url: mapShare }).catch(() => {});
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>
                    </svg>
                    {lang === "de" ? "Teilen" : "Share"}
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
              <a href="/" className="footer-logo" aria-label="TinPlant">
                <img src={logoWhite} alt="TinPlant" />
              </a>
              <p className="tagline">{footerTagline}</p>
            </div>
            <div className="footer-contact">
              <p>{addrStreet}<br />{addrCity}</p>
              <a href={`tel:${phoneTel}`}>{phoneDisplay}</a>
            </div>
            <div className="footer-copy">© {year} TinPlant</div>
          </div>
        </footer>
      </main>
    </>
  );
};

export default IgLandingPage;

// keep `pad` export-free but referenced (tree-shake friendly noop)
void pad;

/* ---- Scoped CSS (everything under .ig-page) ---- */
const IG_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap');

.ig-page {
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

.ig-page { scroll-snap-type: y proximity; }
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
.ig-page .container { width: 100%; max-width: 1120px; margin: 0 auto; position: relative; z-index: 2; }

.ig-page .reveal { opacity: 0; transform: translateY(28px); transition: opacity .9s cubic-bezier(.2,.8,.2,1), transform .9s cubic-bezier(.2,.8,.2,1); }
.ig-page .reveal.in { opacity: 1; transform: translateY(0); }

/* HERO */
.ig-page .hero {
  background: linear-gradient(180deg, #2f4a32 0%, #3e6240 100%);
  color: #fffaf0;
  padding-top: clamp(80px, 10vw, 120px);
  padding-bottom: clamp(120px, 14vw, 180px);
}
.ig-page .hero h1, .ig-page .hero h3 { color: #fffaf0; }
.ig-page .hero-photo {
  position: absolute; inset: 0;
  background-position: center 40%;
  background-size: cover;
  background-repeat: no-repeat;
  opacity: 0.35;
  filter: saturate(.85) contrast(1.05);
}
.ig-page .hero-photo-tint {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.15) 55%, rgba(0, 0, 0, 0) 80%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.55) 100%);
}
.ig-page .hero-content {
  position: relative; z-index: 3;
  max-width: 1240px; width: 100%;
  text-align: left; margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 64px);
}
.ig-page .hero-nav {
  position: fixed; top: 0; left: 0; right: 0; transform: none;
  z-index: 50; display: flex; flex-direction: row; align-items: center;
  gap: 6px; padding: 12px 28px; border-radius: 0;
  background: rgba(20, 32, 22, 0.32);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.20);
  transition: background .3s ease, border-color .3s ease, box-shadow .3s ease, padding .3s ease;
}
.ig-page .hero-nav.is-scrolled {
  background: rgba(20, 32, 22, 0.82);
  border-bottom-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.32);
  padding: 8px 28px;
}
.ig-page .hn-logo {
  display: inline-flex; align-items: center; padding: 2px 6px 2px 4px;
  border-radius: 999px; transition: transform .25s ease;
  margin-right: 4px;
}
.ig-page .hn-logo img {
  height: 30px; width: auto; display: block;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
}
.ig-page .hn-logo:hover { transform: scale(1.04); }
.ig-page .hn-divider {
  width: 1px; height: 22px; background: rgba(255, 255, 255, 0.22);
  margin: 0 8px 0 4px;
}
.ig-page .hn-links {
  position: relative;
  display: flex; align-items: center; gap: 4px;
  margin: 0 auto;
}
.ig-page .hn-indicator {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  height: 34px; border-radius: 999px; pointer-events: none;
  background: linear-gradient(135deg, rgba(207, 233, 184, 0.18), rgba(207, 233, 184, 0.08));
  border: 1px solid rgba(207, 233, 184, 0.28);
  box-shadow:
    0 0 0 4px rgba(207, 233, 184, 0.06),
    0 6px 22px rgba(141, 198, 96, 0.30),
    inset 0 0 12px rgba(207, 233, 184, 0.18);
  transition:
    transform .45s cubic-bezier(.22, 1, .36, 1),
    width .45s cubic-bezier(.22, 1, .36, 1),
    opacity .3s ease;
  will-change: transform, width;
}
.ig-page .hn-indicator::after {
  content: ""; position: absolute; left: 16%; right: 16%; bottom: -2px; height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #cfe9b8, transparent);
  filter: drop-shadow(0 0 6px rgba(207, 233, 184, 0.8));
  animation: hn-glow 2.4s ease-in-out infinite;
}
@keyframes hn-glow {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ig-page .hn-indicator { transition: opacity .2s ease; }
  .ig-page .hn-indicator::after { animation: none; }
}
.ig-page .hn-link {
  display: flex; align-items: center; gap: 8px;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none; font-size: 13px; font-weight: 500; letter-spacing: 0.04em;
  padding: 8px 16px; border-radius: 999px;
  transition: color .25s ease, background .25s ease, transform .25s ease;
}
.ig-page .hn-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  transition: background .25s ease, box-shadow .25s ease, transform .25s ease;
}
.ig-page .hn-link:hover { color: #fff; background: rgba(255, 255, 255, 0.10); }
.ig-page .hn-link:hover .hn-dot { background: #cfe9b8; transform: scale(1.3); }
.ig-page .hn-link.is-active { color: #fff; background: transparent; }
.ig-page .hn-link.is-active .hn-dot { background: #cfe9b8; box-shadow: 0 0 0 4px rgba(207, 233, 184, 0.18); }
@media (max-width: 640px) {
  .ig-page .hero-nav { padding: 8px 12px; gap: 2px; }
  .ig-page .hero-nav.is-scrolled { padding: 6px 12px; }
  .ig-page .hn-link { padding: 7px 9px; font-size: 12px; }
  .ig-page .hn-dot { display: none; }
  .ig-page .hn-logo img { height: 24px; }
  .ig-page .hn-divider { display: none; }
  .ig-page .hn-indicator { height: 28px; }
}
.ig-page .eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.22);
  padding: 9px 18px; border-radius: 999px;
  color: #fffaf0; font-weight: 600;
  margin-bottom: 32px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.ig-page .eyebrow .eb-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #ff6f8a;
  box-shadow: 0 0 12px rgba(255, 111, 138, 0.8);
}
.ig-page .hero h1 {
  font-size: clamp(44px, 7.4vw, 104px);
  font-weight: 700;
  line-height: 0.98;
  margin-bottom: 28px;
  letter-spacing: -0.025em;
  color: #fff;
  text-shadow: 0 2px 30px rgba(0, 0, 0, 0.35);
  max-width: 14ch;
}
.ig-page .title-accent {
  font-style: italic;
  font-weight: 600;
  background: linear-gradient(95deg, #ffb56b 0%, #ff8a7b 45%, #ff6f8a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding-right: 0.06em;
}

.ig-page .hero p.lead {
  font-size: clamp(15px, 1.5vw, 18px);
  max-width: 460px;
  margin: 0 0 36px;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.55;
  font-weight: 400;
  text-shadow: 0 1px 14px rgba(0, 0, 0, 0.35);
}

.ig-page .cta-row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-start; }
.ig-page .btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 30px; border-radius: 999px;
  font-weight: 600; font-size: 15px; border: 1px solid transparent;
  cursor: pointer; font-family: inherit;
  transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease, border-color .25s ease;
}
.ig-page .btn-primary {
  background: linear-gradient(95deg, #ffb56b 0%, #ff8a7b 50%, #ff6f8a 100%);
  color: #fff;
  box-shadow: 0 14px 36px -10px rgba(255, 111, 138, 0.55);
}
.ig-page .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 46px -12px rgba(255, 111, 138, 0.7);
  filter: brightness(1.05);
}
.ig-page .btn-ghost {
  background: rgba(255, 255, 255, 0.95);
  color: #1f2a1d;
  border-color: transparent;
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.35);
}
.ig-page .btn-ghost:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 16px 38px -14px rgba(0, 0, 0, 0.45);
}

.ig-page .leaf { display: none; }
.ig-page .divider-bottom { display: none; }

.ig-page .scroll-hint {
  position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%);
  z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 10px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 10px; letter-spacing: 0.42em; text-transform: uppercase; font-weight: 600;
  text-decoration: none;
  transition: color .25s ease, transform .25s ease;
}
.ig-page .scroll-hint .scroll-line {
  width: 1px; height: 38px; background: rgba(255, 255, 255, 0.9);
  position: relative; overflow: hidden;
}
.ig-page .scroll-hint .scroll-line::after {
  content: ""; position: absolute; left: 0; right: 0; top: -100%;
  height: 60%;
  background: linear-gradient(180deg, transparent, #fff);
  animation: igScrollLine 2.2s ease-in-out infinite;
}
.ig-page .scroll-hint:hover { color: #fff; transform: translate(-50%, -3px); }
@keyframes igScrollLine {
  0% { top: -60%; }
  100% { top: 110%; }
}

@media (max-width: 640px) {
  .ig-page .hero h1 { max-width: none; }
  .ig-page .cta-row { width: 100%; }
  .ig-page .btn { padding: 14px 22px; font-size: 14px; }
}
.ig-page .divider-bottom { position: absolute; left: 0; right: 0; bottom: -1px; width: 100%; height: 80px; z-index: 4; pointer-events: none; }

/* SECTIONS */
.ig-page .section { padding: clamp(72px, 9vw, 120px) 24px; }
.ig-page .section-cream { background: var(--cream); }
.ig-page .section-sand  { background: var(--sand); }
.ig-page .section-moss  { background: linear-gradient(180deg, var(--moss-2) 0%, var(--moss-1) 100%); color: #fffaf0; }
.ig-page .section-head { text-align: center; max-width: 720px; margin: 0 auto 56px; }
.ig-page .section-tag { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: var(--moss-1); background: rgba(138, 168, 107, 0.18); border: 1px solid rgba(138, 168, 107, 0.35); padding: 7px 14px; border-radius: 999px; margin-bottom: 18px; }
.ig-page .section-tag.light { color: #f5e7b8; background: rgba(255, 250, 240, 0.1); border-color: rgba(255, 250, 240, 0.25); }
.ig-page .section-tag .tag-leaf { font-size: 13px; }
.ig-page .section-head h2 { font-size: clamp(30px, 4.6vw, 52px); margin-bottom: 14px; }
.ig-page .section-head h2.on-dark { color: #fffaf0; }
.ig-page .section-head p { font-size: clamp(15px, 1.4vw, 17px); color: var(--ink-soft); max-width: 560px; margin: 0 auto; }
.ig-page .section-head p.on-dark-soft { color: rgba(255, 250, 240, 0.82); }

/* OFFERS */
.ig-page .grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.ig-page .card { background: #fffaf0; border: 1px solid var(--line); border-radius: var(--radius); padding: 0 28px 28px; position: relative; box-shadow: var(--shadow-soft); transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease; overflow: hidden; }
.ig-page .card:hover { transform: translateY(-6px) rotate(-0.4deg); box-shadow: var(--shadow); }
.ig-page .card-illust { margin: 0 -28px 22px; height: 140px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.ig-page .card-illust[data-color="tomato"]   { background: linear-gradient(135deg, #f6dcd2, #ecb8a6); }
.ig-page .card-illust[data-color="pepper"]   { background: linear-gradient(135deg, #f5e0c4, #e9c191); }
.ig-page .card-illust[data-color="zucchini"] { background: linear-gradient(135deg, #d8e6c4, #b8d098); }
.ig-page .card-illust::after { content: ""; position: absolute; inset: -20%; background-image: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 50%); pointer-events: none; }
.ig-page .illust-emoji { font-size: 64px; line-height: 1; filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.18)); transition: transform .4s cubic-bezier(.2,.8,.2,1); position: relative; z-index: 1; }
.ig-page .card:hover .illust-emoji { transform: scale(1.1) rotate(-6deg); }

.ig-page .badge { display: inline-block; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px; background: rgba(47, 74, 50, 0.1); color: var(--moss-1); font-weight: 700; margin-bottom: 12px; }
.ig-page .card h3 { font-size: 26px; margin-bottom: 8px; }
.ig-page .card .desc { color: var(--ink-soft); font-size: 14.5px; margin-bottom: 18px; }
.ig-page .price-row { display: flex; align-items: baseline; gap: 6px; padding-top: 16px; border-top: 1px dashed var(--line-strong); }
.ig-page .price { font-family: 'Fraunces', Georgia, serif; font-size: 28px; font-weight: 700; color: var(--moss-1); }
.ig-page .price-unit { font-size: 13px; color: var(--ink-mute); }
.ig-page .producer-banner { text-align: center; margin-top: 56px; font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: 15px; color: var(--bark); letter-spacing: 0.04em; }

/* GALLERY */
.ig-page .gallery { display: grid; gap: 18px; grid-template-columns: repeat(2, 1fr); }
.ig-page .tile { position: relative; border-radius: var(--radius); overflow: hidden; box-shadow: 0 22px 50px -22px rgba(0, 0, 0, 0.5); margin: 0; background: var(--moss-1); aspect-ratio: 4 / 3; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
.ig-page .tile.wide { grid-column: 1 / -1; aspect-ratio: 16 / 7; }
.ig-page .tile img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2,.8,.2,1); }
.ig-page .tile:hover { transform: translateY(-4px); }
.ig-page .tile:hover img { transform: scale(1.05); }

/* HOURS + LOCATION */
.ig-page .split { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.ig-page .panel { background: #fffaf0; border: 1px solid var(--line); border-radius: var(--radius); padding: 36px 32px; box-shadow: var(--shadow-soft); }
.ig-page .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
.ig-page .panel h3 { font-size: 24px; margin: 0; color: var(--moss-1); }

.ig-page .live-status { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; padding: 6px 12px; border-radius: 999px; border: 1px solid transparent; white-space: nowrap; }
.ig-page .live-status.is-open { background: rgba(78, 197, 122, 0.15); border-color: rgba(78, 197, 122, 0.45); color: #2a6f3f; }
.ig-page .live-status.is-closed { background: rgba(201, 83, 58, 0.12); border-color: rgba(201, 83, 58, 0.35); color: #8a3a26; }
.ig-page .live-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 0 currentColor; animation: igLivePulse 1.8s ease-in-out infinite; }
@keyframes igLivePulse { 0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; } 50% { box-shadow: 0 0 0 6px rgba(0,0,0,0); opacity: .55; } }

.ig-page .hours-list li { display: flex; justify-content: space-between; align-items: center; padding: 12px 10px; border-bottom: 1px dashed var(--line); font-size: 15px; border-radius: 8px; transition: background .2s ease; }
.ig-page .hours-list li:last-child { border-bottom: none; }
.ig-page .hours-list .day { font-weight: 600; color: var(--ink); }
.ig-page .hours-list .time { color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.ig-page .hours-list li.closed .time { color: var(--tomato); font-weight: 600; }
.ig-page .hours-list li.is-today { background: rgba(138, 168, 107, 0.18); padding-left: 14px; padding-right: 14px; }
.ig-page .hours-list li.is-today .day::before { content: "›"; display: inline-block; margin-right: 6px; color: var(--moss-1); font-weight: 800; }

.ig-page .quick-actions, .ig-page .route-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
.ig-page .qa-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px; font-size: 13.5px; font-weight: 600; background: rgba(47, 74, 50, 0.06); color: var(--moss-1); border: 1px solid rgba(47, 74, 50, 0.18); transition: transform .2s ease, background .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease; cursor: pointer; }
.ig-page .qa-btn:hover { transform: translateY(-2px); background: var(--moss-1); color: #fffaf0; border-color: var(--moss-1); box-shadow: 0 12px 24px -12px rgba(47, 74, 50, 0.6); }
.ig-page .qa-btn svg { flex-shrink: 0; }
.ig-page .qa-wa:hover { background: #25d366; border-color: #25d366; }
.ig-page .qa-call:hover { background: var(--moss-2); border-color: var(--moss-2); }
.ig-page .qa-mail:hover { background: var(--bark); border-color: var(--bark); }
.ig-page .qa-route:hover { background: #1a73e8; border-color: #1a73e8; }
.ig-page .qa-apple:hover { background: #111; border-color: #111; }

.ig-page .address { color: var(--ink-soft); font-size: 15px; line-height: 1.7; margin-bottom: 22px; }
.ig-page .address strong { display: block; color: var(--ink); font-family: 'Fraunces', Georgia, serif; font-size: 19px; margin-bottom: 6px; font-weight: 700; }
.ig-page .map-wrap { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); aspect-ratio: 4 / 3; }
.ig-page .map-wrap iframe { width: 100%; height: 100%; border: 0; filter: saturate(.85) hue-rotate(-10deg); }
.ig-page .map-overlay-btn { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; background: #fffaf0; color: var(--moss-1); font-size: 13.5px; font-weight: 700; border: 1px solid var(--line-strong); box-shadow: 0 14px 30px -12px rgba(0, 0, 0, 0.5); transition: transform .2s ease, background .2s ease, color .2s ease; white-space: nowrap; }
.ig-page .map-overlay-btn:hover { transform: translate(-50%, -3px); background: var(--moss-1); color: #fffaf0; }

/* FOOTER */
.ig-page .ig-footer { background: var(--moss-1); color: rgba(255, 250, 240, 0.85); padding: 60px 24px 40px; }
.ig-page .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 32px; align-items: center; }
.ig-page .footer-brand .footer-logo { display: inline-block; margin-bottom: 12px; }
.ig-page .footer-brand .footer-logo img { height: 44px; width: auto; display: block; }
.ig-page .footer-brand .tagline { font-style: italic; font-size: 14px; color: rgba(255, 250, 240, 0.7); }
.ig-page .footer-contact { font-size: 14px; line-height: 1.7; }
.ig-page .footer-contact a { display: inline-block; margin-top: 8px; color: var(--leaf); font-weight: 600; border-bottom: 1px dashed currentColor; }
.ig-page .footer-copy { text-align: right; font-size: 13px; color: rgba(255, 250, 240, 0.55); }

@media (max-width: 820px) {
  .ig-page .split { grid-template-columns: 1fr; }
  .ig-page .gallery { grid-template-columns: 1fr; }
  .ig-page .tile.wide { aspect-ratio: 4 / 3; }
  .ig-page .footer-grid { grid-template-columns: 1fr; text-align: center; }
  .ig-page .footer-copy { text-align: center; }
  .ig-page .leaf-1 { width: 60px; }
  .ig-page .leaf-2 { width: 50px; }
  .ig-page .leaf-3 { width: 70px; }
}

@media (prefers-reduced-motion: reduce) {
  .ig-page .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .ig-page .leaf, .ig-page .scroll-hint svg, .ig-page .hand-underline svg { animation: none !important; }
  .ig-page .hand-underline svg { stroke-dashoffset: 0 !important; opacity: 1 !important; }
}
`;
