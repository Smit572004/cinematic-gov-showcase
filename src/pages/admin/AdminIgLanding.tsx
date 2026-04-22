import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Instagram,
  Save,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Languages,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  IG_CONTENT_KEYS,
  IgContentKey,
  IgContentMap,
  IgGalleryItem,
  IgOffer,
} from "@/hooks/useIgContent";

/* ─────────────────────────── Helpers ─────────────────────────── */

const translateTexts = async (texts: string[]): Promise<string[]> => {
  const { data, error } = await supabase.functions.invoke("translate", {
    body: { texts },
  });
  if (error) throw error;
  return data.translations as string[];
};

// keys that should NOT be translated (urls, phone numbers, emails, hours, identical labels)
const noTranslateKeys: Set<string> = new Set([
  "ig_hero_image_url",
  "ig_contact_phone",
  "ig_contact_phone_tel",
  "ig_contact_whatsapp",
  "ig_contact_email",
  "ig_map_query",
  "ig_address_street",
  "ig_address_city",
  "ig_hours_mon",
  "ig_hours_tue",
  "ig_hours_wed",
  "ig_hours_thu",
  "ig_hours_fri",
  "ig_hours_sat",
  "ig_hours_sun",
  "ig_qa_whatsapp",
  "ig_map_apple",
  "ig_footer_copyright",
]);

/* ─────────────────── Field metadata for hero/location ─────────────────── */

type FieldMeta = {
  key: IgContentKey;
  labelDe: string;
  labelEn: string;
  multiline?: boolean;
  placeholder?: string;
};

const HERO_FIELDS: FieldMeta[] = [
  { key: "ig_hero_eyebrow", labelDe: "Eyebrow (kleiner Tag)", labelEn: "Eyebrow (small tag)" },
  { key: "ig_hero_title_a", labelDe: "Titel (Zeile 1)", labelEn: "Title (line 1)" },
  { key: "ig_hero_title_b", labelDe: "Titel (Zeile 2, kursiv)", labelEn: "Title (line 2, italic)" },
  { key: "ig_hero_lead", labelDe: "Beschreibung", labelEn: "Description", multiline: true },
  { key: "ig_hero_cta_primary", labelDe: "Hauptbutton-Text", labelEn: "Primary button label" },
  { key: "ig_hero_cta_ghost", labelDe: "Sekundärbutton-Text", labelEn: "Secondary button label" },
];

const SECTION_HEAD_FIELDS: FieldMeta[] = [
  { key: "ig_offers_eyebrow", labelDe: "Angebote – Eyebrow", labelEn: "Offers – Eyebrow" },
  { key: "ig_offers_title", labelDe: "Angebote – Titel", labelEn: "Offers – Title" },
  { key: "ig_offers_subtitle", labelDe: "Angebote – Untertitel", labelEn: "Offers – Subtitle", multiline: true },
  { key: "ig_offers_banner", labelDe: "Angebote – Banner unten", labelEn: "Offers – Bottom banner" },
  { key: "ig_gallery_eyebrow", labelDe: "Galerie – Eyebrow", labelEn: "Gallery – Eyebrow" },
  { key: "ig_gallery_title", labelDe: "Galerie – Titel", labelEn: "Gallery – Title" },
  { key: "ig_gallery_subtitle", labelDe: "Galerie – Untertitel", labelEn: "Gallery – Subtitle", multiline: true },
  { key: "ig_location_eyebrow", labelDe: "Standort – Eyebrow", labelEn: "Location – Eyebrow" },
  { key: "ig_location_title", labelDe: "Standort – Titel", labelEn: "Location – Title" },
  { key: "ig_location_subtitle", labelDe: "Standort – Untertitel", labelEn: "Location – Subtitle", multiline: true },
];

const LOCATION_FIELDS: FieldMeta[] = [
  { key: "ig_address_name", labelDe: "Standortname", labelEn: "Location name" },
  { key: "ig_address_street", labelDe: "Straße + Nr.", labelEn: "Street + No." },
  { key: "ig_address_city", labelDe: "PLZ + Ort", labelEn: "ZIP + City" },
  { key: "ig_contact_phone", labelDe: "Telefon (Anzeige)", labelEn: "Phone (display)", placeholder: "+49 39209 69 69 0" },
  { key: "ig_contact_phone_tel", labelDe: "Telefon (tel:-Link, ohne Leerzeichen)", labelEn: "Phone (tel: link, no spaces)", placeholder: "+493920969690" },
  { key: "ig_contact_whatsapp", labelDe: "WhatsApp-Nummer (international, mit +)", labelEn: "WhatsApp number (international, with +)", placeholder: "+493920969690" },
  { key: "ig_contact_email", labelDe: "E-Mail", labelEn: "Email", placeholder: "info@tinplant-gmbh.de" },
  { key: "ig_map_query", labelDe: "Adresse für Karten-Suche", labelEn: "Address for map search", multiline: true },
  { key: "ig_footer_tagline", labelDe: "Footer-Tagline", labelEn: "Footer tagline" },
];

const HOURS_FIELDS: { key: IgContentKey; labelDe: string; labelEn: string }[] = [
  { key: "ig_hours_mon", labelDe: "Montag", labelEn: "Monday" },
  { key: "ig_hours_tue", labelDe: "Dienstag", labelEn: "Tuesday" },
  { key: "ig_hours_wed", labelDe: "Mittwoch", labelEn: "Wednesday" },
  { key: "ig_hours_thu", labelDe: "Donnerstag", labelEn: "Thursday" },
  { key: "ig_hours_fri", labelDe: "Freitag", labelEn: "Friday" },
  { key: "ig_hours_sat", labelDe: "Samstag", labelEn: "Saturday" },
  { key: "ig_hours_sun", labelDe: "Sonntag", labelEn: "Sunday" },
];

const LABEL_FIELDS: FieldMeta[] = [
  { key: "ig_nav_home", labelDe: "Nav · Start", labelEn: "Nav · Home" },
  { key: "ig_nav_offers", labelDe: "Nav · Angebote", labelEn: "Nav · Offers" },
  { key: "ig_nav_location", labelDe: "Nav · Standort", labelEn: "Nav · Location" },
  { key: "ig_nav_contact", labelDe: "Nav · Kontakt", labelEn: "Nav · Contact" },
  { key: "ig_hero_scroll_hint", labelDe: "Hero · Scroll-Hinweis", labelEn: "Hero · Scroll hint" },
  { key: "ig_hours_heading", labelDe: "Öffnungszeiten – Überschrift", labelEn: "Hours – Heading" },
  { key: "ig_hours_closed", labelDe: "Status · Geschlossen", labelEn: "Status · Closed" },
  { key: "ig_status_open_until", labelDe: "Status · Geöffnet bis (nutze {time})", labelEn: "Status · Open until (use {time})" },
  { key: "ig_status_closes_in", labelDe: "Status · Schließt in (nutze {minutes})", labelEn: "Status · Closes in (use {minutes})" },
  { key: "ig_status_opens_today", labelDe: "Status · Öffnet heute (nutze {time})", labelEn: "Status · Opens today (use {time})" },
  { key: "ig_status_opens_tomorrow", labelDe: "Status · Öffnet morgen (nutze {time})", labelEn: "Status · Opens tomorrow (use {time})" },
  { key: "ig_status_opens_on", labelDe: "Status · Öffnet an Tag (nutze {day} und {time})", labelEn: "Status · Opens on day (use {day} and {time})" },
  { key: "ig_address_heading", labelDe: "Adresse – Überschrift", labelEn: "Address – Heading" },
  { key: "ig_map_open", labelDe: "Karte · In Google Maps öffnen", labelEn: "Map · Open in Google Maps" },
  { key: "ig_map_route", labelDe: "Karte · Route", labelEn: "Map · Route" },
  { key: "ig_map_apple", labelDe: "Karte · Apple Maps", labelEn: "Map · Apple Maps" },
  { key: "ig_map_share", labelDe: "Karte · Teilen", labelEn: "Map · Share" },
  { key: "ig_qa_call", labelDe: "Aktion · Anrufen", labelEn: "Action · Call" },
  { key: "ig_qa_whatsapp", labelDe: "Aktion · WhatsApp", labelEn: "Action · WhatsApp" },
  { key: "ig_qa_email", labelDe: "Aktion · E-Mail", labelEn: "Action · Email" },
  { key: "ig_whatsapp_message", labelDe: "WhatsApp – Vorausgefüllte Nachricht", labelEn: "WhatsApp – Prefilled message", multiline: true },
  { key: "ig_email_subject", labelDe: "E-Mail – Betreff", labelEn: "Email – Subject" },
  { key: "ig_footer_copyright", labelDe: "Footer – Copyright (nutze {year})", labelEn: "Footer – Copyright (use {year})" },
  { key: "ig_day_short_mon", labelDe: "Wochentag kurz · Mo", labelEn: "Day short · Mon" },
  { key: "ig_day_short_tue", labelDe: "Wochentag kurz · Di", labelEn: "Day short · Tue" },
  { key: "ig_day_short_wed", labelDe: "Wochentag kurz · Mi", labelEn: "Day short · Wed" },
  { key: "ig_day_short_thu", labelDe: "Wochentag kurz · Do", labelEn: "Day short · Thu" },
  { key: "ig_day_short_fri", labelDe: "Wochentag kurz · Fr", labelEn: "Day short · Fri" },
  { key: "ig_day_short_sat", labelDe: "Wochentag kurz · Sa", labelEn: "Day short · Sat" },
  { key: "ig_day_short_sun", labelDe: "Wochentag kurz · So", labelEn: "Day short · Sun" },
  { key: "ig_day_long_mon", labelDe: "Wochentag lang · Montag", labelEn: "Day long · Monday" },
  { key: "ig_day_long_tue", labelDe: "Wochentag lang · Dienstag", labelEn: "Day long · Tuesday" },
  { key: "ig_day_long_wed", labelDe: "Wochentag lang · Mittwoch", labelEn: "Day long · Wednesday" },
  { key: "ig_day_long_thu", labelDe: "Wochentag lang · Donnerstag", labelEn: "Day long · Thursday" },
  { key: "ig_day_long_fri", labelDe: "Wochentag lang · Freitag", labelEn: "Day long · Friday" },
  { key: "ig_day_long_sat", labelDe: "Wochentag lang · Samstag", labelEn: "Day long · Saturday" },
  { key: "ig_day_long_sun", labelDe: "Wochentag lang · Sonntag", labelEn: "Day long · Sunday" },
];

/* ─────────────────────────── Tabs ─────────────────────────── */

type TabId = "hero" | "offers" | "gallery" | "hours" | "location" | "labels";

const AdminIgLanding = () => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const [tab, setTab] = useState<TabId>("hero");

  const tabs: { id: TabId; labelDe: string; labelEn: string }[] = [
    { id: "hero", labelDe: "Hero", labelEn: "Hero" },
    { id: "offers", labelDe: "Angebote", labelEn: "Offers" },
    { id: "gallery", labelDe: "Galerie", labelEn: "Gallery" },
    { id: "hours", labelDe: "Öffnungszeiten", labelEn: "Hours" },
    { id: "location", labelDe: "Standort & Kontakt", labelEn: "Location & Contact" },
    { id: "labels", labelDe: "UI-Texte", labelEn: "UI Labels" },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Instagram className="text-pink-500" size={20} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {de ? "Instagram Landingpage" : "Instagram Landing Page"}
              </h1>
              <p className="text-xs text-muted-foreground font-body mt-0.5 flex items-center gap-1.5">
                <Languages size={12} /> {de ? "Deutsch wird live gespeichert · Englisch automatisch übersetzt." : "German is saved live · English auto-translated."}
              </p>
            </div>
          </div>
          <a
            href="/ig"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold hover:bg-muted/70 transition-colors"
          >
            <ExternalLink size={13} /> {de ? "Seite ansehen" : "View page"}
          </a>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-muted/40 rounded-xl mb-6 border border-border/60">
          {tabs.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold font-body transition-all ${
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {de ? t.labelDe : t.labelEn}
              </button>
            );
          })}
        </div>

        {tab === "hero" && <HeroTab />}
        {tab === "offers" && <OffersTab />}
        {tab === "gallery" && <GalleryTab />}
        {tab === "hours" && <HoursTab />}
        {tab === "location" && <LocationTab />}
      </div>
    </AdminLayout>
  );
};

export default AdminIgLanding;

/* ─────────────────── Shared content fetching ─────────────────── */

const useAdminIgContent = () =>
  useQuery({
    queryKey: ["admin-ig-content"],
    queryFn: async (): Promise<IgContentMap> => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content_key,value_de,value_en")
        .in("content_key", IG_CONTENT_KEYS as unknown as string[]);
      if (error) throw error;
      const map: IgContentMap = {};
      (data ?? []).forEach((row) => {
        map[row.content_key] = { value_de: row.value_de, value_en: row.value_en };
      });
      return map;
    },
  });

async function saveContentRow(content_key: string, value_de: string) {
  let value_en = value_de;
  if (!noTranslateKeys.has(content_key) && value_de.trim()) {
    try {
      const [t] = await translateTexts([value_de]);
      if (t) value_en = t;
    } catch {
      // fall back to value_de if translate fails
    }
  }
  // Try update first, insert if missing
  const { data: existing } = await supabase
    .from("site_content")
    .select("id")
    .eq("content_key", content_key)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await supabase
      .from("site_content")
      .update({ value_de, value_en })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("site_content")
      .insert({ content_key, value_de, value_en });
    if (error) throw error;
  }
}

/* ─────────────────────────── HERO TAB ─────────────────────────── */

const HeroTab = () => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const queryClient = useQueryClient();
  const { data: content, isLoading } = useAdminIgContent();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const heroImageUrl = content?.["ig_hero_image_url"]?.value_de || "";

  const uploadHero = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const { error } = await supabase.storage.from("ig-assets").upload(fileName, file);
    if (error) {
      toast.error((de ? "Upload fehlgeschlagen: " : "Upload failed: ") + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("ig-assets").getPublicUrl(fileName);
    try {
      await saveContentRow("ig_hero_image_url", urlData.publicUrl);
      toast.success(de ? "Hero-Foto aktualisiert" : "Hero photo updated");
      queryClient.invalidateQueries({ queryKey: ["admin-ig-content"] });
      queryClient.invalidateQueries({ queryKey: ["ig-content"] });
    } catch (e: any) {
      toast.error(e.message);
    }
    setUploading(false);
  };

  if (isLoading) return <LoadingPanel />;

  return (
    <div className="space-y-6">
      {/* Hero photo */}
      <div className="bg-card border border-border/60 rounded-xl p-5">
        <h2 className="font-display font-bold text-sm mb-3">
          {de ? "Hero-Hintergrundfoto" : "Hero background photo"}
        </h2>
        <div className="flex items-start gap-4 flex-wrap">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt="Hero"
              className="w-56 h-32 object-cover rounded-lg border border-border"
            />
          ) : (
            <div className="w-56 h-32 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
              <ImageIcon size={32} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-[200px] space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadHero(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm font-semibold hover:bg-muted/70 transition-colors disabled:opacity-50"
            >
              <Upload size={14} />
              {uploading ? (de ? "Hochladen..." : "Uploading...") : (de ? "Neues Foto hochladen" : "Upload new photo")}
            </button>
            <p className="text-xs text-muted-foreground font-body">
              {de
                ? "Empfohlen: 1920×1080, JPG/WebP. Wird mit dunklem Overlay angezeigt."
                : "Recommended: 1920×1080, JPG/WebP. Displayed with a dark overlay."}
            </p>
          </div>
        </div>
      </div>

      {/* Hero text fields */}
      <FieldList fields={HERO_FIELDS} content={content} />
    </div>
  );
};

/* ─────────────────────────── HOURS TAB ─────────────────────────── */

const HoursTab = () => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const queryClient = useQueryClient();
  const { data: content, isLoading } = useAdminIgContent();
  const [edits, setEdits] = useState<Record<string, { open: string; close: string; closed: boolean }>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!content) return;
    const next: Record<string, { open: string; close: string; closed: boolean }> = {};
    HOURS_FIELDS.forEach((f) => {
      const raw = content[f.key]?.value_de ?? "closed";
      if (raw.toLowerCase() === "closed") {
        next[f.key] = { open: "09:00", close: "18:00", closed: true };
      } else {
        const [open, close] = raw.split("|");
        next[f.key] = { open: open || "09:00", close: close || "18:00", closed: false };
      }
    });
    setEdits(next);
  }, [content]);

  const save = async (key: string) => {
    const e = edits[key];
    if (!e) return;
    const value = e.closed ? "closed" : `${e.open}|${e.close}`;
    setSavingKey(key);
    try {
      await saveContentRow(key, value);
      toast.success(de ? "Gespeichert" : "Saved");
      queryClient.invalidateQueries({ queryKey: ["admin-ig-content"] });
      queryClient.invalidateQueries({ queryKey: ["ig-content"] });
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingKey(null);
  };

  if (isLoading) return <LoadingPanel />;

  return (
    <div className="space-y-3">
      {HOURS_FIELDS.map((f) => {
        const e = edits[f.key];
        if (!e) return null;
        return (
          <div
            key={f.key}
            className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3 flex-wrap"
          >
            <div className="w-28">
              <p className="font-display font-bold text-sm">{de ? f.labelDe : f.labelEn}</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-body cursor-pointer select-none">
              <input
                type="checkbox"
                checked={e.closed}
                onChange={(ev) =>
                  setEdits((prev) => ({ ...prev, [f.key]: { ...e, closed: ev.target.checked } }))
                }
                className="rounded"
              />
              {de ? "Geschlossen" : "Closed"}
            </label>
            {!e.closed && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={e.open}
                  onChange={(ev) =>
                    setEdits((prev) => ({ ...prev, [f.key]: { ...e, open: ev.target.value } }))
                  }
                  className="px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm font-body"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="time"
                  value={e.close}
                  onChange={(ev) =>
                    setEdits((prev) => ({ ...prev, [f.key]: { ...e, close: ev.target.value } }))
                  }
                  className="px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-sm font-body"
                />
              </div>
            )}
            <button
              onClick={() => save(f.key)}
              disabled={savingKey === f.key}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save size={12} />
              {savingKey === f.key ? (de ? "..." : "...") : de ? "Speichern" : "Save"}
            </button>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────── LOCATION TAB ─────────────────────────── */

const LocationTab = () => {
  const { data: content, isLoading } = useAdminIgContent();
  if (isLoading) return <LoadingPanel />;
  return (
    <div className="space-y-6">
      <FieldList fields={LOCATION_FIELDS} content={content} />
      <div className="bg-card border border-border/60 rounded-xl p-5">
        <h2 className="font-display font-bold text-sm mb-3">Section Headlines</h2>
        <FieldList fields={SECTION_HEAD_FIELDS} content={content} compact />
      </div>
    </div>
  );
};

/* ─────────────────────────── Reusable field list ─────────────────────────── */

const FieldList = ({
  fields,
  content,
  compact = false,
}: {
  fields: FieldMeta[];
  content: IgContentMap | undefined;
  compact?: boolean;
}) => {
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const de = lang === "de";
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!content) return;
    const map: Record<string, string> = {};
    fields.forEach((f) => {
      map[f.key] = content[f.key]?.value_de ?? "";
    });
    setEdits(map);
  }, [content, fields]);

  const save = async (key: string) => {
    setSavingKey(key);
    try {
      await saveContentRow(key, edits[key] ?? "");
      toast.success(de ? "Gespeichert" : "Saved");
      queryClient.invalidateQueries({ queryKey: ["admin-ig-content"] });
      queryClient.invalidateQueries({ queryKey: ["ig-content"] });
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingKey(null);
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {fields.map((f) => {
        const original = content?.[f.key]?.value_de ?? "";
        const value = edits[f.key] ?? "";
        const changed = value !== original;
        return (
          <div
            key={f.key}
            className={`bg-card border border-border/60 rounded-xl ${compact ? "p-3" : "p-4"}`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-display font-bold">
                {de ? f.labelDe : f.labelEn}
              </label>
              <button
                onClick={() => save(f.key)}
                disabled={!changed || savingKey === f.key}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Save size={11} />
                {savingKey === f.key ? "..." : de ? "Speichern" : "Save"}
              </button>
            </div>
            {f.multiline ? (
              <textarea
                value={value}
                rows={2}
                placeholder={f.placeholder}
                onChange={(e) => setEdits((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none resize-none"
              />
            ) : (
              <input
                value={value}
                placeholder={f.placeholder}
                onChange={(e) => setEdits((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-body focus:border-primary focus:outline-none"
              />
            )}
            <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">{f.key}</p>
          </div>
        );
      })}
    </div>
  );
};

const LoadingPanel = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-card border border-border/60 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-muted/50 rounded w-1/3 mb-2" />
        <div className="h-9 bg-muted/40 rounded w-full" />
      </div>
    ))}
  </div>
);

/* ─────────────────────────── OFFERS TAB ─────────────────────────── */

const emptyOffer: Omit<IgOffer, "id"> = {
  title_de: "",
  title_en: "",
  description_de: "",
  description_en: "",
  badge_de: "",
  badge_en: "",
  price_text: "",
  unit_text: "/ Stück",
  emoji: "🌱",
  color_tag: "tomato",
  sort_order: 0,
  is_active: true,
};

const OFFER_COLORS = [
  { value: "tomato", label: "Rot (Tomate)" },
  { value: "pepper", label: "Orange (Paprika)" },
  { value: "zucchini", label: "Grün (Zucchini)" },
];

const OffersTab = () => {
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const de = lang === "de";
  const [editing, setEditing] = useState<(Omit<IgOffer, "id"> & { id?: string }) | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["admin-ig-offers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ig_offers").select("*").order("sort_order");
      if (error) throw error;
      return data as IgOffer[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (offer: Omit<IgOffer, "id"> & { id?: string }) => {
      // Auto-translate text fields
      const toTranslate = [offer.title_de, offer.description_de, offer.badge_de].filter((s) => s.trim());
      let translated: string[] = [];
      if (toTranslate.length) {
        try {
          translated = await translateTexts(toTranslate);
        } catch {
          translated = [];
        }
      }
      let i = 0;
      const title_en = offer.title_de.trim() ? translated[i++] || offer.title_de : "";
      const description_en = offer.description_de.trim() ? translated[i++] || offer.description_de : "";
      const badge_en = offer.badge_de.trim() ? translated[i++] || offer.badge_de : "";

      const payload = {
        title_de: offer.title_de,
        title_en,
        description_de: offer.description_de,
        description_en,
        badge_de: offer.badge_de,
        badge_en,
        price_text: offer.price_text,
        unit_text: offer.unit_text,
        emoji: offer.emoji,
        color_tag: offer.color_tag,
        sort_order: offer.sort_order,
        is_active: offer.is_active,
      };

      if (offer.id) {
        const { error } = await supabase.from("ig_offers").update(payload).eq("id", offer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ig_offers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ig-offers"] });
      queryClient.invalidateQueries({ queryKey: ["ig-offers-public"] });
      setEditing(null);
      setIsNew(false);
      toast.success(de ? "Angebot gespeichert" : "Offer saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ig_offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ig-offers"] });
      queryClient.invalidateQueries({ queryKey: ["ig-offers-public"] });
      toast.success(de ? "Gelöscht" : "Deleted");
    },
  });

  const toggleActive = async (offer: IgOffer) => {
    const { error } = await supabase
      .from("ig_offers")
      .update({ is_active: !offer.is_active })
      .eq("id", offer.id);
    if (error) toast.error(error.message);
    else {
      queryClient.invalidateQueries({ queryKey: ["admin-ig-offers"] });
      queryClient.invalidateQueries({ queryKey: ["ig-offers-public"] });
    }
  };

  const handleNew = () => {
    setEditing({ ...emptyOffer, sort_order: offers.length });
    setIsNew(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground font-body">
          {de
            ? "Die Karten im Saisonangebote-Bereich auf /ig."
            : "The cards in the Seasonal offers section on /ig."}
        </p>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> {de ? "Neues Angebot" : "New offer"}
        </button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-display font-bold text-sm">
            {isNew ? (de ? "Neues Angebot" : "New offer") : de ? "Angebot bearbeiten" : "Edit offer"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={de ? "Titel (DE) *" : "Title (DE) *"}>
              <input
                value={editing.title_de}
                onChange={(e) => setEditing({ ...editing, title_de: e.target.value })}
                className="ig-admin-input"
                placeholder="Tomatenpflanzen"
              />
            </Field>
            <Field label={de ? "Badge (DE)" : "Badge (DE)"}>
              <input
                value={editing.badge_de}
                onChange={(e) => setEditing({ ...editing, badge_de: e.target.value })}
                className="ig-admin-input"
                placeholder="Tomaten"
              />
            </Field>
          </div>
          <Field label={de ? "Beschreibung (DE) *" : "Description (DE) *"}>
            <textarea
              value={editing.description_de}
              rows={2}
              onChange={(e) => setEditing({ ...editing, description_de: e.target.value })}
              className="ig-admin-input resize-none"
            />
          </Field>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label={de ? "Preis-Text" : "Price text"}>
              <input
                value={editing.price_text}
                onChange={(e) => setEditing({ ...editing, price_text: e.target.value })}
                className="ig-admin-input"
                placeholder="ab €0,88"
              />
            </Field>
            <Field label={de ? "Einheit" : "Unit"}>
              <input
                value={editing.unit_text}
                onChange={(e) => setEditing({ ...editing, unit_text: e.target.value })}
                className="ig-admin-input"
                placeholder="/ Stück"
              />
            </Field>
            <Field label="Emoji">
              <input
                value={editing.emoji}
                onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                className="ig-admin-input text-center text-lg"
                maxLength={4}
              />
            </Field>
            <Field label={de ? "Farbe" : "Color"}>
              <select
                value={editing.color_tag}
                onChange={(e) => setEditing({ ...editing, color_tag: e.target.value })}
                className="ig-admin-input"
              >
                {OFFER_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={de ? "Reihenfolge" : "Sort order"}>
              <input
                type="number"
                value={editing.sort_order}
                onChange={(e) =>
                  setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })
                }
                className="ig-admin-input"
              />
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 text-sm font-body mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="rounded"
                />
                {de ? "Aktiv (sichtbar)" : "Active (visible)"}
              </label>
            </Field>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => editing && saveMutation.mutate(editing)}
              disabled={saveMutation.isPending || !editing.title_de.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save size={14} />
              {saveMutation.isPending ? (de ? "Speichern..." : "Saving...") : de ? "Speichern" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setIsNew(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm font-body hover:bg-muted transition-colors"
            >
              <X size={14} /> {de ? "Abbrechen" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <LoadingPanel />
      ) : offers.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body text-center py-8">
          {de ? "Noch keine Angebote." : "No offers yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-card border rounded-xl p-4 flex items-center gap-3 ${
                offer.is_active ? "border-border/60" : "border-border opacity-60"
              }`}
            >
              <span className="text-3xl flex-shrink-0">{offer.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm truncate">
                  {offer.title_de}{" "}
                  <span className="text-xs font-body font-normal text-muted-foreground">
                    · {offer.price_text} {offer.unit_text}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground font-body line-clamp-1">
                  {offer.description_de}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(offer)} className="p-2 rounded-lg hover:bg-muted">
                  {offer.is_active ? (
                    <Eye size={15} className="text-primary" />
                  ) : (
                    <EyeOff size={15} className="text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(offer);
                    setIsNew(false);
                  }}
                  className="p-2 rounded-lg hover:bg-muted"
                >
                  <Pencil size={14} className="text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(de ? "Wirklich löschen?" : "Really delete?"))
                      deleteMutation.mutate(offer.id);
                  }}
                  className="p-2 rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 size={14} className="text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`.ig-admin-input{width:100%;padding:.5rem .75rem;background:hsl(var(--muted)/.5);border:1px solid hsl(var(--border));border-radius:.5rem;font-size:.875rem;font-family:inherit;}.ig-admin-input:focus{outline:none;border-color:hsl(var(--primary));}`}</style>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    {label && (
      <label className="block text-[11px] font-body font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
        {label}
      </label>
    )}
    {children}
  </div>
);

/* ─────────────────────────── GALLERY TAB ─────────────────────────── */

const GalleryTab = () => {
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const de = lang === "de";
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Partial<IgGalleryItem> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-ig-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ig_gallery").select("*").order("sort_order");
      if (error) throw error;
      return data as IgGalleryItem[];
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `gal-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const { error } = await supabase.storage.from("ig-assets").upload(fileName, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("ig-assets").getPublicUrl(fileName);
    setEditing((p) => ({ ...(p || {}), image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success(de ? "Bild hochgeladen" : "Image uploaded");
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.image_url) {
      toast.error(de ? "Bitte Bild hochladen" : "Please upload an image");
      return;
    }
    const titleDe = editing.title_de || "";
    let titleEn = editing.title_en || "";
    if (titleDe.trim() && !titleEn.trim()) {
      try {
        const [t] = await translateTexts([titleDe]);
        if (t) titleEn = t;
      } catch {
        titleEn = titleDe;
      }
    }
    const payload = {
      title_de: titleDe,
      title_en: titleEn,
      image_url: editing.image_url,
      span: editing.span || "regular",
      sort_order: editing.sort_order ?? items.length,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) {
      const { error } = await supabase.from("ig_gallery").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("ig_gallery").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success(de ? "Gespeichert" : "Saved");
    setEditing(null);
    setIsNew(false);
    queryClient.invalidateQueries({ queryKey: ["admin-ig-gallery"] });
    queryClient.invalidateQueries({ queryKey: ["ig-gallery-public"] });
  };

  const remove = async (id: string) => {
    if (!confirm(de ? "Löschen?" : "Delete?")) return;
    const { error } = await supabase.from("ig_gallery").delete().eq("id", id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin-ig-gallery"] });
    queryClient.invalidateQueries({ queryKey: ["ig-gallery-public"] });
    toast.success(de ? "Gelöscht" : "Deleted");
  };

  const toggleActive = async (item: IgGalleryItem) => {
    await supabase.from("ig_gallery").update({ is_active: !item.is_active }).eq("id", item.id);
    queryClient.invalidateQueries({ queryKey: ["admin-ig-gallery"] });
    queryClient.invalidateQueries({ queryKey: ["ig-gallery-public"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground font-body">
          {de
            ? 'Bilder im Einblicke-Bereich. „Wide" = volle Breite.'
            : 'Images in the Glimpses section. "Wide" = full width.'}
        </p>
        <button
          onClick={() => {
            setEditing({ ...emptyOffer, image_url: null, span: "regular" } as any);
            setIsNew(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> {de ? "Neues Bild" : "New image"}
        </button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-display font-bold text-sm">
            {isNew ? (de ? "Neues Bild" : "New image") : de ? "Bild bearbeiten" : "Edit image"}
          </h3>
          <div className="flex items-start gap-4 flex-wrap">
            {editing.image_url ? (
              <img
                src={editing.image_url}
                alt=""
                className="w-44 h-32 object-cover rounded-lg border border-border"
              />
            ) : (
              <div className="w-44 h-32 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                <ImageIcon size={28} className="text-muted-foreground" />
              </div>
            )}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs font-semibold hover:bg-muted/70 disabled:opacity-50 transition-colors"
              >
                <Upload size={13} />
                {uploading ? (de ? "Hochladen..." : "Uploading...") : de ? "Bild hochladen" : "Upload image"}
              </button>
            </div>
          </div>
          <Field label={de ? "Titel (DE / Alt-Text)" : "Title (DE / alt text)"}>
            <input
              value={editing.title_de || ""}
              onChange={(e) => setEditing({ ...editing, title_de: e.target.value })}
              className="ig-admin-input"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label={de ? "Größe" : "Size"}>
              <select
                value={editing.span || "regular"}
                onChange={(e) => setEditing({ ...editing, span: e.target.value })}
                className="ig-admin-input"
              >
                <option value="regular">{de ? "Normal" : "Regular"}</option>
                <option value="wide">{de ? "Breit (volle Reihe)" : "Wide (full row)"}</option>
              </select>
            </Field>
            <Field label={de ? "Reihenfolge" : "Sort order"}>
              <input
                type="number"
                value={editing.sort_order ?? 0}
                onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                className="ig-admin-input"
              />
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 text-sm font-body mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="rounded"
                />
                {de ? "Aktiv" : "Active"}
              </label>
            </Field>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Save size={14} /> {de ? "Speichern" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setIsNew(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm font-body hover:bg-muted transition-colors"
            >
              <X size={14} /> {de ? "Abbrechen" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingPanel />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body text-center py-8">
          {de ? "Noch keine Bilder." : "No images yet."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((it) => (
            <div
              key={it.id}
              className={`bg-card border border-border/60 rounded-xl overflow-hidden ${
                it.is_active ? "" : "opacity-60"
              }`}
            >
              {it.image_url ? (
                <img src={it.image_url} alt={it.title_de} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-muted/30 flex items-center justify-center">
                  <ImageIcon size={32} className="text-muted-foreground" />
                </div>
              )}
              <div className="p-3">
                <p className="text-xs font-display font-bold truncate">{it.title_de || "—"}</p>
                <p className="text-[10px] text-muted-foreground font-body">
                  {it.span === "wide" ? (de ? "Breit" : "Wide") : de ? "Normal" : "Regular"} · #
                  {it.sort_order}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <button onClick={() => toggleActive(it)} className="p-1.5 rounded-lg hover:bg-muted">
                    {it.is_active ? (
                      <Eye size={14} className="text-primary" />
                    ) : (
                      <EyeOff size={14} className="text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(it);
                      setIsNew(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted"
                  >
                    <Pencil size={14} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => remove(it.id)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`.ig-admin-input{width:100%;padding:.5rem .75rem;background:hsl(var(--muted)/.5);border:1px solid hsl(var(--border));border-radius:.5rem;font-size:.875rem;font-family:inherit;}.ig-admin-input:focus{outline:none;border-color:hsl(var(--primary));}`}</style>
    </div>
  );
};
