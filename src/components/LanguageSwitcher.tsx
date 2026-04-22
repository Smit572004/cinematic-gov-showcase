import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border/50 overflow-hidden text-xs font-body">
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1.5 transition-colors duration-200 ${
          lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("de")}
        className={`px-2.5 py-1.5 transition-colors duration-200 ${
          lang === "de" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        DE
      </button>
    </div>
  );
};

export default LanguageSwitcher;
