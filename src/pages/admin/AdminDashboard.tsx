import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Users, FileText, Store, Image, TrendingUp, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState(false);
  const { lang } = useLanguage();
  const de = lang === "de";

  const { data: productCount = 0 } = useQuery({
    queryKey: ["admin-product-count"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: teamCount = 0 } = useQuery({
    queryKey: ["admin-team-count"],
    queryFn: async () => {
      const { count } = await supabase.from("team_members").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: contentCount = 0 } = useQuery({
    queryKey: ["admin-content-count"],
    queryFn: async () => {
      const { count } = await supabase.from("site_content").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: galleryCount = 0 } = useQuery({
    queryKey: ["admin-gallery-count"],
    queryFn: async () => {
      const { count } = await supabase.from("gallery_images").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: gardenShopOpen = false } = useQuery({
    queryKey: ["garden-shop-status"],
    queryFn: async () => {
      const { data } = await supabase.from("site_content").select("value_de").eq("content_key", "garden_shop_open").single();
      return data?.value_de === "true";
    },
  });

  const toggleGardenShop = async (open: boolean) => {
    setToggling(true);
    const value = open ? "true" : "false";
    const { error } = await supabase
      .from("site_content")
      .update({ value_de: value, value_en: value })
      .eq("content_key", "garden_shop_open");
    if (error) {
      toast.error((de ? "Fehler: " : "Error: ") + error.message);
    } else {
      toast.success(open
        ? (de ? "Gartenshop ist jetzt geöffnet! 🌺" : "Garden shop is now open! 🌺")
        : (de ? "Gartenshop ist jetzt geschlossen 🔒" : "Garden shop is now closed 🔒")
      );
      queryClient.invalidateQueries({ queryKey: ["garden-shop-status"] });
    }
    setToggling(false);
  };

  const cards = [
    { label: de ? "Produkte" : "Products", count: productCount, icon: Package, href: "/admin/products", accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: de ? "Teammitglieder" : "Team Members", count: teamCount, icon: Users, href: "/admin/team", accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: de ? "Inhalte" : "Content Items", count: contentCount, icon: FileText, href: "/admin/content", accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { label: de ? "Galeriebilder" : "Gallery Images", count: galleryCount, icon: Image, href: "/admin/gallery", accent: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm font-body mt-1">
            {de ? "Verwalten Sie Ihre TinPlant-Website-Inhalte" : "Manage your TinPlant website content"}
          </p>
        </div>

        {/* Garden Shop Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-5 mb-8 flex items-center justify-between border border-border/60 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${gardenShopOpen ? "bg-primary/10" : "bg-muted/60"}`}>
              <Store size={20} className={gardenShopOpen ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold">
                {de ? "Gartenshop Status" : "Garden Shop Status"}
              </h3>
              <p className="text-xs font-body text-muted-foreground mt-0.5">
                {gardenShopOpen
                  ? (de ? "Geöffnet — Angebote sind auf der Website sichtbar" : "Open — Offers are visible on the website")
                  : (de ? "Geschlossen — Angebote sind ausgeblendet" : "Closed — Offers are hidden")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                gardenShopOpen
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {gardenShopOpen ? (de ? "Offen" : "Open") : (de ? "Geschlossen" : "Closed")}
            </span>
            <Switch checked={gardenShopOpen} onCheckedChange={toggleGardenShop} disabled={toggling} />
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <Link
                to={card.href}
                className="block bg-card rounded-xl p-5 border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.accent}`}>
                    <card.icon size={18} />
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                  />
                </div>
                <p className="text-3xl font-display font-bold tracking-tight">{card.count}</p>
                <p className="text-xs font-body text-muted-foreground mt-1">{card.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
