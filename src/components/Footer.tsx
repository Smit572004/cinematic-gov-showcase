import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import logoWhite from "@/assets/tinplant-logo-white.png";

const Footer = () => {
  const { t } = useLanguage();

  const navLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.technology"), href: "/technology" },
    { label: t("nav.services"), href: "/services" },
    { label: t("nav.research"), href: "/research" },
    { label: t("nav.gallery"), href: "/gallery" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  return (
    <footer className="bg-[hsl(150,30%,10%)] text-[hsl(90,20%,90%)] border-t border-[hsl(150,20%,18%)]">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img src={logoWhite} alt="TinPlant Logo" className="h-10 w-auto" />
            </Link>
            <p className="text-[hsl(90,10%,60%)] text-sm font-body leading-relaxed">{t("footer.desc")}</p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 text-white">{t("footer.navigation")}</h4>
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href} className="text-[hsl(90,10%,60%)] text-sm font-body hover:text-primary transition-colors">{link.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 text-white">{t("footer.contact")}</h4>
            <div className="text-[hsl(90,10%,60%)] text-sm font-body space-y-2">
              <p>Magdeburger Landstr. 33</p>
              <p>39164 Wanzleben-Börde</p>
              <p>Sachsen-Anhalt, Germany</p>
              <p className="mt-3">Tel: +49 39209 69 69 0</p>
              <p>info@tinplant-gmbh.de</p>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 text-white">{t("footer.legal")}</h4>
            <div className="text-[hsl(90,10%,60%)] text-sm font-body space-y-2">
              <p>Registergericht Stendal</p>
              <p>HRB 103512</p>
              <p>USt.-Id.: DE 139310312</p>
              <p className="mt-3">Geschäftsführer: Claus Hoelk</p>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mt-12 mb-6" />
        <p className="text-[hsl(90,10%,50%)] text-xs font-body text-center">
          © {new Date().getFullYear()} TinPlant Biotechnik und Pflanzenvermehrung GmbH. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
