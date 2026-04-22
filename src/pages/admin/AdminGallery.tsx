import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Upload, ImageIcon, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

type GalleryImage = {
  id: string;
  title_de: string;
  title_en: string;
  category: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const categoriesDE = [
  { value: "greenhouse", label: "Gewächshaus" },
  { value: "production", label: "Produktion" },
  { value: "field", label: "Freiland" },
  { value: "logistics", label: "Logistik" },
];

const categoriesEN = [
  { value: "greenhouse", label: "Greenhouse" },
  { value: "production", label: "Production" },
  { value: "field", label: "Field" },
  { value: "logistics", label: "Logistics" },
];

const emptyForm = {
  title_de: "",
  category: "greenhouse",
  sort_order: 0,
  is_active: true,
  image_url: null as string | null,
};

const translateTexts = async (texts: string[]): Promise<string[]> => {
  const { data, error } = await supabase.functions.invoke("translate", {
    body: { texts },
  });
  if (error) throw error;
  return data.translations;
};

const AdminGallery = () => {
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const de = lang === "de";
  const categories = de ? categoriesDE : categoriesEN;
  const [editImage, setEditImage] = useState<GalleryImage | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const { error } = await supabase.storage.from("gallery-images").upload(fileName, file);
    if (error) {
      toast.error((de ? "Upload fehlgeschlagen: " : "Upload failed: ") + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("gallery-images").getPublicUrl(fileName);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setPreviewUrl(urlData.publicUrl);
    setUploading(false);
    toast.success(de ? "Bild hochgeladen" : "Image uploaded");
  };

  const openNew = () => {
    setEditImage(null);
    setIsNew(true);
    setForm(emptyForm);
    setPreviewUrl(null);
  };

  const openEdit = (img: GalleryImage) => {
    setEditImage(img);
    setIsNew(false);
    setForm({
      title_de: img.title_de,
      category: img.category,
      sort_order: img.sort_order,
      is_active: img.is_active,
      image_url: img.image_url,
    });
    setPreviewUrl(img.image_url);
  };

  const handleSave = async () => {
    if (!form.title_de.trim()) {
      toast.error(de ? "Bitte Titel eingeben" : "Please enter a title");
      return;
    }
    setSaving(true);
    try {
      const [titleEn] = await translateTexts([form.title_de]);
      const payload = {
        title_de: form.title_de,
        title_en: titleEn,
        category: form.category,
        sort_order: form.sort_order,
        is_active: form.is_active,
        image_url: form.image_url,
      };

      if (isNew) {
        const { error } = await supabase.from("gallery_images").insert(payload);
        if (error) { toast.error(error.message); setSaving(false); return; }
        toast.success(de ? "Bild hinzugefügt" : "Image added");
      } else if (editImage) {
        const { error } = await supabase.from("gallery_images").update(payload).eq("id", editImage.id);
        if (error) { toast.error(error.message); setSaving(false); return; }
        toast.success(de ? "Bild aktualisiert" : "Image updated");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      setEditImage(null);
      setIsNew(false);
    } catch (e: any) {
      toast.error((de ? "Fehler: " : "Error: ") + e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(de ? "Dieses Galeriebild löschen?" : "Delete this gallery image?")) return;
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(de ? "Bild gelöscht" : "Image deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
  };

  const toggleActive = async (img: GalleryImage) => {
    const { error } = await supabase
      .from("gallery_images")
      .update({ is_active: !img.is_active })
      .eq("id", img.id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
    toast.success(img.is_active
      ? (de ? "Bild deaktiviert" : "Image deactivated")
      : (de ? "Bild aktiviert" : "Image activated")
    );
  };

  const showForm = isNew || editImage !== null;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">{de ? "Galerie" : "Gallery"}</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              {de ? "Bilder in der Galerie verwalten" : "Manage gallery images"}
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> {de ? "Neues Bild" : "New Image"}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg">
                    {isNew ? (de ? "Neues Bild" : "New Image") : (de ? "Bild bearbeiten" : "Edit Image")}
                  </h2>
                  <button onClick={() => { setEditImage(null); setIsNew(false); }}>
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-sm font-body font-medium mb-2">{de ? "Bild" : "Image"}</label>
                  <div className="flex items-start gap-4">
                    {previewUrl ? (
                      <img src={previewUrl} alt="" className="w-40 h-28 object-cover rounded-lg border border-border" />
                    ) : (
                      <div className="w-40 h-28 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                        <ImageIcon size={32} className="text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        <Upload size={16} />
                        {uploading ? (de ? "Hochladen..." : "Uploading...") : (de ? "Bild hochladen" : "Upload Image")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-body font-medium mb-1">{de ? "Titel (DE)" : "Title (DE)"}</label>
                    <input
                      value={form.title_de}
                      onChange={(e) => setForm({ ...form, title_de: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-body"
                      placeholder={de ? "z.B. Moderne Gewächshausanlage" : "e.g. Modern Greenhouse Facility"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium mb-1">{de ? "Kategorie" : "Category"}</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-body"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium mb-1">{de ? "Reihenfolge" : "Sort Order"}</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-body"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="rounded"
                      />
                      {de ? "Aktiv (sichtbar auf der Webseite)" : "Active (visible on website)"}
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? (de ? "Speichern..." : "Saving...") : (de ? "Speichern" : "Save")}
                  </button>
                  <button
                    onClick={() => { setEditImage(null); setIsNew(false); }}
                    className="px-6 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                  >
                    {de ? "Abbrechen" : "Cancel"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground font-body">{de ? "Laden..." : "Loading..."}</div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-body">
            {de ? "Noch keine Galeriebilder vorhanden." : "No gallery images yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className={`bg-card border border-border rounded-xl overflow-hidden group ${!img.is_active ? "opacity-60" : ""}`}
              >
                {img.image_url ? (
                  <img src={img.image_url} alt={img.title_de} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-muted/30 flex items-center justify-center">
                    <ImageIcon size={40} className="text-muted-foreground" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display font-bold text-sm truncate">{img.title_de}</h3>
                  <p className="text-xs text-muted-foreground font-body mt-1 capitalize">
                    {(de ? categoriesDE : categoriesEN).find((c) => c.value === img.category)?.label || img.category}
                    {" · "}Pos. {img.sort_order}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => toggleActive(img)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      title={img.is_active ? (de ? "Deaktivieren" : "Deactivate") : (de ? "Aktivieren" : "Activate")}
                    >
                      {img.is_active ? <Eye size={16} className="text-primary" /> : <EyeOff size={16} className="text-muted-foreground" />}
                    </button>
                    <button
                      onClick={() => openEdit(img)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Pencil size={16} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGallery;
