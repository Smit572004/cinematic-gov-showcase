import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import PageHero from "@/components/PageHero";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/i18n/LanguageContext";
import researchImg from "@/assets/research-field.jpg";
import techLabImg from "@/assets/technology-lab.jpg";
import coldChainImg from "@/assets/cold-chain.jpg";
import { BookOpen, Globe, FlaskConical, FileText, Users, TreePine } from "lucide-react";

const ResearchPage = () => {
  const { ref: pubRef, isVisible: pubVisible } = useScrollAnimation();
  const { ref: expertRef, isVisible: expertVisible } = useScrollAnimation();
  const { ref: bcRef, isVisible: bcVisible } = useScrollAnimation();
  const { t } = useLanguage();

  const publications = [
    { title: t("researchPage.pub1Title"), date: "January 2026", desc: t("researchPage.pub1Desc"), authors: "Claus Hoelk, with review by Dr. Steven C. Grossnickle & David Swain" },
    { title: t("researchPage.pub2Title"), desc: t("researchPage.pub2Desc"), date: "2025", authors: "TinPlant Research Division" },
    { title: t("researchPage.pub3Title"), desc: t("researchPage.pub3Desc"), date: "Autumn 2025", authors: "TinPlant Biotechnik" },
  ];

  const experts = [
    { name: t("researchPage.expert1Name"), title: t("researchPage.expert1Title"), desc: t("researchPage.expert1Desc") },
    { name: t("researchPage.expert2Name"), title: t("researchPage.expert2Title"), desc: t("researchPage.expert2Desc") },
    { name: t("researchPage.expert3Name"), title: t("researchPage.expert3Title"), desc: t("researchPage.expert3Desc") },
  ];

  const refCards = [
    { icon: Globe, title: t("researchPage.ref1Title"), desc: t("researchPage.ref1Desc"), img: researchImg },
    { icon: FlaskConical, title: t("researchPage.ref2Title"), desc: t("researchPage.ref2Desc"), img: techLabImg },
    { icon: TreePine, title: t("researchPage.ref3Title"), desc: t("researchPage.ref3Desc"), img: coldChainImg },
  ];

  return (
    <PageLayout>
      <PageHero
        title={t("pageHero.researchTitle")}
        subtitle={t("pageHero.researchSubtitle")}
        description={t("pageHero.researchDesc")}
        backgroundImage={researchImg}
      />

      {/* BC Reference */}
      <section className="section-padding">
        <div ref={bcRef} className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={bcVisible ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-body tracking-widest uppercase">{t("researchPage.refLabel")}</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mt-3 mb-4">
              {t("researchPage.refTitle1")} <span className="text-gradient">{t("researchPage.refTitle2")}</span>
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto font-body">{t("researchPage.refDesc")}</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {refCards.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={bcVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15 * i }}
                className="glass rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 group"
              >
                <div className="h-48 overflow-hidden">
                  <img src={item.img} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-6">
                  <item.icon className="text-primary mb-3" size={24} />
                  <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm font-body leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Publications */}
      <section className="section-padding">
        <div className="glow-line mb-16" />
        <div ref={pubRef} className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={pubVisible ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold">
              <span className="text-gradient">{t("researchPage.pubTitle1")}</span> {t("researchPage.pubTitle2")}
            </h2>
          </motion.div>

          <div className="space-y-6">
            {publications.map((pub, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -40 }}
                animate={pubVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.15 * i }}
                className="glass rounded-2xl p-8 hover:border-primary/40 transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="text-primary" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display font-bold text-lg">{pub.title}</h3>
                      <span className="text-primary text-xs font-body tracking-wider">{pub.date}</span>
                    </div>
                    <p className="text-muted-foreground text-sm font-body leading-relaxed mb-2">{pub.desc}</p>
                    <p className="text-muted-foreground/70 text-xs font-body italic">{pub.authors}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Advisors */}
      <section className="section-padding">
        <div className="glow-line mb-16" />
        <div ref={expertRef} className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={expertVisible ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold">
              {t("researchPage.expertTitle1")} <span className="text-gradient">{t("researchPage.expertTitle2")}</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {experts.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={expertVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15 * i }}
                className="glass rounded-2xl p-8 text-center hover:border-primary/40 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="text-primary" size={28} />
                </div>
                <h3 className="font-display font-bold text-lg">{e.name}</h3>
                <p className="text-primary text-xs font-body tracking-wider mt-1 mb-3">{e.title}</p>
                <p className="text-muted-foreground text-sm font-body leading-relaxed">{e.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ResearchPage;
