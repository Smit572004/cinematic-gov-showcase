import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/i18n/LanguageContext";
import { TreePine, Sprout, FlaskConical, Truck, ShieldCheck, BarChart3 } from "lucide-react";

const ServicesSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useLanguage();

  const services = [
    { icon: Sprout, title: t("services.containerSeedlings"), desc: t("services.containerSeedlingsDesc") },
    { icon: TreePine, title: t("services.reforestationPlanning"), desc: t("services.reforestationPlanningDesc") },
    { icon: FlaskConical, title: t("services.research"), desc: t("services.researchDesc") },
    { icon: Truck, title: t("services.logistics"), desc: t("services.logisticsDesc") },
    { icon: ShieldCheck, title: t("services.quality"), desc: t("services.qualityDesc") },
    { icon: BarChart3, title: t("services.monitoring"), desc: t("services.monitoringDesc") },
  ];

  return (
    <section id="services" className="section-padding relative">
      <div className="glow-line mb-20" />
      <div ref={ref} className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-primary text-sm font-body tracking-widest uppercase">{t("services.subtitle")}</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            {t("services.title")} <span className="text-gradient">{t("services.title2")}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body">{t("services.desc")}</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 * i }} className="group glass rounded-2xl p-8 hover:border-primary/40 transition-all duration-500 hover:-translate-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors duration-300">
                <service.icon className="text-primary" size={24} />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
