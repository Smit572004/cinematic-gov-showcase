import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import PageHero from "@/components/PageHero";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/i18n/LanguageContext";
import techLabImg from "@/assets/technology-lab.jpg";
import coldChainImg from "@/assets/cold-chain.jpg";
import { Thermometer, Droplets, TreePine, FlaskConical, ShieldCheck, BarChart3 } from "lucide-react";

const TechnologyPage = () => {
  const { ref: processRef, isVisible: processVisible } = useScrollAnimation();
  const { ref: coldRef, isVisible: coldVisible } = useScrollAnimation();
  const { t } = useLanguage();

  const processSteps = [
    { icon: FlaskConical, title: t("techPage.stepATitle"), subtitle: t("techPage.stepASub"), desc: t("techPage.stepADesc") },
    { icon: Thermometer, title: t("techPage.stepBTitle"), subtitle: t("techPage.stepBSub"), desc: t("techPage.stepBDesc") },
    { icon: Droplets, title: t("techPage.stepCTitle"), subtitle: t("techPage.stepCSub"), desc: t("techPage.stepCDesc") },
    { icon: TreePine, title: t("techPage.stepDTitle"), subtitle: t("techPage.stepDSub"), desc: t("techPage.stepDDesc") },
    { icon: BarChart3, title: t("techPage.stepETitle"), subtitle: t("techPage.stepESub"), desc: t("techPage.stepEDesc") },
    { icon: ShieldCheck, title: t("techPage.stepQCTitle"), subtitle: t("techPage.stepQCSub"), desc: t("techPage.stepQCDesc") },
  ];

  return (
    <PageLayout>
      <PageHero
        title={t("pageHero.techTitle")}
        subtitle={t("pageHero.techSubtitle")}
        description={t("pageHero.techDesc")}
        backgroundImage={techLabImg}
      />

      {/* Process Model */}
      <section className="section-padding">
        <div ref={processRef} className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={processVisible ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-body tracking-widest uppercase">{t("techPage.processLabel")}</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-3 mb-4">
              {t("techPage.processTitle1")} <span className="text-gradient">{t("techPage.processTitle2")}</span>
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto font-body">{t("techPage.processDesc")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={processVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * i, duration: 0.6 }}
                className="group glass rounded-2xl p-8 hover:border-primary/40 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="text-primary" size={24} />
                </div>
                <div className="text-primary text-xs font-body tracking-widest uppercase mb-1">{step.subtitle}</div>
                <h3 className="font-display font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm font-body leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cold Chain */}
      <section className="section-padding">
        <div className="glow-line mb-16" />
        <div ref={coldRef} className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={coldVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-primary text-sm font-body tracking-widest uppercase">{t("techPage.frostLabel")}</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 mb-6">
              {t("techPage.frostTitle1")} <span className="text-gradient">{t("techPage.frostTitle2")}</span> {t("techPage.frostTitle3")}
            </h2>
            <p className="text-muted-foreground font-body leading-relaxed mb-4">{t("techPage.frostP1")}</p>
            <p className="text-muted-foreground font-body leading-relaxed mb-4">{t("techPage.frostP2")}</p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              {[
                { label: t("techPage.storageTemp"), value: "-2°C" },
                { label: t("techPage.transportTarget"), value: "1-2°C" },
                { label: t("techPage.thawPeriod"), value: "10-14 days" },
                { label: t("techPage.thawRange"), value: "2-8°C" },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-xl p-4 text-center">
                  <div className="text-primary font-display text-2xl font-bold">{stat.value}</div>
                  <div className="text-muted-foreground text-xs font-body mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={coldVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden">
              <img src={coldChainImg} alt="Cold chain facility" loading="lazy" width={1024} height={768} className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-2xl bg-primary/10 border border-primary/20 animate-float" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default TechnologyPage;
