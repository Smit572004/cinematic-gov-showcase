import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Upload, ImageIcon, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

type Product = {
  id: string;
  name_en: string;
  name_de: string;
  description_en: string | null;
  description_de: string | null;
  species: string;
  container_size: string;
  price: number | null;
  availability: string;
  image_url: string | null;
  category: string;
};

const emptyForm = {
  name_de: "", description_de: "",
  species: "", container_size: "medium", price: 0, availability: "in-stock", image_url: null as string | null,
  category: "forestry",
};

const translateTexts = async (texts: string[]): Promise<string[]> => {
  const { data, error } = await supabase.functions.invoke("translate", {
    body: { texts },
  });
  if (error) throw error;
  return data.translations;
};

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const de = lang === "de";
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name_de");
      if (error) throw error;
      return data as Product[];
    },
  });

  const openNew = () => {
    setForm(emptyForm);
    setEditProduct(null);
    setIsNew(true);
    setPreviewUrl(null);
  };

  const openEdit = (p: Product) => {
    setForm({ name_de: p.name_de, description_de: p.description_de || "", species: p.species, container_size: p.container_size, price: p.price, availability: p.availability, image_url: p.image_url, category: p.category || "forestry" });
    setEditProduct(p);
    setIsNew(false);
    setPreviewUrl(p.image_url);
  };

  const closeModal = () => { setEditProduct(null); setIsNew(false); setPreviewUrl(null); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error(de ? "Bitte laden Sie eine Bilddatei hoch" : "Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(de ? "Bild muss unter 5MB sein" : "Image must be under 5MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("product-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error((de ? "Upload fehlgeschlagen: " : "Upload failed: ") + error.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setPreviewUrl(urlData.publicUrl);
    setUploading(false);
    toast.success(de ? "Bild hochgeladen" : "Image uploaded");
  };

  const handleSave = async () => {
    if (!form.name_de.trim()) { toast.error(de ? "Name ist erforderlich" : "Name is required"); return; }
    setSaving(true);

    try {
      const textsToTranslate = [form.name_de, form.description_de || ""].filter(Boolean);
      const translations = await translateTexts(textsToTranslate);
      const name_en = translations[0] || form.name_de;
      const description_en = form.description_de ? (translations[1] || form.description_de) : null;

      const payload = {
        name_de: form.name_de,
        name_en,
        description_de: form.description_de || null,
        description_en,
        species: form.species,
        container_size: form.container_size,
        price: form.price,
        availability: form.availability,
        image_url: form.image_url,
        category: form.category,
      };

      if (isNew) {
        const { error } = await supabase.from("products").insert(payload);
        if (error) { toast.error(error.message); setSaving(false); return; }
        toast.success(de ? "Produkt erstellt (automatisch übersetzt)" : "Product created (auto-translated to English)");
      } else if (editProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editProduct.id);
        if (error) { toast.error(error.message); setSaving(false); return; }
        toast.success(de ? "Produkt aktualisiert (automatisch übersetzt)" : "Product updated (auto-translated to English)");
      }
    } catch (err: any) {
      toast.error((de ? "Übersetzung fehlgeschlagen: " : "Translation failed: ") + (err.message || (de ? "Unbekannter Fehler" : "Unknown error")));
      setSaving(false);
      return;
    }

    setSaving(false);
    closeModal();
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(de ? "Dieses Produkt löschen?" : "Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(de ? "Produkt gelöscht" : "Product deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const showModal = isNew || editProduct;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{de ? "Produkte" : "Products"}</h1>
          <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-1">
            <Languages size={12} /> {de ? "Eingabe auf Deutsch — Englisch wird automatisch übersetzt" : "Enter in German — English is auto-translated"}
          </p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:shadow-[var(--glow-green)] transition-all">
          <Plus size={16} /> {de ? "Produkt hinzufügen" : "Add Product"}
        </button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground font-body">{de ? "Laden..." : "Loading..."}</div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-muted-foreground font-medium w-10">{de ? "Bild" : "Image"}</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium">{de ? "Name" : "Name"}</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">{de ? "Art" : "Species"}</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">{de ? "Größe" : "Size"}</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">{de ? "Kategorie" : "Category"}</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium">{de ? "Preis" : "Price"}</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">{de ? "Status" : "Status"}</th>
                  <th className="px-4 py-3 text-muted-foreground font-medium text-right">{de ? "Aktionen" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center"><ImageIcon size={12} className="text-muted-foreground" /></div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name_de}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.species}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell capitalize">{p.container_size}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.category === 'garden' ? 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30' : 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'}`}>
                        {p.category === 'garden' ? (de ? '🌺 Garten' : '🌺 Garden') : (de ? '🌲 Forst' : '🌲 Forestry')}
                      </span>
                    </td>
                    <td className="px-4 py-3">€{Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell capitalize">{p.availability}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground mr-1"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={(e) => e.stopPropagation()} className="glass rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 border border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">{isNew ? (de ? "Neues Produkt" : "New Product") : (de ? "Produkt bearbeiten" : "Edit Product")}</h2>
                <button onClick={closeModal} className="p-1.5 rounded-md hover:bg-muted"><X size={18} /></button>
              </div>
              <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                <Languages size={12} /> {de ? "Englische Übersetzung wird automatisch erstellt" : "English translation is created automatically"}
              </p>
              <InputField label={de ? "Name (Deutsch)" : "Name (German)"} value={form.name_de} onChange={(v) => setForm({ ...form, name_de: v })} />
              <TextAreaField label={de ? "Beschreibung (Deutsch)" : "Description (German)"} value={form.description_de || ""} onChange={(v) => setForm({ ...form, description_de: v })} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label={de ? "Art / Spezies" : "Species"} value={form.species} onChange={(v) => setForm({ ...form, species: v })} />
                <div>
                  <label className="text-xs font-body text-muted-foreground mb-1 block">{de ? "Topfgröße" : "Container Size"}</label>
                  <select value={form.container_size} onChange={(e) => setForm({ ...form, container_size: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body text-foreground focus:border-primary focus:outline-none">
                    <option value="small">{de ? "Klein" : "Small"}</option>
                    <option value="medium">{de ? "Mittel" : "Medium"}</option>
                    <option value="large">{de ? "Groß" : "Large"}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label={de ? "Preis (€)" : "Price (€)"} value={String(form.price || "")} type="number" onChange={(v) => setForm({ ...form, price: parseFloat(v) || 0 })} />
                <div>
                  <label className="text-xs font-body text-muted-foreground mb-1 block">{de ? "Verfügbarkeit" : "Availability"}</label>
                  <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body text-foreground focus:border-primary focus:outline-none">
                    <option value="in-stock">{de ? "Auf Lager" : "In Stock"}</option>
                    <option value="pre-order">{de ? "Vorbestellung" : "Pre-order"}</option>
                    <option value="seasonal">{de ? "Saisonal" : "Seasonal"}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground mb-1 block">{de ? "Kategorie" : "Category"}</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body text-foreground focus:border-primary focus:outline-none">
                  <option value="forestry">{de ? "🌲 Forstpflanzen" : "🌲 Forestry Plants"}</option>
                  <option value="garden">{de ? "🌺 Gartenpflanzen" : "🌺 Garden Plants"}</option>
              </select>
              </div>
              {/* Image Upload */}
              <div>
                <label className="text-xs font-body text-muted-foreground mb-1 block">{de ? "Produktbild" : "Product Image"}</label>
                <div className="flex items-center gap-4">
                  {previewUrl ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={previewUrl} alt={de ? "Vorschau" : "Preview"} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setPreviewUrl(null); setForm((prev) => ({ ...prev, image_url: null })); }} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                      <ImageIcon size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-body font-medium hover:bg-muted/50 transition-colors disabled:opacity-50">
                      <Upload size={14} />
                      {uploading ? (de ? "Wird hochgeladen..." : "Uploading...") : (de ? "Bild hochladen" : "Upload Image")}
                    </button>
                    <p className="text-[10px] text-muted-foreground mt-1">Max 5MB. JPG, PNG, WebP.</p>
                  </div>
                </div>
              </div>
              <button onClick={handleSave} disabled={saving || uploading} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:shadow-[var(--glow-green)] transition-all disabled:opacity-70">
                {saving
                  ? (de ? "Wird gespeichert & übersetzt..." : "Saving & translating...")
                  : isNew
                    ? (de ? "Produkt erstellen" : "Create Product")
                    : (de ? "Produkt aktualisieren" : "Update Product")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

const InputField = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="text-xs font-body text-muted-foreground mb-1 block">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body text-foreground focus:border-primary focus:outline-none" />
  </div>
);

const TextAreaField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="text-xs font-body text-muted-foreground mb-1 block">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body text-foreground focus:border-primary focus:outline-none resize-none" />
  </div>
);

export default AdminProducts;
