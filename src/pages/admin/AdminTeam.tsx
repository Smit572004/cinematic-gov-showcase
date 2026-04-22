import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

type TeamMember = {
  id: string;
  name: string;
  role_en: string;
  role_de: string;
  phone: string | null;
  email: string | null;
  sort_order: number;
};

const emptyMember = { name: "", role_de: "", phone: "", email: "", sort_order: 0 };

const translateTexts = async (texts: string[]): Promise<string[]> => {
  const { data, error } = await supabase.functions.invoke("translate", {
    body: { texts },
  });
  if (error) throw error;
  return data.translations;
};

const AdminTeam = () => {
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const de = lang === "de";
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(emptyMember);
  const [saving, setSaving] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-team"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").order("sort_order");
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const openNew = () => { setForm({ ...emptyMember, sort_order: members.length + 1 }); setEditMember(null); setIsNew(true); };
  const openEdit = (m: TeamMember) => { setForm({ name: m.name, role_de: m.role_de, phone: m.phone || "", email: m.email || "", sort_order: m.sort_order }); setEditMember(m); setIsNew(false); };
  const closeModal = () => { setEditMember(null); setIsNew(false); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.role_de.trim()) { toast.error(de ? "Name und Rolle sind erforderlich" : "Name and role are required"); return; }
    setSaving(true);

    try {
      const translations = await translateTexts([form.role_de]);
      const role_en = translations[0] || form.role_de;

      const payload = { name: form.name, role_de: form.role_de, role_en, phone: form.phone || null, email: form.email || null, sort_order: form.sort_order };

      if (isNew) {
        const { error } = await supabase.from("team_members").insert(payload);
        if (error) { toast.error(error.message); setSaving(false); return; }
        toast.success(de ? "Teammitglied hinzugefügt" : "Team member added");
      } else if (editMember) {
        const { error } = await supabase.from("team_members").update(payload).eq("id", editMember.id);
        if (error) { toast.error(error.message); setSaving(false); return; }
        toast.success(de ? "Teammitglied aktualisiert" : "Team member updated");
      }
    } catch (err: any) {
      toast.error((de ? "Übersetzung fehlgeschlagen: " : "Translation failed: ") + (err.message || (de ? "Unbekannter Fehler" : "Unknown error")));
      setSaving(false);
      return;
    }

    setSaving(false);
    closeModal();
    queryClient.invalidateQueries({ queryKey: ["admin-team"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(de ? "Dieses Teammitglied löschen?" : "Delete this team member?")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(de ? "Teammitglied gelöscht" : "Team member deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-team"] });
  };

  const showModal = isNew || editMember;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{de ? "Teammitglieder" : "Team Members"}</h1>
          <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-1">
            <Languages size={12} /> {de ? "Eingabe auf Deutsch — Englisch wird automatisch übersetzt" : "Enter in German — English is auto-translated"}
          </p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:shadow-[var(--glow-green)] transition-all">
          <Plus size={16} /> {de ? "Mitglied hinzufügen" : "Add Member"}
        </button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground font-body">{de ? "Laden..." : "Loading..."}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div key={m.id} className="glass rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold">{m.name}</h3>
                  <p className="text-xs text-muted-foreground font-body">{m.role_de}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                </div>
              </div>
              {m.phone && <p className="text-sm font-body text-muted-foreground">{m.phone}</p>}
              {m.email && <p className="text-sm font-body text-muted-foreground">{m.email}</p>}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={(e) => e.stopPropagation()} className="glass rounded-2xl p-6 w-full max-w-md space-y-4 border border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">{isNew ? (de ? "Neues Mitglied" : "New Member") : (de ? "Mitglied bearbeiten" : "Edit Member")}</h2>
                <button onClick={closeModal} className="p-1.5 rounded-md hover:bg-muted"><X size={18} /></button>
              </div>
              <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                <Languages size={12} /> {de ? "Englische Übersetzung wird automatisch erstellt" : "English translation is created automatically"}
              </p>
              <InputField label={de ? "Vollständiger Name" : "Full Name"} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <InputField label={de ? "Rolle (Deutsch)" : "Role (German)"} value={form.role_de} onChange={(v) => setForm({ ...form, role_de: v })} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label={de ? "Telefon" : "Phone"} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <InputField label={de ? "E-Mail" : "Email"} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              </div>
              <InputField label={de ? "Sortierreihenfolge" : "Sort Order"} value={String(form.sort_order)} type="number" onChange={(v) => setForm({ ...form, sort_order: parseInt(v) || 0 })} />
              <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:shadow-[var(--glow-green)] transition-all disabled:opacity-70">
                {saving
                  ? (de ? "Wird gespeichert & übersetzt..." : "Saving & translating...")
                  : isNew
                    ? (de ? "Mitglied hinzufügen" : "Add Member")
                    : (de ? "Mitglied aktualisieren" : "Update Member")}
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

export default AdminTeam;
