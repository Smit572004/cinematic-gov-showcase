import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Flower2, Package, CheckCircle, Clock, Leaf, Mail, Gift, Users, Percent, Tag, Star, Heart, Zap, Award } from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  gift: Gift, users: Users, percent: Percent, tag: Tag, star: Star, heart: Heart, zap: Zap, award: Award,
};
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/PageLayout";
import PageHero from "@/components/PageHero";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGardenShopStatus } from "@/hooks/useGardenShopStatus";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";

const containerLabels = {
  small: { en: "Small (95–125 ml)", de: "Klein (95–125 ml)" },
  medium: { en: "Medium (150–200 ml)", de: "Mittel (150–200 ml)" },
  large: { en: "Large (220–270 ml)", de: "Groß (220–270 ml)" },
};

const availabilityConfig = {
  "in-stock": { en: "In Stock", de: "Auf Lager", color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30", icon: CheckCircle },
  "pre-order": { en: "Pre-Order", de: "Vorbestellung", color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30", icon: Clock },
  seasonal: { en: "Seasonal", de: "Saisonal", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30", icon: Leaf },
};

const GardenShopPage = () => {
  const { t, lang } = useLanguage();
  const { data: gardenShopOpen, isLoading: statusLoading } = useGardenShopStatus();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["garden-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", "garden")
        .order("name_en");
      if (error) throw error;
      return data;
    },
    enabled: gardenShopOpen === true,
  });

  const { data: offers = [] } = useQuery({
    queryKey: ["garden-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garden_offers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: gardenShopOpen === true,
  });

  const filtered = useMemo(() => products.filter((p) => {
    const name = lang === "de" ? p.name_de : p.name_en;
    const desc = lang === "de" ? p.description_de : p.description_en;
    const q = search.toLowerCase();
    if (q && !name.toLowerCase().includes(q) && !(desc || "").toLowerCase().includes(q)) return false;
    return true;
  }), [products, search, lang]);

  // Redirect if shop is closed
  if (!statusLoading && !gardenShopOpen) {
    return <Navigate to="/products" replace />;
  }

  return (
    <PageLayout>
      <PageHero
        title={lang === "de" ? "Gartenshop" : "Garden Shop"}
        subtitle={lang === "de" ? "Saisonale Pflanzen" : "Seasonal Plants"}
        description={lang === "de"
          ? "Entdecken Sie unsere Auswahl an Blumen, Gemüse und Zierpflanzen — nur für begrenzte Zeit verfügbar!"
          : "Discover our selection of flowers, vegetables, and ornamental plants — available for a limited time only!"}
      />

      <section className="section-padding">
        <div className="container mx-auto">
          {/* Seasonal Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-8 border-2 border-pink-200 dark:border-pink-800/50 bg-gradient-to-r from-pink-50/50 to-green-50/50 dark:from-pink-950/20 dark:to-green-950/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <Flower2 className="text-pink-500" size={24} />
              <h3 className="font-display text-lg font-bold">
                {lang === "de" ? "🌺 Gartensaison ist eröffnet!" : "🌺 Garden Season is Open!"}
              </h3>
            </div>
            <p className="text-sm font-body text-muted-foreground">
              {lang === "de"
                ? "Unser Gartenshop ist saisonal geöffnet. Bestellen Sie jetzt Ihre Lieblingspflanzen für den Garten!"
                : "Our garden shop is seasonally open. Order your favorite garden plants now!"}
            </p>
          </motion.div>

          {/* Promotional Offers */}
          {offers.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {offers.map((offer, i) => {
                const OfferIcon = iconMap[offer.icon] || Gift;
                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="glass rounded-2xl p-6 border border-primary/30 relative overflow-hidden group hover:border-primary/60 transition-colors"
                  >
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                      {lang === "de" ? offer.badge_de : offer.badge_en}
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <OfferIcon className="text-primary" size={24} />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold mb-1">
                          {lang === "de" ? offer.title_de : (offer.title_en || offer.title_de)}
                        </h3>
                        <p className="text-sm font-body text-muted-foreground leading-relaxed">
                          {lang === "de" ? offer.description_de : (offer.description_en || offer.description_de)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-4 mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "de" ? "Gartenpflanzen suchen..." : "Search garden plants..."}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-body text-muted-foreground mb-6">
            {filtered.length} {lang === "de" ? "Produkte gefunden" : "products found"}
          </motion.p>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse space-y-4">
                  <div className="h-40 bg-muted/50 rounded-xl" />
                  <div className="h-4 bg-muted/50 rounded w-3/4" />
                  <div className="h-3 bg-muted/50 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Flower2 className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="font-display text-xl font-bold mb-2">
                {lang === "de" ? "Keine Gartenpflanzen gefunden" : "No garden plants found"}
              </h3>
            </motion.div>
          ) : (
            <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((product, i) => {
                  const name = lang === "de" ? product.name_de : product.name_en;
                  const desc = lang === "de" ? product.description_de : product.description_en;
                  const avail = availabilityConfig[product.availability as keyof typeof availabilityConfig] || availabilityConfig["in-stock"];
                  const AvailIcon = avail.icon;
                  const sizeLabel = containerLabels[product.container_size as keyof typeof containerLabels];

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      whileHover={{ y: -6 }}
                      className="glass rounded-2xl overflow-hidden group cursor-pointer"
                    >
                      <div className="h-40 bg-gradient-to-br from-pink-100/30 via-green-100/20 to-transparent dark:from-pink-900/20 dark:via-green-900/10 flex items-center justify-center relative overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <motion.span className="text-6xl" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                            🌺
                          </motion.span>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${avail.color}`}>
                            <AvailIcon size={10} />
                            {avail[lang]}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <h3 className="font-display text-base font-bold leading-tight group-hover:text-primary transition-colors">{name}</h3>
                        <p className="text-xs font-body text-muted-foreground leading-relaxed line-clamp-3">{desc}</p>
                        {sizeLabel && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-body text-muted-foreground">
                            <Package size={9} /> {sizeLabel[lang]}
                          </span>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="font-display text-lg font-bold text-primary">€{Number(product.price).toFixed(2)}</span>
                          <Link to="/contact" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:shadow-[var(--glow-green)] transition-all duration-300 hover:scale-105">
                            <Mail size={11} />
                            {lang === "de" ? "Anfrage" : "Request Quote"}
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default GardenShopPage;
