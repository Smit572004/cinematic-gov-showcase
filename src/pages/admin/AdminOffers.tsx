import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, Pencil, Trash2, GripVertical, ToggleLeft, ToggleRight, Save, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

type Offer = {
  id: string;
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  icon: string;
  badge_de: string;
  badge_en: string;
  is_active: boolean;
  sort_order: number;
};

const emptyOffer: Omit<Offer, "id"> = {
  title_de: "",
  title_en: "",
  description_de: "",
  description_en: "",
  icon: "gift",
  badge_de: "Angebot",
  badge_en: "Offer",
  is_active: true,
  sort_order: 0,
};

const iconOptions = ["gift", "users", "percent", "tag", "star", "heart", "zap", "award"];

const AdminOffers = () => {
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const de = lang === "de";
  const [editing, setEditing] = useState<Offer | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garden_offers")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Offer[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (offer: Omit<Offer, "id"> & { id?: string }) => {
      if (offer.id) {
        const { error } = await supabase.from("garden_offers").update({
          title_de: offer.title_de, title_en: offer.title_en,
          description_de: offer.description_de, description_en: offer.description_en,
          icon: offer.icon, badge_de: offer.badge_de, badge_en: offer.badge_en,
          is_active: offer.is_active, sort_order: offer.sort_order,
        }).eq("id", offer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("garden_offers").insert({
          title_de: offer.title_de, title_en: offer.title_en,
          description_de: offer.description_de, description_en: offer.description_en,
          icon: offer.icon, badge_de: offer.badge_de, badge_en: offer.badge_en,
          is_active: offer.is_active, sort_order: offer.sort_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      setEditing(null);
      setIsNew(false);
      toast.success(de ? "Angebot gespeichert!" : "Offer saved!");
    },
    onError: () => toast.error(de ? "Fehler beim Speichern" : "Error saving"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("garden_offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      toast.success(de ? "Angebot gelöscht!" : "Offer deleted!");
    },
    onError: () => toast.error(de ? "Fehler beim Löschen" : "Error deleting"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("garden_offers").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      toast.success(de ? "Status aktualisiert!" : "Status updated!");
    },
  });

  const handleNew = () => {
    setEditing({ ...emptyOffer, sort_order: offers.length } as any);
    setIsNew(true);
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.title_de.trim() || !editing.description_de.trim()) {
      toast.error(de ? "Titel und Beschreibung (DE) sind erforderlich" : "Title and description (DE) are required");
      return;
    }
    saveMutation.mutate(editing);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">{de ? "Gartenshop Angebote" : "Garden Shop Offers"}</h1>
            <p className="text-sm font-body text-muted-foreground mt-1">
              {de ? "Verwalten Sie saisonale Werbeaktionen und Angebote" : "Manage seasonal promotions and offers"}
            </p>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            {de ? "Neues Angebot" : "New Offer"}
          </button>
        </div>

        {/* Edit Form */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-display text-lg font-bold">
                  {isNew ? (de ? "Neues Angebot erstellen" : "Create New Offer") : (de ? "Angebot bearbeiten" : "Edit Offer")}
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-body font-medium text-muted-foreground mb-1">{de ? "Titel (DE) *" : "Title (DE) *"}</label>
                    <input
                      value={editing.title_de}
                      onChange={(e) => setEditing({ ...editing, title_de: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none"
                      placeholder={de ? "z.B. 3 kaufen, 1 gratis!" : "e.g. Buy 3, Get 1 Free!"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-muted-foreground mb-1">{de ? "Titel (EN)" : "Title (EN)"}</label>
                    <input
                      value={editing.title_en}
                      onChange={(e) => setEditing({ ...editing, title_en: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none"
                      placeholder={de ? "z.B. Buy 3, Get 1 Free!" : "e.g. Buy 3, Get 1 Free!"}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-body font-medium text-muted-foreground mb-1">{de ? "Beschreibung (DE) *" : "Description (DE) *"}</label>
                    <textarea
                      value={editing.description_de}
                      onChange={(e) => setEditing({ ...editing, description_de: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none resize-none"
                      placeholder={de ? "Angebotsbeschreibung auf Deutsch..." : "Offer description in German..."}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-muted-foreground mb-1">{de ? "Beschreibung (EN)" : "Description (EN)"}</label>
                    <textarea
                      value={editing.description_en}
                      onChange={(e) => setEditing({ ...editing, description_en: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none resize-none"
                      placeholder={de ? "Angebotsbeschreibung auf Englisch..." : "Offer description in English..."}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-body font-medium text-muted-foreground mb-1">Icon</label>
                    <select
                      value={editing.icon}
                      onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none"
                    >
                      {iconOptions.map((ic) => (
                        <option key={ic} value={ic}>{ic}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-muted-foreground mb-1">Badge (DE)</label>
                    <input
                      value={editing.badge_de}
                      onChange={(e) => setEditing({ ...editing, badge_de: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-muted-foreground mb-1">Badge (EN)</label>
                    <input
                      value={editing.badge_en}
                      onChange={(e) => setEditing({ ...editing, badge_en: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-muted-foreground mb-1">{de ? "Reihenfolge" : "Sort Order"}</label>
                    <input
                      type="number"
                      value={editing.sort_order}
                      onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saveMutation.isPending ? (de ? "Speichern..." : "Saving...") : (de ? "Speichern" : "Save")}
                  </button>
                  <button
                    onClick={() => { setEditing(null); setIsNew(false); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-body text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X size={16} />
                    {de ? "Abbrechen" : "Cancel"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offers List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="h-5 bg-muted/50 rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted/50 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <Gift className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="font-display text-lg font-bold mb-2">{de ? "Keine Angebote vorhanden" : "No offers available"}</h3>
            <p className="text-sm font-body text-muted-foreground">{de ? "Erstellen Sie Ihr erstes Angebot oben." : "Create your first offer above."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <motion.div
                key={offer.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card border rounded-xl p-5 flex items-start gap-4 ${
                  offer.is_active ? "border-primary/30" : "border-border opacity-60"
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Gift className="text-primary" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-sm">{offer.title_de}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-body">
                      {offer.badge_de}
                    </span>
                    {!offer.is_active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-body">
                        {de ? "Inaktiv" : "Inactive"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-body text-muted-foreground line-clamp-2">{offer.description_de}</p>
                  {offer.title_en && (
                    <p className="text-xs font-body text-muted-foreground/60 mt-1 italic">EN: {offer.title_en}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: offer.id, is_active: !offer.is_active })}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title={offer.is_active ? (de ? "Deaktivieren" : "Deactivate") : (de ? "Aktivieren" : "Activate")}
                  >
                    {offer.is_active ? (
                      <ToggleRight className="text-primary" size={20} />
                    ) : (
                      <ToggleLeft className="text-muted-foreground" size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => { setEditing(offer); setIsNew(false); }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="text-muted-foreground" size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(de ? "Angebot wirklich löschen?" : "Really delete this offer?")) deleteMutation.mutate(offer.id);
                    }}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="text-destructive" size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOffers;
