import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, TreePine, Package, Tag, CheckCircle, Clock, Leaf, X, Mail, Ruler, Droplets, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/PageLayout";
import PageHero from "@/components/PageHero";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const speciesIcons: Record<string, string> = {
  Beech: "🌳",
  Oak: "🌳",
  Spruce: "🌲",
  Pine: "🌲",
  Larch: "🌲",
  Birch: "🌳",
  "Douglas Fir": "🌲",
  Cherry: "🌸",
};

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

const ProductsPage = () => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[number] | null>(null);

  const closeModal = useCallback(() => setSelectedProduct(null), []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("category", "forestry").order("name_en");
      if (error) throw error;
      return data;
    },
  });

  const allSpecies = useMemo(() => [...new Set(products.map((p) => p.species))], [products]);
  const maxPrice = useMemo(() => Math.max(...products.map((p) => Number(p.price) || 0), 10), [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const name = lang === "de" ? p.name_de : p.name_en;
      const desc = lang === "de" ? p.description_de : p.description_en;
      const q = search.toLowerCase();
      if (q && !name.toLowerCase().includes(q) && !(desc || "").toLowerCase().includes(q) && !p.species.toLowerCase().includes(q)) return false;
      if (selectedSpecies && p.species !== selectedSpecies) return false;
      if (selectedSize && p.container_size !== selectedSize) return false;
      if (selectedAvailability && p.availability !== selectedAvailability) return false;
      const price = Number(p.price) || 0;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      return true;
    });
  }, [products, search, selectedSpecies, selectedSize, selectedAvailability, priceRange, lang]);

  const clearFilters = () => {
    setSearch("");
    setSelectedSpecies(null);
    setSelectedSize(null);
    setSelectedAvailability(null);
    setPriceRange([0, maxPrice]);
  };

  const hasActiveFilters = selectedSpecies || selectedSize || selectedAvailability || search;

  return (
    <PageLayout>
      <PageHero
        title={t("pageHero.productsTitle")}
        subtitle={t("pageHero.productsSubtitle")}
        description={t("pageHero.productsDesc")}
      />

      <section className="section-padding">
        <div className="container mx-auto">
          {/* Search & Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("products.searchPlaceholder")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-body text-sm font-medium transition-all ${
                  showFilters ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary"
                }`}
              >
                <Filter size={16} />
                {t("products.filters")}
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                  {t("products.clearFilters")}
                </motion.button>
              )}
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 mt-6 border-t border-border">
                    {/* Species */}
                    <div>
                      <label className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <TreePine size={12} /> {t("products.species")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allSpecies.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSpecies(selectedSpecies === s ? null : s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${
                              selectedSpecies === s
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-foreground hover:bg-muted"
                            }`}
                          >
                            {speciesIcons[s] || "🌱"} {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Container Size */}
                    <div>
                      <label className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Package size={12} /> {t("products.containerSize")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(["small", "medium", "large"] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${
                              selectedSize === size
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-foreground hover:bg-muted"
                            }`}
                          >
                            {containerLabels[size][lang]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Availability */}
                    <div>
                      <label className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle size={12} /> {t("products.availability")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(availabilityConfig) as Array<keyof typeof availabilityConfig>).map((key) => (
                          <button
                            key={key}
                            onClick={() => setSelectedAvailability(selectedAvailability === key ? null : key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${
                              selectedAvailability === key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-foreground hover:bg-muted"
                            }`}
                          >
                            {availabilityConfig[key][lang]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Tag size={12} /> {t("products.priceRange")}
                      </label>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min={0}
                          max={maxPrice}
                          step={0.1}
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([0, parseFloat(e.target.value)])}
                          className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-xs font-body text-muted-foreground">
                          <span>€0.00</span>
                          <span className="font-medium text-foreground">≤ €{priceRange[1].toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Count */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-body text-muted-foreground mb-6"
          >
            {filtered.length} {t("products.resultsFound")}
          </motion.p>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse space-y-4">
                  <div className="h-40 bg-muted/50 rounded-xl" />
                  <div className="h-4 bg-muted/50 rounded w-3/4" />
                  <div className="h-3 bg-muted/50 rounded w-full" />
                  <div className="h-3 bg-muted/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <TreePine className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="font-display text-xl font-bold mb-2">{t("products.noResults")}</h3>
              <p className="text-muted-foreground font-body text-sm">{t("products.noResultsDesc")}</p>
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
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      className="glass rounded-2xl overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {/* Product image or decorative header */}
                      <div className="h-40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center relative overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <motion.span
                            className="text-6xl"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          >
                            {speciesIcons[product.species] || "🌱"}
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
                        <div>
                          <h3 className="font-display text-base font-bold leading-tight group-hover:text-primary transition-colors">
                            {name}
                          </h3>
                          <p className="text-xs font-body text-muted-foreground mt-1 flex items-center gap-1">
                            <TreePine size={10} /> {product.species}
                          </p>
                        </div>

                        <p className="text-xs font-body text-muted-foreground leading-relaxed line-clamp-3">
                          {desc}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap">
                          {sizeLabel && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-body text-muted-foreground">
                              <Package size={9} /> {sizeLabel[lang]}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="font-display text-lg font-bold text-primary">
                            €{Number(product.price).toFixed(2)}
                          </span>
                          <Link
                            to="/contact"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:shadow-[var(--glow-green)] transition-all duration-300 hover:scale-105"
                          >
                            <Mail size={11} />
                            {t("products.requestQuote")}
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

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (() => {
          const p = selectedProduct;
          const name = lang === "de" ? p.name_de : p.name_en;
          const desc = lang === "de" ? p.description_de : p.description_en;
          const avail = availabilityConfig[p.availability as keyof typeof availabilityConfig] || availabilityConfig["in-stock"];
          const AvailIcon = avail.icon;
          const sizeLabel = containerLabels[p.container_size as keyof typeof containerLabels];

          return (
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={closeModal}
            >
              <motion.div
                key="modal-content"
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="glass rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border"
              >
                {/* Header with image or icon */}
                <div className="h-52 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent flex items-center justify-center relative overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <motion.span
                      className="text-8xl"
                      animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {speciesIcons[p.species] || "🌱"}
                    </motion.span>
                  )}
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${avail.color}`}>
                      <AvailIcon size={12} />
                      {avail[lang]}
                    </span>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  {/* Title & species */}
                  <div>
                    <h2 className="font-display text-2xl font-bold">{name}</h2>
                    <p className="text-sm font-body text-muted-foreground mt-1 flex items-center gap-1.5">
                      <TreePine size={13} /> {p.species}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Info size={12} /> {t("products.description")}
                    </h4>
                    <p className="font-body text-sm leading-relaxed text-foreground">
                      {desc}
                    </p>
                  </div>

                  {/* Specifications grid */}
                  <div>
                    <h4 className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-3">
                      {t("products.specifications")}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <TreePine size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-body uppercase">{t("products.species")}</p>
                          <p className="text-sm font-body font-medium">{p.species}</p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-body uppercase">{t("products.containerSize")}</p>
                          <p className="text-sm font-body font-medium">{sizeLabel ? sizeLabel[lang] : p.container_size}</p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Tag size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-body uppercase">{t("products.unitPrice")}</p>
                          <p className="text-sm font-body font-medium text-primary">€{Number(p.price).toFixed(2)}</p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <AvailIcon size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-body uppercase">{t("products.availability")}</p>
                          <p className="text-sm font-body font-medium">{avail[lang]}</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex gap-3 pt-2">
                    <Link
                      to="/contact"
                      onClick={closeModal}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:shadow-[var(--glow-green)] transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Mail size={15} />
                      {t("products.requestQuote")}
                    </Link>
                    <button
                      onClick={closeModal}
                      className="px-6 py-3.5 rounded-xl border border-border text-foreground font-body text-sm font-medium hover:bg-muted/50 transition-colors"
                    >
                      {t("products.close")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </PageLayout>
  );
};

export default ProductsPage;
