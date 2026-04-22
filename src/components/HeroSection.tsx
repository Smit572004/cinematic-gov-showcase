import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, ShieldCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import heroBg from "@/assets/hero-bg.jpg";
import heroVideoMeta from "@/assets/hero-video.mp4.asset.json";

const heroVideo = (heroVideoMeta as { url: string }).url;
import { useEffect, useRef, useState } from "react";

const HeroSection = () => {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax: slower vertical drift + gentle scale, plus content rises slightly faster.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.2, 0.65]);

  // Try to autoplay the muted video as soon as it's mounted (some browsers need an explicit play()).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => v.play().catch(() => {});
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener("loadeddata", tryPlay, { once: true });
    return () => v.removeEventListener("loadeddata", tryPlay);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative h-screen min-h-[640px] overflow-hidden"
      aria-label="Hero"
    >
      {/* Parallax background layer (video + image fallback) with slow Ken Burns zoom */}
      <motion.div
        className="absolute inset-0"
        style={prefersReducedMotion ? undefined : { y: bgY, scale: bgScale }}
      >
        <motion.div
          className="absolute inset-0"
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Image fallback — always rendered behind the video so the hero never looks blank */}
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${heroBg})` }}
            aria-hidden="true"
          />
          {!prefersReducedMotion && (
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                videoReady ? "opacity-100" : "opacity-0"
              }`}
              src={heroVideo}
              poster={heroBg}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              aria-hidden="true"
              onLoadedData={() => setVideoReady(true)}
              onCanPlay={() => setVideoReady(true)}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Cinematic gradient stack — top→bottom + left vignette for headline contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--background) / 0.15) 0%, hsl(var(--background) / 0.0) 35%, hsl(var(--background) / 0.55) 85%, hsl(var(--background)) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0) 70%)",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-background pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />

      {/* Subtle film-grain noise */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Slow horizontal light sweep (cinema feel) */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 42%, hsl(var(--primary) / 0.10) 50%, transparent 58%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 9, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
        />
      )}

      {/* Edge vignette to focus the eye */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 220px 60px hsl(var(--background))" }}
      />

      {/* Floating ambient particles */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute block w-1.5 h-1.5 rounded-full bg-primary/40 blur-[1px]"
              style={{
                left: `${(i * 13 + 8) % 100}%`,
                top: `${(i * 23 + 15) % 100}%`,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 6 + (i % 4),
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <motion.div
        style={prefersReducedMotion ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative z-10 h-full flex flex-col items-start md:items-start justify-center px-6 md:px-12 lg:px-20 max-w-7xl mx-auto"
      >
        {/* Eyebrow / trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm text-white text-[11px] md:text-xs font-body tracking-[0.22em] uppercase"
            style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground/90" strokeWidth={2.4} />
            {t("hero.badge")}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-bold leading-[0.95] tracking-tight text-white max-w-5xl text-[clamp(2.5rem,6.5vw,5.75rem)]"
          style={{ textShadow: "0 2px 40px rgba(0,0,0,0.55)" }}
        >
          {t("hero.title1")}
          <br />
          <span className="text-gradient">{t("hero.title2")}</span>
        </motion.h1>

        {/* Accent rule */}
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="block h-[2px] w-24 mt-6 origin-left bg-gradient-to-r from-primary via-primary/70 to-transparent"
          aria-hidden="true"
        />

        {/* Lead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 text-base md:text-lg lg:text-xl text-white/85 max-w-2xl font-body leading-relaxed"
          style={{ textShadow: "0 1px 20px rgba(0,0,0,0.4)" }}
        >
          {t("hero.desc")}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <motion.a
            href="/contact"
            className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm md:text-base shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)] hover:shadow-[var(--glow-green)] transition-all duration-300 hover:scale-[1.03] overflow-hidden"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
          >
            {!prefersReducedMotion && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary/40"
                animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              {t("hero.exploreServices")}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </motion.a>
          <a
            href="/services"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/40 bg-white/5 backdrop-blur-sm text-white font-semibold text-sm md:text-base hover:border-primary hover:bg-primary/10 transition-all duration-300"
          >
            {t("hero.aboutTinplant")}
          </a>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase font-body">Scroll</span>
          <motion.div
            animate={prefersReducedMotion ? undefined : { y: [0, 10, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="text-primary" size={26} />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
