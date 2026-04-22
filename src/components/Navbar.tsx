import { useState, useEffect, useRef } from "react";
import { Shield, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGardenShopStatus } from "@/hooks/useGardenShopStatus";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import logoColour from "@/assets/tinplant-logo-colour.png";

const topNavLinks = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
];

const dropdownLinks = [
  { key: "nav.technology", href: "/technology" },
  { key: "nav.services", href: "/services" },
  { key: "nav.research", href: "/research" },
];

const bottomNavLinks = [
  { key: "nav.gallery", href: "/gallery" },
  { key: "nav.products", href: "/products" },
  { key: "nav.contact", href: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { t } = useLanguage();
  const { data: gardenShopOpen } = useGardenShopStatus();

  const afterProductsLinks = gardenShopOpen
    ? [{ key: "nav.gardenShop", href: "/garden-shop" }]
    : [];

  const trailingLinks = [...bottomNavLinks.slice(0, 2), ...afterProductsLinks, ...bottomNavLinks.slice(2)];

  const allMobileLinks = [
    ...topNavLinks,
    ...dropdownLinks,
    ...trailingLinks,
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDropdownActive = dropdownLinks.some((l) => location.pathname === l.href);

  const NavItem = ({ link, index = 0 }: { link: { key: string; href: string }; index?: number }) => {
    const isActive = location.pathname === link.href;
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
        className="relative"
      >
        <Link
          to={link.href}
          className={`relative px-3 py-1.5 rounded-full text-xs font-body font-medium tracking-wide uppercase whitespace-nowrap transition-all duration-300 group ${
            isActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/5"
          }`}
        >
          <span className="relative z-10">{t(link.key)}</span>
          {isActive && (
            <motion.span
              layoutId="navbar-active-dot"
              className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-1 h-1 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
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
        scrolled ? "glass py-3" : "py-4 bg-background/95 backdrop-blur-md shadow-sm"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        <Link to="/" className="flex items-center group">
          <motion.img
            src={logoColour}
            alt="TinPlant Logo"
            className="h-10 w-auto"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
        </Link>

        <div className="hidden lg:flex items-center gap-5">
          {topNavLinks.map((link, i) => (
            <NavItem key={link.href} link={link} index={i} />
          ))}

          {/* Dropdown for Technology, Services, Research */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-1 text-xs font-body font-medium tracking-wide uppercase whitespace-nowrap transition-colors duration-300 ${
                isDropdownActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {t("nav.expertise")}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-lg overflow-hidden"
                >
                  {dropdownLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`block px-4 py-3 text-sm font-body font-medium tracking-wide transition-colors duration-200 ${
                        location.pathname === link.href
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {t(link.key)}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {trailingLinks.map((link, i) => (
            <NavItem key={link.href} link={link} index={topNavLinks.length + 1 + i} />
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
          <Link to="/admin/login" className="text-muted-foreground hover:text-primary transition-colors duration-300 hover:rotate-12 transform" title="Admin">
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
            className="lg:hidden glass mt-2 mx-4 rounded-lg overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {topNavLinks.map((link) => (
                <Link key={link.href} to={link.href} className="text-foreground font-medium text-lg hover:text-primary transition-colors">
                  {t(link.key)}
                </Link>
              ))}
              {/* Mobile dropdown */}
              <button
                onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                className={`flex items-center justify-between text-lg font-medium transition-colors ${
                  isDropdownActive ? "text-primary" : "text-foreground hover:text-primary"
                }`}
              >
                {t("nav.expertise")}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${mobileDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {mobileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-3 pl-4 border-l-2 border-primary/30"
                  >
                    {dropdownLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={`text-base font-medium transition-colors ${
                          location.pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {t(link.key)}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {trailingLinks.map((link) => (
                <Link key={link.href} to={link.href} className="text-foreground font-medium text-lg hover:text-primary transition-colors">
                  {t(link.key)}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
