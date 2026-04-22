import { motion, useScroll, useTransform } from "framer-motion";
import { useParallax } from "@/hooks/useScrollAnimation";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import heroBg from "@/assets/hero-bg.jpg";
import { useRef } from "react";

const HeroSection = () => {
  const offset = useParallax();
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1.35]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);
  const blur = useTransform(scrollYProgress, [0, 1], [0, 4]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.15, 0.6]);

  // No changes needed here — light/dark handled via CSS

  return (
    <section ref={sectionRef} id="hero" className="relative h-screen overflow-hidden">
      {/* Animated parallax background */}
      <motion.div
        className="absolute inset-0"
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 150]) }}
      >
        <div
          className="w-full h-full hero-infinite-pan"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: '120% 120%',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </motion.div>

      {/* Overlay for text contrast — lighter to keep bg visible */}
      <div className="absolute inset-0 bg-black/25 dark:bg-black/30" />
      <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />

      {/* Scroll-reactive darkening overlay */}
      <motion.div className="absolute inset-0 bg-background" style={{ opacity: overlayOpacity }} />

      {/* Animated light sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, hsl(var(--primary) / 0.07) 50%, transparent 60%)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 6, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: 4 + i * 2,
              height: 4 + i * 2,
              left: `${15 + i * 14}%`,
              bottom: "-10px",
            }}
            animate={{
              y: [0, -800 - i * 100],
              x: [0, (i % 2 === 0 ? 1 : -1) * 40],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: "inset 0 0 200px 60px hsl(var(--background))"
      }} />

      {/* Content */}
      <motion.div style={{ opacity }} className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
          <span className="inline-block px-5 py-2 rounded-full border border-white/40 dark:border-primary/40 text-white dark:text-primary text-sm font-body tracking-[0.25em] uppercase" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.3)" }}>
            {t("hero.badge")}
          </span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="font-display text-5xl md:text-7xl lg:text-9xl font-bold leading-[0.9] max-w-6xl text-white dark:text-foreground" style={{ textShadow: "0 2px 40px rgba(0,0,0,0.5)" }}>
          {t("hero.title1")}{" "}<span className="text-gradient">{t("hero.title2")}</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-8 text-lg md:text-xl text-white/80 dark:text-muted-foreground max-w-2xl font-body leading-relaxed" style={{ textShadow: "0 1px 20px rgba(0,0,0,0.3)" }}>
          {t("hero.desc")}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="mt-10 flex flex-col sm:flex-row gap-4">
          <a href="/services" className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:shadow-[var(--glow-green)] transition-all duration-300 hover:scale-105">
            {t("hero.exploreServices")}
          </a>
          <a href="/about" className="px-8 py-3.5 rounded-full border border-white/30 dark:border-foreground/20 text-white dark:text-foreground font-semibold text-base hover:border-primary hover:text-primary transition-all duration-300">
            {t("hero.aboutTinplant")}
          </a>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="absolute bottom-10">
          <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="text-primary" size={32} />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
