import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/PageLayout";
import PageHero from "@/components/PageHero";
import { useLanguage } from "@/i18n/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { X, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Category = "all" | "greenhouse" | "production" | "field" | "logistics";

type GalleryImage = {
  id: string;
  title_de: string;
  title_en: string;
  category: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const GalleryPage = () => {
  const { t, lang } = useLanguage();
  const { ref, isVisible } = useScrollAnimation(0.05);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: images = [] } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const categories: { key: Category; label: string }[] = [
    { key: "all", label: t("gallery.all") },
    { key: "greenhouse", label: t("gallery.greenhouse") },
    { key: "production", label: t("gallery.production") },
    { key: "field", label: t("gallery.field") },
    { key: "logistics", label: t("gallery.logisticsTab") },
  ];

  const filtered = activeCategory === "all" ? images : images.filter((img) => img.category === activeCategory);

  return (
    <PageLayout>
      <PageHero
        title={t("pageHero.galleryTitle")}
        subtitle={t("pageHero.gallerySubtitle")}
        description={t("pageHero.galleryDesc")}
      />

      <section className="section-padding">
        <div ref={ref} className="container mx-auto">
          {/* Category filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground shadow-[var(--glow-green)]"
                    : "glass text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Masonry grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-body">
              {lang === "de" ? "Keine Bilder in dieser Kategorie." : "No images in this category."}
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((img, i) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer"
                    onClick={() => setLightboxIndex(filtered.indexOf(img))}
                  >
                    <img
                      src={img.image_url || "/placeholder.svg"}
                      alt={lang === "de" ? img.title_de : img.title_en}
                      loading="lazy"
                      width={1024}
                      height={768}
                      className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-colors duration-500 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                        <ZoomIn className="mx-auto text-primary mb-2" size={32} />
                        <p className="font-display font-bold text-sm">{lang === "de" ? img.title_de : img.title_en}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-colors z-10"
            >
              <X size={24} />
            </button>

            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                className="absolute left-6 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-colors text-2xl font-bold z-10"
              >
                ‹
              </button>
            )}
            {lightboxIndex < filtered.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                className="absolute right-6 w-12 h-12 rounded-full glass flex items-center justify-center hover:bg-primary/20 transition-colors text-2xl font-bold z-10"
              >
                ›
              </button>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filtered[lightboxIndex].image_url || "/placeholder.svg"}
                alt={lang === "de" ? filtered[lightboxIndex].title_de : filtered[lightboxIndex].title_en}
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
              <p className="mt-4 font-display font-bold text-lg">
                {lang === "de" ? filtered[lightboxIndex].title_de : filtered[lightboxIndex].title_en}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

export default GalleryPage;
