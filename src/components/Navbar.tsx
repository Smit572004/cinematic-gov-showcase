import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGardenShopStatus } from "@/hooks/useGardenShopStatus";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import logoColour from "@/assets/tinplant-logo-colour.png";

const baseLinks = [
  { key: "nav.home", href: "/" },
  { key: "nav.products", href: "/products" },
  { key: "nav.gallery", href: "/gallery" },
  { key: "nav.contact", href: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { data: gardenShopOpen } = useGardenShopStatus();

  const navLinks = gardenShopOpen
    ? [
        ...baseLinks.slice(0, 2),
        { key: "nav.gardenShop", href: "/garden-shop" },
        ...baseLinks.slice(2),
      ]
    : baseLinks;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const NavItem = ({ link, index = 0 }: { link: { key: string; href: string }; index?: number }) => {
    const isActive = location.pathname === link.href;
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
        className="relative"
      >
        <Link
          to={link.href}
          className={`relative px-4 py-2 rounded-full text-[13px] font-body font-medium tracking-wide whitespace-nowrap transition-colors duration-300 ${
            isActive
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {isActive && (
            <motion.span
              layoutId="navbar-active-pill"
              className="absolute inset-0 rounded-full bg-primary shadow-md shadow-primary/30"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <span className="relative z-10">{t(link.key)}</span>
        </Link>
      </motion.div>
    );
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "py-2 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "py-4 bg-background/95 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        <Link to="/" className="flex items-center group">
          <motion.img
            src={logoColour}
            alt="TinPlant Logo"
            className="h-9 w-auto"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
        </Link>

        <div className="hidden lg:flex items-center gap-1 bg-muted/40 border border-border/40 rounded-full px-1.5 py-1.5 backdrop-blur-md">
          {navLinks.map((link, i) => (
            <NavItem key={link.href} link={link} index={i} />
          ))}
        </div>

        <motion.div
          className="hidden lg:flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            to="/admin/login"
            className="text-muted-foreground hover:text-primary transition-all duration-300 hover:rotate-12"
            title="Admin"
          >
            <Shield size={18} />
          </Link>
        </motion.div>

        <div className="flex items-center gap-3 lg:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden mt-2 mx-4 rounded-2xl overflow-hidden bg-card/95 backdrop-blur-xl border border-border/60 shadow-xl"
          >
            <div className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`px-4 py-3 rounded-xl font-body font-medium text-base transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {t(link.key)}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
