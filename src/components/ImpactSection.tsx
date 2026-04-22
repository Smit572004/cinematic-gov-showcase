import { motion } from "framer-motion";
import { useScrollAnimation, useCountUp } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/i18n/LanguageContext";
import impactBg from "@/assets/impact-forest.jpg";

const ImpactSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useLanguage();

  const stats = [
    { value: 30, suffix: "+", label: t("impact.yearsExp") },
    { value: 50, suffix: "M+", label: t("impact.seedlings") },
    { value: 200, suffix: "+", label: t("impact.govProjects") },
    { value: 98, suffix: "%", label: t("impact.survivalRate") },
  ];

  return (
    <section id="impact" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={impactBg} alt="Forest canopy" loading="lazy" width={1920} height={768} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>
      <div ref={ref} className="relative z-10 section-padding">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
            <span className="text-primary text-sm font-body tracking-widest uppercase">{t("impact.subtitle")}</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">
              {t("impact.title1")} <span className="text-gradient">{t("impact.title2")}</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <StatCard key={i} stat={stat} index={i} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

function StatCard({ stat, index, isVisible }: { stat: { value: number; suffix: string; label: string }; index: number; isVisible: boolean }) {
  const count = useCountUp(stat.value, 2000, isVisible);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={isVisible ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.15 * index }} className="glass rounded-2xl p-8 text-center hover:border-primary/40 transition-all duration-300">
      <div className="font-display text-4xl md:text-5xl font-bold text-primary">{count}{stat.suffix}</div>
      <div className="text-muted-foreground font-body text-sm mt-2">{stat.label}</div>
    </motion.div>
  );
}

export default ImpactSection;
