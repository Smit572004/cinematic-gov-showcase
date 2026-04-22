import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, FileText, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

type ContentItem = {
  id: string;
  content_key: string;
  value_en: string;
  value_de: string;
};

const contentLabelsDE: Record<string, string> = {
  hero_title1: "Hero Titel (Zeile 1)",
  hero_title2: "Hero Titel (Zeile 2)",
  hero_desc: "Hero Beschreibung",
  about_title: "Über uns Titel",
  about_desc: "Über uns Beschreibung",
  contact_phone: "Telefonnummer",
  contact_email: "E-Mail-Adresse",
  contact_address: "Firmenadresse",
  contact_fax: "Faxnummer",
  contact_whatsapp: "WhatsApp-Nummer",
};

const contentLabelsEN: Record<string, string> = {
  hero_title1: "Hero Title (Line 1)",
  hero_title2: "Hero Title (Line 2)",
  hero_desc: "Hero Description",
  about_title: "About Us Title",
  about_desc: "About Us Description",
  contact_phone: "Phone Number",
  contact_email: "Email Address",
  contact_address: "Company Address",
  contact_fax: "Fax Number",
  contact_whatsapp: "WhatsApp Number",
};

const noTranslateKeys = ["contact_phone", "contact_email", "contact_address", "contact_fax", "contact_whatsapp"];

const translateTexts = async (texts: string[]): Promise<string[]> => {
  const { data, error } = await supabase.functions.invoke("translate", {
    body: { texts },
  });
  if (error) throw error;
  return data.translations;
};

const AdminContent = () => {
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const de = lang === "de";
  const contentLabels = de ? contentLabelsDE : contentLabelsEN;
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*").order("content_key");
      if (error) throw error;
      return data as ContentItem[];
    },
  });

  useEffect(() => {
    const map: Record<string, string> = {};
    items.forEach((item) => {
      map[item.id] = item.value_de;
    });
    setEdits(map);
  }, [items]);

  const handleSave = async (item: ContentItem) => {
    const value_de = edits[item.id];
    if (value_de === undefined) return;
    setSaving(item.id);

    try {
      let value_en: string;
      if (noTranslateKeys.includes(item.content_key)) {
        value_en = value_de;
      } else {
        const translations = await translateTexts([value_de]);
        value_en = translations[0] || value_de;
      }

      const { error } = await supabase.from("site_content").update({ value_de, value_en }).eq("id", item.id);
      setSaving(null);
      if (error) { toast.error(error.message); return; }
      toast.success((de ? "Aktualisiert: " : "Updated: ") + (contentLabels[item.content_key] || item.content_key));
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    } catch (err: any) {
      setSaving(null);
      toast.error((de ? "Übersetzung fehlgeschlagen: " : "Translation failed: ") + (err.message || (de ? "Unbekannter Fehler" : "Unknown error")));
    }
  };

  const isChanged = (item: ContentItem) => {
    const edit = edits[item.id];
    return edit !== undefined && edit !== item.value_de;
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="text-primary" size={24} />
        <div>
          <h1 className="font-display text-2xl font-bold">{de ? "Website-Inhalte" : "Website Content"}</h1>
          <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-1">
            <Languages size={12} /> {de ? "Eingabe auf Deutsch — Englisch wird automatisch übersetzt" : "Enter in German — English is auto-translated"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground font-body">{de ? "Laden..." : "Loading..."}</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const editValue = edits[item.id];
            if (editValue === undefined) return null;
            const isLong = editValue.length > 80;
            return (
              <div key={item.id} className="glass rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm">{contentLabels[item.content_key] || item.content_key}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">{item.content_key}</p>
                  </div>
                  <button
                    onClick={() => handleSave(item)}
                    disabled={!isChanged(item) || saving === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 hover:shadow-[var(--glow-green)] transition-all"
                  >
                    <Save size={12} />
                    {saving === item.id ? (de ? "Wird gespeichert..." : "Saving...") : (de ? "Speichern" : "Save")}
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block font-body">{de ? "Deutsch" : "German"}</label>
                  {isLong ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body text-foreground focus:border-primary focus:outline-none resize-none"
                    />
                  ) : (
                    <input
                      value={editValue}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body text-foreground focus:border-primary focus:outline-none"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminContent;
