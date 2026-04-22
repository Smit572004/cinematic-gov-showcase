import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type IgOffer = {
  id: string;
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  badge_de: string;
  badge_en: string;
  price_text: string;
  unit_text: string;
  emoji: string;
  color_tag: string;
  sort_order: number;
  is_active: boolean;
};

export type IgGalleryItem = {
  id: string;
  title_de: string;
  title_en: string;
  image_url: string | null;
  span: string;
  sort_order: number;
  is_active: boolean;
};

export const IG_CONTENT_KEYS = [
  "ig_hero_eyebrow",
  "ig_hero_title_a",
  "ig_hero_title_b",
  "ig_hero_lead",
  "ig_hero_cta_primary",
  "ig_hero_cta_ghost",
  "ig_hero_image_url",
  "ig_offers_eyebrow",
  "ig_offers_title",
  "ig_offers_subtitle",
  "ig_offers_banner",
  "ig_gallery_eyebrow",
  "ig_gallery_title",
  "ig_gallery_subtitle",
  "ig_location_eyebrow",
  "ig_location_title",
  "ig_location_subtitle",
  "ig_address_name",
  "ig_address_street",
  "ig_address_city",
  "ig_contact_phone",
  "ig_contact_phone_tel",
  "ig_contact_whatsapp",
  "ig_contact_email",
  "ig_map_query",
  "ig_footer_tagline",
  "ig_hours_mon",
  "ig_hours_tue",
  "ig_hours_wed",
  "ig_hours_thu",
  "ig_hours_fri",
  "ig_hours_sat",
  "ig_hours_sun",
] as const;

export type IgContentKey = (typeof IG_CONTENT_KEYS)[number];

export type IgContentMap = Record<string, { value_de: string; value_en: string }>;

export const useIgContent = () => {
  return useQuery({
    queryKey: ["ig-content"],
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
    staleTime: 30_000,
  });
};

export const useIgOffers = () =>
  useQuery({
    queryKey: ["ig-offers-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ig_offers")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as IgOffer[];
    },
    staleTime: 30_000,
  });

export const useIgGallery = () =>
  useQuery({
    queryKey: ["ig-gallery-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ig_gallery")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as IgGalleryItem[];
    },
    staleTime: 30_000,
  });

/** Parse a hours value like "09:00|18:00" or "closed". Returns null if closed. */
export const parseHours = (
  raw: string | undefined,
): { open: string; close: string } | null => {
  if (!raw || raw.toLowerCase() === "closed") return null;
  const [open, close] = raw.split("|").map((s) => s.trim());
  if (!open || !close) return null;
  return { open, close };
};

export const HOUR_KEYS: IgContentKey[] = [
  "ig_hours_sun",
  "ig_hours_mon",
  "ig_hours_tue",
  "ig_hours_wed",
  "ig_hours_thu",
  "ig_hours_fri",
  "ig_hours_sat",
];
