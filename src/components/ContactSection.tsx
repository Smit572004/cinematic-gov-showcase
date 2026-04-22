import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/i18n/LanguageContext";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ContactSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const { error } = await supabase.from("contact_submissions").insert({
      full_name: formData.get("full_name") as string,
      organization: (formData.get("organization") as string) || null,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
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

  const contactInfo = [
    { icon: MapPin, label: t("contact.address"), value: "Magdeburger Landstr. 33\n39164 Wanzleben-Börde\nSachsen-Anhalt, Germany" },
    { icon: Phone, label: t("contact.phone"), value: "+49 3904 66170" },
    { icon: Mail, label: t("contact.email"), value: "info@tinplant.com" },
  ];

  return (
    <section id="contact" className="section-padding relative">
      <div className="glow-line mb-20" />
      <div ref={ref} className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} className="text-center mb-16">
          <span className="text-primary text-sm font-body tracking-widest uppercase">{t("contact.subtitle")}</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-4">
            {t("contact.title1")} <span className="text-gradient">{t("contact.title2")}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body">{t("contact.desc")}</p>
        </motion.div>
        <div className="grid lg:grid-cols-5 gap-10">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={isVisible ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-8">
            {contactInfo.map((item) => (
              <div key={item.label} className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="text-primary" size={20} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-body">{item.label}</div>
                  <div className="font-body font-medium whitespace-pre-line">{item.value}</div>
                </div>
              </div>
            ))}
          </motion.div>
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: 40 }} animate={isVisible ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 }} className="lg:col-span-3 glass rounded-2xl p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <input name="full_name" type="text" placeholder={t("contact.fullName")} required className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
              <input name="organization" type="text" placeholder={t("contact.organization")} className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
            </div>
            <input name="email" type="email" placeholder={t("contact.emailAddress")} required className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
            <textarea name="message" placeholder={t("contact.message")} rows={5} required className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none" />
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:shadow-[var(--glow-green)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-70">
              {loading ? t("contact.sending") : submitted ? t("contact.sent") : (<>{t("contact.send")} <Send size={16} /></>)}
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
