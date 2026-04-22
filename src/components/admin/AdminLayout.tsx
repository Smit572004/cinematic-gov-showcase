import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Package, Users, FileText, LogOut, ArrowLeft, Menu, X, Gift, Image, ChevronRight } from "lucide-react";
import logoColour from "@/assets/tinplant-logo-colour.png";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { labelEn: "Dashboard", labelDe: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { labelEn: "Products", labelDe: "Produkte", href: "/admin/products", icon: Package },
  { labelEn: "Team", labelDe: "Team", href: "/admin/team", icon: Users },
  { labelEn: "Content", labelDe: "Inhalt", href: "/admin/content", icon: FileText },
  { labelEn: "Offers", labelDe: "Angebote", href: "/admin/offers", icon: Gift },
  { labelEn: "Gallery", labelDe: "Galerie", href: "/admin/gallery", icon: Image },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const getLabel = (item: typeof navItems[0]) => lang === "de" ? item.labelDe : item.labelEn;

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-body">Loading admin...</span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const currentPage = navItems.find((item) => item.href === location.pathname);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-card border-r border-border/60 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand header */}
          <div className="p-5 pb-4">
            <Link to="/" className="flex items-center group">
              <img src={logoColour} alt="TinPlant Logo" className="h-9 w-auto" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-body font-medium transition-all duration-150 group relative ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="flex-1">{getLabel(item)}</span>
                  {active && <ChevronRight size={14} className="opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer actions */}
          <div className="p-3 border-t border-border/60 space-y-0.5">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-body font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={17} strokeWidth={1.8} />
              {lang === "de" ? "Zurück zur Seite" : "Back to Site"}
            </Link>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-body font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut size={17} strokeWidth={1.8} />
              {lang === "de" ? "Abmelden" : "Sign Out"}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-[260px] min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border/60 px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-body">
            <span className="text-muted-foreground hidden sm:inline">Admin</span>
            {currentPage && (
              <>
                <ChevronRight size={14} className="text-muted-foreground/50 hidden sm:inline" />
                <span className="font-medium text-foreground">{getLabel(currentPage)}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/60">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-body text-muted-foreground truncate max-w-[160px]">{user.email}</span>
            </div>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default AdminLayout;
