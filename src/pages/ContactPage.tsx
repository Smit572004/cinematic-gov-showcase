import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/PageLayout";
import PageHero from "@/components/PageHero";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/i18n/LanguageContext";
import { MapPin, Phone, Mail, Send, Clock, MessageCircle, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ContactPage = () => {
  const { ref, isVisible } = useScrollAnimation(0.05);
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const { error } = await supabase.from("contact_submissions").insert({
      full_name: fd.get("full_name") as string,
      organization: (fd.get("organization") as string) || null,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || null,
      subject: (fd.get("subject") as string) || null,
      message: fd.get("message") as string,
    });

    setLoading(false);
    if (error) {
      toast.error(t("contact.error"));
    } else {
      setSubmitted(true);
      form.reset();
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  const contactItems = [
    { icon: MapPin, label: t("contact.address"), value: "Magdeburger Landstr. 33\n39164 Wanzleben-Börde\nSachsen-Anhalt, Germany" },
    { icon: Phone, label: t("contact.phone"), value: "+49 39209 69 69 0" },
    { icon: Printer, label: "Fax", value: "+49 39209 69 69 19" },
    { icon: MessageCircle, label: "WhatsApp", value: "+49 157 87930211" },
    { icon: Mail, label: t("contact.email"), value: "info@tinplant-gmbh.de" },
    { icon: Clock, label: t("contact.officeHours"), value: t("contact.officeHoursValue") },
  ];

  return (
    <PageLayout>
      <PageHero title={t("pageHero.contactTitle")} subtitle={t("pageHero.contactSubtitle")} description={t("pageHero.contactDesc")} />

      <section className="section-padding">
        <div ref={ref} className="container mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={isVisible ? { opacity: 1, x: 0 } : {}} className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="font-display text-2xl font-bold mb-6">{t("contact.contactInfo")} </h2>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{t("contact.contactInfoDesc")}</p>
              </div>
              {contactItems.map((item) => (
                <div key={item.label} className="flex gap-4 items-start group">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="text-primary" size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-body">{item.label}</div>
                    <div className="font-body font-medium whitespace-pre-line text-sm">{item.value}</div>
                  </div>
                </div>
              ))}
              <div className="glass rounded-xl p-5">
                <h4 className="font-display font-bold text-sm mb-2">{t("contact.legalInfo")}</h4>
                <div className="text-muted-foreground text-xs font-body space-y-1">
                  <p>TinPlant Biotechnik und Pflanzenvermehrung GmbH</p>
                  <p>Geschäftsführer: Claus Hoelk</p>
                  <p>Registergericht Stendal (HRB 103512)</p>
                  <p>USt.-Id.Nr.: DE 139310312</p>
                  <p>St.Nr.: 102/106/06438</p>
                </div>
              </div>
            </motion.div>

            <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: 40 }} animate={isVisible ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.2 }} className="lg:col-span-3 glass rounded-2xl p-8 space-y-5">
              <h3 className="font-display text-xl font-bold mb-2">{t("contact.sendUsMessage")}</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.fullName")} *</label>
                  <input name="full_name" type="text" required className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.organization")}</label>
                  <input name="organization" type="text" className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.email")} *</label>
                  <input name="email" type="email" required className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.phonePlaceholder")}</label>
                  <input name="phone" type="tel" className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.subject")}</label>
                <select name="subject" className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:border-primary focus:outline-none transition-colors">
                  <option value="">{t("contact.selectTopic")}</option>
                  <option value="seedlings">{t("contact.seedlingOrder")}</option>
                  <option value="consultation">{t("contact.consultation")}</option>
                  <option value="research">{t("contact.researchCollab")}</option>
                  <option value="visit">{t("contact.facilityVisit")}</option>
                  <option value="other">{t("contact.other")}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-body text-muted-foreground mb-1.5 block">{t("contact.message")} *</label>
                <textarea name="message" rows={6} required className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none" placeholder={t("contact.message")} />
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:shadow-[var(--glow-green)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-70">
                {loading ? t("contact.sending") : submitted ? t("contact.sent") : (<>{t("contact.send")} <Send size={16} /></>)}
              </button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Google Map Section */}
      <section className="section-padding">
        <div className="container mx-auto">
          <div className="glass rounded-2xl overflow-hidden border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2448.5!2d11.3744741!3d52.0675243!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a58952ebbd52b3%3A0x4ad1143cdea23acb!2sTINPLANT%20Biotechnik%20und%20Pflanzenvermehrung%20GmbH!5e0!3m2!1sde!2sde!4v1700000000000"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="TinPlant Location"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="section-padding bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              {t("contact.teamTitle")}
            </h2>
          </motion.div>
          <TeamMembersGrid lang={lang} />
        </div>
      </section>
    </PageLayout>
  );
};

const TeamMembersGrid = ({ lang }: { lang: string }) => {
  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {members.map((member, i) => (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className="glass rounded-xl p-8 text-center space-y-4"
        >
          <div>
            <p className="text-xs font-body tracking-[0.2em] text-primary font-semibold uppercase">
              {lang === "de" ? member.role_de : member.role_en}
            </p>
            <h3 className="font-display text-lg font-bold mt-1">{member.name}</h3>
          </div>
          <div className="space-y-2 text-sm font-body text-muted-foreground">
            {member.phone && (
              <p className="flex items-center justify-center gap-2">
                <Phone size={14} className="text-primary" /> {member.phone}
              </p>
            )}
            {member.email && (
              <p>
                <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors underline underline-offset-2">
                  {member.email}
                </a>
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ContactPage;
