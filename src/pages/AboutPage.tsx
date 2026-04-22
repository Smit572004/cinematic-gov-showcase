import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import PageHero from "@/components/PageHero";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/i18n/LanguageContext";
import teamImg from "@/assets/team-photo.jpg";
import nurseryImg from "@/assets/services-nursery.jpg";
import { Award, Users, Globe, Target, BookOpen, Handshake } from "lucide-react";

const AboutPage = () => {
  const { ref: timelineRef, isVisible: timelineVisible } = useScrollAnimation();
  const { ref: valuesRef, isVisible: valuesVisible } = useScrollAnimation();
  const { ref: teamRef, isVisible: teamVisible } = useScrollAnimation();
  const { t } = useLanguage();

  const milestones = [
    { year: "1992", title: t("aboutPage.m1992Title"), desc: t("aboutPage.m1992Desc") },
    { year: "2000", title: t("aboutPage.m2000Title"), desc: t("aboutPage.m2000Desc") },
    { year: "2010", title: t("aboutPage.m2010Title"), desc: t("aboutPage.m2010Desc") },
    { year: "2020", title: t("aboutPage.m2020Title"), desc: t("aboutPage.m2020Desc") },
    { year: "2025", title: t("aboutPage.m2025Title"), desc: t("aboutPage.m2025Desc") },
  ];

  const values = [
    { icon: Target, title: t("aboutPage.precision"), desc: t("aboutPage.precisionDesc") },
    { icon: BookOpen, title: t("aboutPage.researchDriven"), desc: t("aboutPage.researchDrivenDesc") },
    { icon: Handshake, title: t("aboutPage.partnership"), desc: t("aboutPage.partnershipDesc") },
    { icon: Globe, title: t("aboutPage.globalKnowledge"), desc: t("aboutPage.globalKnowledgeDesc") },
    { icon: Users, title: t("aboutPage.expertTeam"), desc: t("aboutPage.expertTeamDesc") },
    { icon: Award, title: t("aboutPage.qualityFirst"), desc: t("aboutPage.qualityFirstDesc") },
  ];

  return (
    <PageLayout>
      <PageHero
        title={t("pageHero.aboutTitle")}
        subtitle={t("pageHero.aboutSubtitle")}
        description={t("pageHero.aboutDesc")}
        backgroundImage={nurseryImg}
      />

      {/* Company Story */}
      <section className="section-padding">
        <div ref={teamRef} className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={teamVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="rounded-2xl overflow-hidden">
              <img src={teamImg} alt="TinPlant team" loading="lazy" width={1024} height={768} className="w-full h-[450px] object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={teamVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">{t("aboutPage.storyTitle")} <span className="text-gradient">{t("aboutPage.storyTitle2")}</span></h2>
            <p className="text-muted-foreground font-body leading-relaxed mb-4">{t("aboutPage.storyP1")}</p>
            <p className="text-muted-foreground font-body leading-relaxed mb-4">{t("aboutPage.storyP2")}</p>
            <p className="text-muted-foreground font-body leading-relaxed">{t("aboutPage.storyP3")}</p>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding">
        <div className="glow-line mb-16" />
        <div ref={timelineRef} className="container mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-16">{t("aboutPage.journeyTitle")} <span className="text-gradient">{t("aboutPage.journeyTitle2")}</span></h2>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border hidden md:block" />
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                animate={timelineVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.1 * i, duration: 0.6 }}
                className={`flex items-center mb-12 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} flex-col md:gap-8`}
              >
                <div className={`md:w-5/12 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <div className="glass rounded-xl p-6 hover:border-primary/40 transition-colors duration-300">
                    <div className="text-primary font-display text-2xl font-bold">{m.year}</div>
                    <div className="font-display font-bold text-lg mt-1">{m.title}</div>
                    <p className="text-muted-foreground text-sm font-body mt-2">{m.desc}</p>
                  </div>
                </div>
                <div className="hidden md:flex w-2/12 justify-center">
                  <div className="w-4 h-4 rounded-full bg-primary animate-glow-pulse" />
                </div>
                <div className="md:w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="glow-line mb-16" />
        <div ref={valuesRef} className="container mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-16">{t("aboutPage.valuesTitle")} <span className="text-gradient">{t("aboutPage.valuesTitle2")}</span></h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={valuesVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.08 * i, duration: 0.5 }}
                className="group glass rounded-2xl p-8 hover:border-primary/40 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <v.icon className="text-primary" size={24} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm font-body leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AboutPage;
