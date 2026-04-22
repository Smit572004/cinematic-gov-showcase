import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import logoWhite from "@/assets/tinplant-logo-white.png";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  HOUR_KEYS,
  parseHours,
  useIgContent,
  useIgGallery,
  useIgOffers,
  type IgOffer,
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

/* ---------------- Products parallax backdrop ----------------
   Subtle cinematic layered backdrop sitting BEHIND the product cards.
   - 2 soft radial moss glows that drift on scroll (parallax)
   - A handful of small floating dots with gentle CSS drift
   - Disabled for prefers-reduced-motion and on small screens (perf)
*/
type ParallaxLayerProps = {
  scrollYProgress: MotionValue<number>;
  range: [number, number];
  className: string;
  style?: React.CSSProperties;
};

const ParallaxLayer = ({ scrollYProgress, range, className, style }: ParallaxLayerProps) => {
  const y = useTransform(scrollYProgress, [0, 1], range);
  return <motion.div className={className} style={{ ...style, y }} aria-hidden="true" />;
};

const ProductsParallaxBackdrop = ({
  sectionRef,
}: {
  sectionRef: React.RefObject<HTMLElement>;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [prefersReducedMotion]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  if (!enabled) return null;

  const particles = [
    { left: "8%",  top: "18%", size: 10, delay: 0,   dur: 14, range: [-40, 40] as [number, number] },
    { left: "22%", top: "70%", size: 6,  delay: 2,   dur: 18, range: [60, -60] as [number, number] },
    { left: "38%", top: "12%", size: 8,  delay: 1,   dur: 16, range: [-30, 30] as [number, number] },
    { left: "55%", top: "78%", size: 12, delay: 3,   dur: 20, range: [50, -50] as [number, number] },
    { left: "70%", top: "22%", size: 7,  delay: 0.5, dur: 15, range: [-45, 45] as [number, number] },
    { left: "84%", top: "60%", size: 9,  delay: 2.5, dur: 17, range: [40, -40] as [number, number] },
    { left: "92%", top: "30%", size: 5,  delay: 1.5, dur: 19, range: [-25, 25] as [number, number] },
    { left: "14%", top: "44%", size: 6,  delay: 3.5, dur: 21, range: [30, -30] as [number, number] },
  ];

  return (
    <div className="products-backdrop" aria-hidden="true">
      <ParallaxLayer
        scrollYProgress={scrollYProgress}
        range={[-80, 80]}
        className="products-backdrop-glow products-backdrop-glow--a"
      />
      <ParallaxLayer
        scrollYProgress={scrollYProgress}
        range={[120, -120]}
        className="products-backdrop-glow products-backdrop-glow--b"
      />
      {particles.map((p, i) => {
        const y = useTransform(scrollYProgress, [0, 1], p.range);
        return (
          <motion.div
            key={i}
            className="products-backdrop-particle-wrap"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              y,
            }}
            aria-hidden="true"
          >
            <div
              className="products-backdrop-particle"
              style={{
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.dur}s`,
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

/* ---------------- Products auto-scrolling marquee ---------------- */

const ProductsMarquee = ({
  offers,
  lang,
  onSelect,
  ariaLabel,
}: {
  offers: IgOffer[];
  lang: LangKey;
  onSelect: (o: IgOffer) => void;
  ariaLabel: string;
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const detailsLabel = lang === "de" ? "Details ansehen" : "View details";

  // Manual scroll via arrows (also pauses the marquee while interacting).
  const scrollByCards = (dir: 1 | -1) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const card = vp.querySelector<HTMLElement>(".product-card-v2");
    const step = card ? card.getBoundingClientRect().width + 22 : 320;
    setPaused(true);
    vp.scrollBy({ left: dir * step * 2, behavior: "smooth" });
    // resume auto-scroll shortly after
    window.setTimeout(() => setPaused(false), 1400);
  };

  return (
    <div
      className={`products-marquee reveal ${paused ? "is-paused" : ""} ${showArrows ? "show-arrows" : ""}`}
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => {
        setShowArrows(false);
        setPaused(false);
      }}
      onFocus={() => setShowArrows(true)}
      onBlur={() => setShowArrows(false)}
    >
      <div className="products-viewport" ref={viewportRef}>
        <div className="products-track" ref={trackRef}>
          {[0, 1].map((dup) => (
            <div className="products-row" aria-hidden={dup === 1} key={dup}>
              {offers.map((o) => {
                const title = lang === "de" ? o.title_de : o.title_en || o.title_de;
                const desc = lang === "de" ? o.description_de : o.description_en || o.description_de;
                const badge = lang === "de" ? o.badge_de : o.badge_en || o.badge_de;
                return (
                  <button
                    key={`${dup}-${o.id}`}
                    type="button"
                    className="product-card-v2"
                    onClick={() => dup === 0 && onSelect(o)}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    tabIndex={dup === 1 ? -1 : 0}
                    aria-label={`${title} — ${detailsLabel}`}
                  >
                    <div className="pcv2-art" data-color={o.color_tag}>
                      {o.image_url ? (
                        <img
                          src={o.image_url}
                          alt={title}
                          className="pcv2-img"
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <span className="pcv2-emoji" aria-hidden="true">{o.emoji}</span>
                      )}
                      <span className="pcv2-shine" aria-hidden="true" />
                    </div>
                    <div className="pcv2-body">
                      {badge && <span className="pcv2-cat">{badge}</span>}
                      <h3 className="pcv2-title">{title}</h3>
                      {desc && <p className="pcv2-desc">{desc}</p>}
                      <div className="pcv2-foot">
                        {(o.price_text || o.unit_text) ? (
                          <span className="pcv2-price-wrap">
                            {o.price_text && <span className="pcv2-price">{o.price_text}</span>}
                            {o.unit_text && <span className="pcv2-unit">{o.unit_text}</span>}
                          </span>
                        ) : <span />}
                        <span className="pcv2-arrow" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="products-fade products-fade-l" aria-hidden="true" />
      <div className="products-fade products-fade-r" aria-hidden="true" />

      <button
        type="button"
        className="pm-arrow pm-arrow-l"
        aria-label={lang === "de" ? "Vorheriges" : "Previous"}
        onClick={() => scrollByCards(-1)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        className="pm-arrow pm-arrow-r"
        aria-label={lang === "de" ? "Nächstes" : "Next"}
        onClick={() => scrollByCards(1)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
};

/* ---------------- Page ---------------- */

const IgLandingPage = () => {
  const { lang } = useLanguage();
  const heroRef = useRef<HTMLElement | null>(null);
  const productsSectionRef = useRef<HTMLElement | null>(null);

  const prefersReducedMotion = useReducedMotion();

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

  // Selected product for details modal
  const [selectedProduct, setSelectedProduct] = useState<IgOffer | null>(null);

  // Lock body scroll when modal is open + close on Escape
  useEffect(() => {
    if (!selectedProduct) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedProduct(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedProduct]);

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

  const offersEyebrow = pick(content, "ig_products_eyebrow", lang, pick(content, "ig_offers_eyebrow", lang, lang === "de" ? "Unsere Produkte" : "Our products"));
  const offersTitle = pick(content, "ig_products_title", lang, pick(content, "ig_offers_title", lang, lang === "de" ? "Frische Pflanzen für jeden Garten" : "Fresh plants for every garden"));
  const offersSubtitle = pick(content, "ig_products_subtitle", lang, pick(content, "ig_offers_subtitle", lang, ""));
  const offersBanner = pick(content, "ig_offers_banner", lang, "");
  const productsViewMore = pick(content, "ig_products_view_more", lang, lang === "de" ? "Komplette Preisliste ansehen" : "View full price list");
  const productsPdfUrl = pick(content, "ig_products_pdf_url", "de", "");

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

  // Day labels (CMS-driven, with hardcoded fallbacks)
  const dayLabels = useMemo(() => {
    const longKeys: Array<[string, string]> = [
      ["ig_day_long_sun", "Sonntag"],
      ["ig_day_long_mon", "Montag"],
      ["ig_day_long_tue", "Dienstag"],
      ["ig_day_long_wed", "Mittwoch"],
      ["ig_day_long_thu", "Donnerstag"],
      ["ig_day_long_fri", "Freitag"],
      ["ig_day_long_sat", "Samstag"],
    ];
    return longKeys.map(([k, fb]) => pick(content, k, lang, fb));
  }, [content, lang]);
  const dayShort = useMemo(() => {
    const shortKeys: Array<[string, string]> = [
      ["ig_day_short_sun", "So"],
      ["ig_day_short_mon", "Mo"],
      ["ig_day_short_tue", "Di"],
      ["ig_day_short_wed", "Mi"],
      ["ig_day_short_thu", "Do"],
      ["ig_day_short_fri", "Fr"],
      ["ig_day_short_sat", "Sa"],
    ];
    return shortKeys.map(([k, fb]) => pick(content, k, lang, fb));
  }, [content, lang]);
  // Display order: Mon..Sun
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  const closedLabel = pick(content, "ig_hours_closed", lang, "Geschlossen");

  // Status templates
  const statusTemplates: StatusTemplates = useMemo(
    () => ({
      closed: pick(content, "ig_hours_closed", lang, "Geschlossen"),
      openUntil: pick(content, "ig_status_open_until", lang, "Geöffnet · bis {time}"),
      closesIn: pick(content, "ig_status_closes_in", lang, "Schließt in {minutes} Min."),
      opensToday: pick(content, "ig_status_opens_today", lang, "Öffnet heute um {time}"),
      opensTomorrow: pick(content, "ig_status_opens_tomorrow", lang, "Öffnet morgen um {time}"),
      opensOn: pick(content, "ig_status_opens_on", lang, "Öffnet {day} um {time}"),
      dayShort,
    }),
    [content, lang, dayShort],
  );

  // Nav items (CMS-driven)
  const navItems: NavItem[] = useMemo(
    () => [
      { id: "ig-main", label: pick(content, "ig_nav_home", lang, "Start") },
      { id: "offers", label: pick(content, "ig_nav_products", lang, pick(content, "ig_nav_offers", lang, lang === "de" ? "Produkte" : "Products")) },
      { id: "location", label: pick(content, "ig_nav_location", lang, "Standort") },
      { id: "contact", label: pick(content, "ig_nav_contact", lang, "Kontakt") },
    ],
    [content, lang],
  );

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

  // Other CMS labels used below
  const navAriaLabel = lang === "de" ? "Seitennavigation" : "Page navigation";
  const scrollHintLabel = pick(content, "ig_hero_scroll_hint", lang, "SCROLL");
  const hoursHeading = pick(content, "ig_hours_heading", lang, "Öffnungszeiten");
  const addressHeading = pick(content, "ig_address_heading", lang, "So findest du uns");
  const mapOpenLabel = pick(content, "ig_map_open", lang, "In Google Maps öffnen");
  const mapRouteLabel = pick(content, "ig_map_route", lang, "Route");
  const mapAppleLabel = pick(content, "ig_map_apple", lang, "Apple Maps");
  const mapShareLabel = pick(content, "ig_map_share", lang, "Teilen");
  const qaCallLabel = pick(content, "ig_qa_call", lang, "Anrufen");
  const qaWhatsappLabel = pick(content, "ig_qa_whatsapp", lang, "WhatsApp");
  const qaEmailLabel = pick(content, "ig_qa_email", lang, "E-Mail");
  const whatsappMessage = pick(
    content,
    "ig_whatsapp_message",
    lang,
    "Hallo TinPlant, ich habe eine Frage zu euren Pflanzen.",
  );
  const emailSubject = pick(content, "ig_email_subject", lang, "Anfrage Pflanzen");
  const footerCopyright = fillTemplate(
    pick(content, "ig_footer_copyright", lang, "© {year} TinPlant"),
    { year },
  );

  return (
    <>
      <style>{IG_STYLES}</style>

      <main className="ig-page" id="ig-main">
        {/* ============== STICKY NAV ============== */}
        <StickyIgNav
          items={navItems}
          ariaLabel={navAriaLabel}
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

          <a href="#offers" className="scroll-hint" aria-label={scrollHintLabel}>
            <span className="scroll-line" aria-hidden="true" />
            <span className="scroll-text">{scrollHintLabel}</span>
          </a>

          <svg className="divider-bottom" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 50 C 240 90, 480 10, 720 40 C 960 70, 1200 20, 1440 50 L 1440 80 L 0 80 Z" fill="var(--cream)" />
          </svg>
        </section>

        {/* ============== PRODUCTS ============== */}
        {activeOffers.length > 0 && (
          <motion.section
            id="offers"
            ref={productsSectionRef}
            className="snap-section section section-cream products-section"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            variants={{
              hidden: {},
              show: {
                transition: prefersReducedMotion
                  ? {}
                  : { staggerChildren: 0.18, delayChildren: 0.05 },
              },
            }}
          >
            {/* Cinematic parallax backdrop — sits behind everything */}
            <ProductsParallaxBackdrop sectionRef={productsSectionRef} />

            {/* 1. HEADING */}
            <div className="container">
              <motion.header
                className="products-header"
                variants={{
                  hidden: prefersReducedMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 32, filter: "blur(8px)" },
                  show: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                <motion.h2
                  className="products-title"
                  variants={{
                    hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  {offersTitle}
                </motion.h2>
                <motion.span
                  className="products-rule"
                  aria-hidden="true"
                  variants={{
                    hidden: prefersReducedMotion ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 },
                    show: {
                      scaleX: 1,
                      opacity: 0.85,
                      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  style={{ transformOrigin: "center" }}
                />
                {offersSubtitle && (
                  <motion.p
                    className="products-sub"
                    variants={{
                      hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
                    }}
                  >
                    {offersSubtitle}
                  </motion.p>
                )}
              </motion.header>
            </div>

            {/* 2. PRODUCT CARDS — cinematic reveal: fade + lift + soft scale */}
            <motion.div
              className="products-cards-wrap"
              variants={{
                hidden: prefersReducedMotion
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 60, scale: 0.96 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              <ProductsMarquee
                offers={activeOffers}
                lang={lang}
                onSelect={setSelectedProduct}
                ariaLabel={offersTitle}
              />
            </motion.div>

            {/* 3. CENTERED CTA — late, subtle pop */}
            <div className="container">
              <motion.div
                className="products-cta"
                variants={{
                  hidden: prefersReducedMotion
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 24, scale: 0.94 },
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                {productsPdfUrl ? (
                  <motion.a
                    href={productsPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="products-download-btn"
                    download
                    whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {productsViewMore}
                  </motion.a>
                ) : (
                  <motion.a
                    href="/products"
                    className="products-download-btn"
                    whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                    {productsViewMore}
                  </motion.a>
                )}
              </motion.div>
              {offersBanner && (
                <motion.p
                  className="producer-banner"
                  variants={{
                    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
                    show: { opacity: 0.85, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <span aria-hidden="true">— </span>{offersBanner}<span aria-hidden="true"> —</span>
                </motion.p>
              )}
            </div>
          </motion.section>
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
                  <h3>{hoursHeading}</h3>
                  <LiveStatusBadge hours={hoursByDay} templates={statusTemplates} />
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
                  <a className="qa-btn qa-call" href={`tel:${phoneTel}`} aria-label={qaCallLabel}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {qaCallLabel}
                  </a>
                  <a
                    className="qa-btn qa-wa"
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={qaWhatsappLabel}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.5 3.5A11.4 11.4 0 0 0 12 0C5.6 0 .4 5.2.4 11.6c0 2 .5 3.9 1.5 5.6L.3 24l7-1.8a11.6 11.6 0 0 0 4.7 1c6.4 0 11.6-5.2 11.6-11.6 0-3.1-1.2-6-3.1-8.1zM12 21.4a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-4.1 1.1 1.1-4-.3-.4a9.6 9.6 0 0 1-1.5-5.1c0-5.3 4.3-9.6 9.6-9.6 2.6 0 5 1 6.8 2.8a9.6 9.6 0 0 1 2.8 6.8c0 5.3-4.3 9.6-9.6 9.6zm5.5-7.2c-.3-.2-1.8-.9-2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0c-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5l.3-.5c.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.4-.3.4-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3 4.8 4.2 1.7.7 2.4.7 3.2.6.5-.1 1.6-.6 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4z"/>
                    </svg>
                    {qaWhatsappLabel}
                  </a>
                  <a
                    className="qa-btn qa-mail"
                    href={`mailto:${email}?subject=${encodeURIComponent(emailSubject)}`}
                    aria-label={qaEmailLabel}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <polyline points="2,7 12,13 22,7"/>
                    </svg>
                    {qaEmailLabel}
                  </a>
                </div>
              </div>

              <div className="panel address-panel reveal">
                <h3>{addressHeading}</h3>
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
                    title={mapOpenLabel}
                  />
                  <a
                    className="map-overlay-btn"
                    href={mapDir}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={mapOpenLabel}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {mapOpenLabel}
                  </a>
                </div>

                <div className="route-actions">
                  <a className="qa-btn qa-route" href={`${mapDir}&travelmode=driving`} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor"/>
                    </svg>
                    {mapRouteLabel}
                  </a>
                  <a className="qa-btn qa-apple" href={mapApple} target="_blank" rel="noopener noreferrer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16.4 12.7c0-2.7 2.2-4 2.3-4-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.3 1-4.1 1-.9 0-2.1-1-3.6-.9-1.8 0-3.5 1.1-4.5 2.7-1.9 3.3-.5 8.2 1.4 10.9.9 1.3 2 2.8 3.5 2.7 1.4-.1 1.9-.9 3.6-.9 1.7 0 2.2.9 3.6.9 1.5 0 2.5-1.3 3.4-2.7.7-1 1-1.5 1.6-2.7-.1 0-3.3-1.3-3.3-4.9zM13.7 4.6c.7-.9 1.3-2.2 1.1-3.5-1.1.1-2.5.8-3.3 1.7-.7.8-1.4 2.1-1.2 3.4 1.2.1 2.6-.7 3.4-1.6z"/>
                    </svg>
                    {mapAppleLabel}
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
                    {mapShareLabel}
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
            <div className="footer-copy">{footerCopyright}</div>
          </div>
        </footer>
      </main>

      {/* ============== PRODUCT DETAILS MODAL ============== */}
      {selectedProduct && (() => {
        const o = selectedProduct;
        const title = lang === "de" ? o.title_de : o.title_en || o.title_de;
        const desc = lang === "de" ? o.description_de : o.description_en || o.description_de;
        const badge = lang === "de" ? o.badge_de : o.badge_en || o.badge_de;
        const closeLabel = lang === "de" ? "Schließen" : "Close";
        const specsLabel = lang === "de" ? "Eckdaten" : "Key specs";
        const priceLabel = lang === "de" ? "Preis" : "Price";
        const categoryLabel = lang === "de" ? "Kategorie" : "Category";
        // Derive simple key specs from description bullet-style splits
        const specs = (desc || "")
          .split(/[•\n;]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        const ctaLabel = lang === "de" ? "Vor Ort kaufen" : "Buy on site";
        return (
          <div
            className="ig-modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={() => setSelectedProduct(null)}
          >
            <div className="ig-modal-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ig-modal-close"
                onClick={() => setSelectedProduct(null)}
                aria-label={closeLabel}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
              <div className="ig-modal-art" data-color={o.color_tag}>
                {o.image_url ? (
                  <img src={o.image_url} alt={title} className="ig-modal-img" />
                ) : (
                  <span className="ig-modal-emoji" aria-hidden="true">{o.emoji}</span>
                )}
                {badge && <span className="ig-modal-cat">{badge}</span>}
              </div>
              <div className="ig-modal-body">
                <h3 className="ig-modal-title">{title}</h3>
                {badge && (
                  <p className="ig-modal-meta">
                    <span className="ig-modal-meta-key">{categoryLabel}</span>
                    <span className="ig-modal-meta-val">{badge}</span>
                  </p>
                )}
                {specs.length > 0 && (
                  <div className="ig-modal-specs">
                    <p className="ig-modal-specs-head">{specsLabel}</p>
                    <ul>
                      {specs.map((s, i) => (
                        <li key={i}>
                          <span className="ig-modal-bullet" aria-hidden="true" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(o.price_text || o.unit_text) && (
                  <div className="ig-modal-price">
                    <span className="ig-modal-price-key">{priceLabel}</span>
                    <span className="ig-modal-price-val">
                      {o.price_text}
                      {o.unit_text && <span className="ig-modal-price-unit"> {o.unit_text}</span>}
                    </span>
                  </div>
                )}
                <div className="ig-modal-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-on-light"
                    onClick={() => setSelectedProduct(null)}
                  >
                    {ctaLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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

/* PRODUCT MARQUEE (horizontal scrolling, pro layout) */
.ig-page .products-marquee {
  position: relative;
  width: 100%;
  padding: 18px 0 32px;
  margin-top: 8px;
}
.ig-page .products-viewport {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%);
  scroll-behavior: smooth;
}
.ig-page .products-viewport::-webkit-scrollbar { display: none; }

.ig-page .products-track {
  display: flex;
  width: max-content;
  /* Gap between the two duplicated rows MUST equal the inter-card gap
     so the loop is mathematically seamless (no visible jump at reset). */
  gap: 22px;
  animation: igProductsScroll 60s linear infinite;
  will-change: transform;
  /* Hint the browser so transforms stay on the compositor thread. */
  backface-visibility: hidden;
  transform: translateZ(0);
}
/* Pause when hovering / focusing the section, when a card is hovered, or
   when the user just clicked an arrow. */
/* Only pause auto-scroll when explicitly paused (via arrow click or
   when a specific card is being hovered). Hovering empty marquee
   space or focusing the wrapper no longer pauses scrolling, so the
   carousel feels continuously alive. */
.ig-page .products-marquee.is-paused .products-track {
  animation-play-state: paused;
}

.ig-page .products-row {
  display: flex;
  flex: 0 0 auto;
  gap: 22px;
  /* Vertical breathing room only — horizontal padding would break the
     seamless loop because the duplicate would start offset. */
  padding: 4px 0;
}
.ig-page .product-card,
.ig-page .product-card-v2 {
  flex: 0 0 auto;
  width: clamp(240px, 24vw, 290px);
  margin: 0;
}
/* Translate by exactly one row + the inter-row gap so the second
   (duplicate) row lands precisely where the first started. */
@keyframes igProductsScroll {
  0%   { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(calc(-50% - 11px), 0, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .ig-page .products-track { animation: none; transform: translateX(0); }
}

.ig-page .products-fade {
  position: absolute; top: 0; bottom: 0; width: 90px; pointer-events: none; z-index: 2;
}
.ig-page .products-fade-l { left: 0; background: linear-gradient(90deg, var(--cream) 25%, transparent); }
.ig-page .products-fade-r { right: 0; background: linear-gradient(-90deg, var(--cream) 25%, transparent); }

/* Hover arrows — appear only when the marquee is hovered/focused */
.ig-page .pm-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%) scale(0.85);
  z-index: 5;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: #fffaf0;
  color: var(--moss-1);
  border: 1px solid var(--line-strong);
  box-shadow: 0 14px 30px -12px rgba(31, 41, 31, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity .25s ease, transform .35s cubic-bezier(.2,.8,.2,1), background .25s ease, color .25s ease;
}
.ig-page .pm-arrow-l { left: 18px; }
.ig-page .pm-arrow-r { right: 18px; }
.ig-page .products-marquee.show-arrows .pm-arrow {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%) scale(1);
}
.ig-page .pm-arrow:hover {
  background: var(--moss-1);
  color: #fffaf0;
  transform: translateY(-50%) scale(1.06);
}
.ig-page .pm-arrow:focus-visible {
  outline: 3px solid var(--moss-2);
  outline-offset: 3px;
}
@media (max-width: 720px) {
  .ig-page .pm-arrow { display: none; }
}

/* ============== PRODUCTS SECTION (pro layout) ============== */
.ig-page .products-section {
  position: relative;
  isolation: isolate; /* contain z-index for the backdrop */
  overflow: hidden;   /* clip drifting particles & glows */
  display: flex;
  flex-direction: column;
  gap: clamp(40px, 5vw, 64px);
  padding-top: clamp(80px, 9vw, 120px);
  padding-bottom: clamp(80px, 9vw, 120px);
}
/* Lift all direct content above the backdrop */
.ig-page .products-section > *:not(.products-backdrop) {
  position: relative;
  z-index: 1;
}

/* ---- Cinematic parallax backdrop ---- */
.ig-page .products-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.ig-page .products-backdrop-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
  will-change: transform;
}
.ig-page .products-backdrop-glow--a {
  width: 540px;
  height: 540px;
  left: -120px;
  top: -80px;
  background: radial-gradient(circle, hsla(145, 45%, 28%, 0.22) 0%, hsla(145, 45%, 28%, 0) 70%);
}
.ig-page .products-backdrop-glow--b {
  width: 620px;
  height: 620px;
  right: -160px;
  bottom: -120px;
  background: radial-gradient(circle, hsla(72, 50%, 45%, 0.18) 0%, hsla(72, 50%, 45%, 0) 70%);
}
.ig-page .products-backdrop-particle-wrap {
  position: absolute;
  will-change: transform;
}
.ig-page .products-backdrop-particle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, hsla(145, 45%, 28%, 0.45) 0%, hsla(145, 45%, 28%, 0) 70%);
  opacity: 0.55;
  will-change: transform;
  animation-name: igParticleDrift;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}
@keyframes igParticleDrift {
  0%   { transform: translate3d(0, 0, 0); }
  50%  { transform: translate3d(8px, -10px, 0); }
  100% { transform: translate3d(-6px, 6px, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .ig-page .products-backdrop-particle { animation: none; }
}



/* 1. Heading block — centered, refined, with decorative rule */
.ig-page .products-header {
  text-align: center;
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.ig-page .products-title {
  font-family: 'Fraunces', Georgia, serif;
  font-size: clamp(32px, 4.8vw, 54px);
  line-height: 1.08;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin: 0;
  font-weight: 600;
}
.ig-page .products-rule {
  display: block;
  width: 56px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--moss-2), var(--moss-1));
  opacity: 0.85;
}
.ig-page .products-sub {
  font-size: clamp(15px, 1.35vw, 17px);
  line-height: 1.6;
  color: var(--ink-soft);
  max-width: 580px;
  margin: 0 auto;
}

/* 2. Cards wrapper — provides breathing room around the marquee */
.ig-page .products-cards-wrap {
  width: 100%;
}

/* 3. Centered CTA group */
.ig-page .products-cta {
  display: flex;
  justify-content: center;
  margin: 0;
  opacity: 1;
}
.ig-page .products-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 17px 34px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-radius: 999px;
  background: var(--moss-1);
  color: #fffaf0;
  border: 1px solid transparent;
  text-decoration: none;
  box-shadow: 0 18px 40px -18px rgba(47, 74, 50, 0.55);
  transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease, background .3s ease;
  cursor: pointer;
}
.ig-page .products-download-btn:hover {
  transform: translateY(-3px);
  background: var(--moss-2);
  box-shadow: 0 26px 54px -18px rgba(47, 74, 50, 0.7);
}
.ig-page .products-download-btn:focus-visible {
  outline: 3px solid var(--moss-2);
  outline-offset: 4px;
}
.ig-page .products-download-btn svg { flex-shrink: 0; }

/* Producer banner — sits below CTA */
.ig-page .products-section .producer-banner {
  margin-top: 28px;
  text-align: center;
  font-family: 'Fraunces', Georgia, serif;
  font-style: italic;
  font-size: 14.5px;
  color: var(--bark);
  letter-spacing: 0.04em;
  opacity: 0.85;
}




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

/* ============== PRODUCT CARD V2 (refined design) ============== */
.ig-page .product-card-v2 {
  appearance: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  background: #fffaf0;
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 8px 24px -16px rgba(31, 41, 31, 0.18);
  transition: transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s ease, border-color .3s ease;
  font: inherit;
  color: inherit;
  position: relative;
}
.ig-page .product-card-v2::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0 0 rgba(138, 168, 107, 0);
  transition: box-shadow .35s ease;
}
.ig-page .product-card-v2:hover {
  transform: translateY(-8px);
  box-shadow: 0 30px 60px -28px rgba(47, 74, 50, 0.4);
  border-color: rgba(138, 168, 107, 0.55);
}
.ig-page .product-card-v2:hover::before {
  box-shadow: inset 0 0 0 1.5px rgba(138, 168, 107, 0.7);
}
.ig-page .product-card-v2:focus-visible {
  outline: 3px solid var(--moss-2);
  outline-offset: 4px;
}

.ig-page .pcv2-art {
  position: relative;
  height: 168px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #f1ead8, #e6dcc1);
}
.ig-page .pcv2-art[data-color="tomato"]   { background: linear-gradient(135deg, #f6dcd2, #ecb8a6); }
.ig-page .pcv2-art[data-color="pepper"]   { background: linear-gradient(135deg, #f5e0c4, #e9c191); }
.ig-page .pcv2-art[data-color="zucchini"] { background: linear-gradient(135deg, #d8e6c4, #b8d098); }
.ig-page .pcv2-art[data-color="herb"]     { background: linear-gradient(135deg, #d4e7d2, #a8caa3); }
.ig-page .pcv2-art[data-color="berry"]    { background: linear-gradient(135deg, #efd0d6, #d99aa6); }
.ig-page .pcv2-emoji {
  font-size: 76px;
  line-height: 1;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.18));
  transition: transform .5s cubic-bezier(.2,.8,.2,1);
  position: relative;
  z-index: 1;
}
.ig-page .product-card-v2:hover .pcv2-emoji {
  transform: scale(1.12) rotate(-6deg);
}
.ig-page .pcv2-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  transition: transform .6s cubic-bezier(.2,.8,.2,1);
  user-select: none;
  -webkit-user-drag: none;
}
.ig-page .product-card-v2:hover .pcv2-img {
  transform: scale(1.06);
}
.ig-page .ig-modal-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}
.ig-page .pcv2-shine {
  position: absolute;
  top: -40%;
  left: -60%;
  width: 60%;
  height: 200%;
  background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%);
  transform: translateX(-20%);
  transition: transform .9s ease;
  pointer-events: none;
}
.ig-page .product-card-v2:hover .pcv2-shine {
  transform: translateX(280%);
}

.ig-page .pcv2-body {
  padding: 22px 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.ig-page .pcv2-cat {
  display: inline-block;
  align-self: flex-start;
  font-size: 10px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  padding: 5px 11px;
  border-radius: 999px;
  background: rgba(47, 74, 50, 0.08);
  color: var(--moss-1);
  font-weight: 700;
}
.ig-page .pcv2-title {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 22px;
  line-height: 1.15;
  margin: 2px 0 0;
  color: var(--ink);
}
.ig-page .pcv2-desc {
  color: var(--ink-soft);
  font-size: 13.5px;
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ig-page .pcv2-foot {
  margin-top: auto;
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px dashed var(--line-strong);
}
.ig-page .pcv2-price-wrap { display: inline-flex; align-items: baseline; gap: 5px; }
.ig-page .pcv2-price { font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; color: var(--moss-1); }
.ig-page .pcv2-unit { font-size: 12px; color: var(--ink-mute); }
.ig-page .pcv2-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px; height: 34px;
  border-radius: 999px;
  background: var(--moss-1);
  color: #fffaf0;
  transition: transform .35s cubic-bezier(.2,.8,.2,1), background .3s ease;
}
.ig-page .product-card-v2:hover .pcv2-arrow {
  transform: translateX(4px);
  background: var(--moss-2);
}

/* ============== PRODUCT DETAILS MODAL ============== */
.ig-page + .ig-modal,
.ig-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(20, 28, 22, 0.62);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: igModalFade .25s ease;
}
@keyframes igModalFade { from { opacity: 0; } to { opacity: 1; } }
.ig-modal-card {
  position: relative;
  width: min(560px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: #fffaf0;
  border-radius: 24px;
  box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.55);
  animation: igModalRise .35s cubic-bezier(.2,.8,.2,1);
  font-family: 'Inter', system-ui, sans-serif;
}
@keyframes igModalRise {
  from { opacity: 0; transform: translateY(24px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.ig-modal-close {
  position: absolute;
  top: 14px; right: 14px;
  width: 38px; height: 38px;
  border-radius: 999px;
  background: rgba(255, 250, 240, 0.92);
  border: 1px solid rgba(47, 74, 50, 0.18);
  color: #2f4a32;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .2s ease, color .2s ease, transform .2s ease;
  z-index: 2;
}
.ig-modal-close:hover { background: #2f4a32; color: #fffaf0; transform: rotate(90deg); }
.ig-modal-art {
  position: relative;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  background: linear-gradient(135deg, #f1ead8, #e6dcc1);
}
.ig-modal-art[data-color="tomato"]   { background: linear-gradient(135deg, #f6dcd2, #ecb8a6); }
.ig-modal-art[data-color="pepper"]   { background: linear-gradient(135deg, #f5e0c4, #e9c191); }
.ig-modal-art[data-color="zucchini"] { background: linear-gradient(135deg, #d8e6c4, #b8d098); }
.ig-modal-art[data-color="herb"]     { background: linear-gradient(135deg, #d4e7d2, #a8caa3); }
.ig-modal-art[data-color="berry"]    { background: linear-gradient(135deg, #efd0d6, #d99aa6); }
.ig-modal-emoji {
  font-size: 110px;
  line-height: 1;
  filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.22));
}
.ig-modal-cat {
  position: absolute;
  top: 16px; left: 16px;
  font-size: 10px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 250, 240, 0.92);
  color: #2f4a32;
  font-weight: 700;
}
.ig-modal-body { padding: 28px 28px 28px; color: #1f291f; }
.ig-modal-title {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 30px;
  line-height: 1.15;
  margin: 0 0 14px;
  color: #1f291f;
}
.ig-modal-meta {
  display: flex;
  gap: 10px;
  font-size: 13px;
  margin: 0 0 18px;
  color: #4b5b4b;
}
.ig-modal-meta-key {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-weight: 700;
  color: #6b7a68;
  font-size: 11px;
  align-self: center;
}
.ig-modal-meta-val { font-weight: 600; }
.ig-modal-specs { margin: 4px 0 18px; }
.ig-modal-specs-head {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 700;
  color: #6b7a68;
  margin: 0 0 10px;
}
.ig-modal-specs ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.ig-modal-specs li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14.5px;
  color: #2c382c;
  line-height: 1.5;
}
.ig-modal-bullet {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #2f4a32;
  margin-top: 8px;
  flex-shrink: 0;
}
.ig-modal-price {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(47, 74, 50, 0.06);
  border: 1px dashed rgba(47, 74, 50, 0.25);
  margin-bottom: 22px;
}
.ig-modal-price-key {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-weight: 700;
  color: #6b7a68;
}
.ig-modal-price-val {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 28px;
  font-weight: 700;
  color: #2f4a32;
}
.ig-modal-price-unit { font-size: 13px; color: #6b7a68; font-family: 'Inter', system-ui, sans-serif; font-weight: 500; }
.ig-modal-actions { display: flex; justify-content: flex-end; }
@media (max-width: 540px) {
  .ig-modal { padding: 12px; }
  .ig-modal-art { height: 180px; }
  .ig-modal-emoji { font-size: 84px; }
  .ig-modal-title { font-size: 24px; }
  .ig-modal-body { padding: 22px 20px; }
}
`;
