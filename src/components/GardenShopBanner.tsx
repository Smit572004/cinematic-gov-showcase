import { motion, AnimatePresence } from "framer-motion";
import { Flower2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGardenShopStatus } from "@/hooks/useGardenShopStatus";
import { Link } from "react-router-dom";

const GardenShopBanner = () => {
  const { data: isOpen } = useGardenShopStatus();
  const { lang } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <Link to="/garden-shop" className="block">
            <div className="relative bg-gradient-to-r from-emerald-600/90 via-green-500/90 to-lime-500/90 dark:from-emerald-800/90 dark:via-green-700/90 dark:to-lime-700/90 py-3 px-6 text-center group cursor-pointer hover:brightness-110 transition-all duration-300">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }} />
              <div className="relative flex items-center justify-center gap-3 text-white font-semibold text-sm md:text-base">
                <Flower2 className="w-5 h-5 animate-pulse" />
                <span>
                  {lang === "de"
                    ? "🌷 Unser Gartenshop ist jetzt geöffnet! Entdecken Sie Blumen, Gemüse & mehr"
                    : "🌷 Our Garden Shop is now open! Discover flowers, vegetables & more"}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GardenShopBanner;
