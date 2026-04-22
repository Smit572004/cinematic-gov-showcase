import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import PageHero from "@/components/PageHero";
import { useScrollAnimation, useCountUp } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/i18n/LanguageContext";
import nurseryImg from "@/assets/services-nursery.jpg";
import aboutImg from "@/assets/about-seedling.jpg";
import { TreePine, Sprout, FlaskConical, Truck, ShieldCheck, BarChart3, Thermometer, Droplets, Bug, Layers } from "lucide-react";

function StatCard({ stat, index, isVisible }: { stat: { value: number; suffix: string; label: string }; index: number; isVisible: boolean }) {
  const count = useCountUp(stat.value, 2000, isVisible);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isVisible ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: 0.15 * index }}
      className="glass rounded-2xl p-8 text-center hover:border-primary/40 transition-all duration-300"
    >
      <div className="font-display text-4xl md:text-5xl font-bold text-primary">{count}{stat.suffix}</div>
      <div className="text-muted-foreground font-body text-sm mt-2">{stat.label}</div>
    </motion.div>
  );
}

const ServicesPage = () => {
  const { ref: servicesRef, isVisible: servicesVisible } = useScrollAnimation();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();
  const { t } = useLanguage();

  const stats = [
    { value: 30, suffix: "+", label: t("servicesPage.yearsExperience") },
    { value: 50, suffix: "M+", label: t("servicesPage.seedlingsProduced") },
    { value: 98, suffix: "%", label: t("servicesPage.survivalRate") },
    { value: 200, suffix: "+", label: t("servicesPage.govProjects") },
  ];

  const services = [
    { icon: Sprout, title: t("servicesPage.s1Title"), desc: t("servicesPage.s1Desc") },
    { icon: TreePine, title: t("servicesPage.s2Title"), desc: t("servicesPage.s2Desc") },
    { icon: Thermometer, title: t("servicesPage.s3Title"), desc: t("servicesPage.s3Desc") },
    { icon: FlaskConical, title: t("servicesPage.s4Title"), desc: t("servicesPage.s4Desc") },
    { icon: ShieldCheck, title: t("servicesPage.s5Title"), desc: t("servicesPage.s5Desc") },
    { icon: BarChart3, title: t("servicesPage.s6Title"), desc: t("servicesPage.s6Desc") },
    { icon: Truck, title: t("servicesPage.s7Title"), desc: t("servicesPage.s7Desc") },
    { icon: Droplets, title: t("servicesPage.s8Title"), desc: t("servicesPage.s8Desc") },
    { icon: Bug, title: t("servicesPage.s9Title"), desc: t("servicesPage.s9Desc") },
    { icon: Layers, title: t("servicesPage.s10Title"), desc: t("servicesPage.s10Desc") },
  ];

  return (
    <PageLayout>
      <PageHero
        title={t("pageHero.servicesTitle")}
        subtitle={t("pageHero.servicesSubtitle")}
        description={t("pageHero.servicesDesc")}
        backgroundImage={nurseryImg}
      />

      {/* Stats */}
      <section className="section-padding">
        <div ref={statsRef} className="container mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => <StatCard key={i} stat={s} index={i} isVisible={statsVisible} />)}
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding">
        <div className="glow-line mb-16" />
        <div ref={servicesRef} className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={servicesVisible ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold">
              {t("servicesPage.completeTitle1")} <span className="text-gradient">{t("servicesPage.completeTitle2")}</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={servicesVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.06 * i, duration: 0.5 }}
                className="group glass rounded-2xl p-8 hover:border-primary/40 hover:-translate-y-1 transition-all duration-500"
              >
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <s.icon className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg mb-2">{s.title}</h3>
                    <p className="text-muted-foreground text-sm font-body leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={aboutImg} alt="" loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/85" />
        </div>
        <div ref={ctaRef} className="relative z-10 container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              {t("servicesPage.ctaTitle1")} <span className="text-gradient">{t("servicesPage.ctaTitle2")}</span>{t("servicesPage.ctaTitle3")}
            </h2>
            <p className="text-muted-foreground font-body max-w-xl mx-auto mb-8">{t("servicesPage.ctaDesc")}</p>
            <a href="/contact" className="inline-block px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:shadow-[var(--glow-green)] transition-all duration-300 hover:scale-105">
              {t("servicesPage.ctaButton")}
            </a>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ServicesPage;
