
-- =========================
-- ig_offers
-- =========================
CREATE TABLE public.ig_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_de text NOT NULL,
  title_en text NOT NULL DEFAULT '',
  description_de text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  badge_de text NOT NULL DEFAULT '',
  badge_en text NOT NULL DEFAULT '',
  price_text text NOT NULL DEFAULT '',
  unit_text text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '🌱',
  color_tag text NOT NULL DEFAULT 'tomato',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ig_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active ig offers"
  ON public.ig_offers FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ig offers"
  ON public.ig_offers FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ig offers"
  ON public.ig_offers FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ig offers"
  ON public.ig_offers FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- ig_gallery
-- =========================
CREATE TABLE public.ig_gallery (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_de text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  image_url text,
  span text NOT NULL DEFAULT 'regular', -- 'regular' | 'wide'
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ig_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active ig gallery"
  ON public.ig_gallery FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ig gallery"
  ON public.ig_gallery FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ig gallery"
  ON public.ig_gallery FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ig gallery"
  ON public.ig_gallery FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- updated_at trigger function (reuse if exists)
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ig_offers_updated_at
  BEFORE UPDATE ON public.ig_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ig_gallery_updated_at
  BEFORE UPDATE ON public.ig_gallery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Seed ig_offers (mirrors current hardcoded cards)
-- =========================
INSERT INTO public.ig_offers (title_de, title_en, description_de, description_en, badge_de, badge_en, price_text, unit_text, emoji, color_tag, sort_order)
VALUES
  ('Tomatenpflanzen', 'Tomato Plants', 'Veredelte und samenechte Sorten — kräftige Jungpflanzen.', 'Grafted and heirloom varieties — strong young plants.', 'Tomaten', 'Tomatoes', 'ab €0,88', '/ Stück', '🍅', 'tomato', 0),
  ('Paprikapflanzen', 'Pepper Plants', 'Süß und scharf — handverlesen, im Gewächshaus aufgezogen.', 'Sweet and hot — hand-picked, raised in the greenhouse.', 'Paprika', 'Peppers', '€1,20', '/ Stück', '🌶️', 'pepper', 1),
  ('Zucchini', 'Zucchini', 'Robust, ertragreich und perfekt für Garten oder Hochbeet.', 'Robust, productive and perfect for garden or raised bed.', 'Zucchini', 'Zucchini', '€1,25', '/ Stück', '🥒', 'zucchini', 2);

-- =========================
-- Seed ig_gallery (mirrors current hardcoded tiles)
-- =========================
INSERT INTO public.ig_gallery (title_de, title_en, image_url, span, sort_order)
VALUES
  ('Bunte Jungpflanzen im Gewächshaus', 'Colorful seedlings in the greenhouse', '/ig-seedlings.jpg', 'wide', 0),
  ('Blühende Stiefmütterchen in vielen Farben', 'Blooming pansies in many colors', '/ig-pansies.jpg', 'regular', 1),
  ('Petunien und Husarenknopf', 'Petunias and creeping zinnia', '/ig-flowers.jpg', 'regular', 2);

-- =========================
-- Seed site_content keys for /ig
-- =========================
INSERT INTO public.site_content (content_key, value_de, value_en) VALUES
  ('ig_hero_eyebrow', 'Direkt vom Erzeuger · Magdeburg', 'Direct from the grower · Magdeburg'),
  ('ig_hero_title_a', 'Frische Pflanzen,', 'Fresh plants,'),
  ('ig_hero_title_b', 'direkt aus dem Gewächshaus', 'straight from the greenhouse'),
  ('ig_hero_lead', 'Bessere Qualität. Faire Preise. Nur 15 Minuten von Magdeburg — gewachsen, nicht gehandelt.', 'Better quality. Fair prices. Just 15 minutes from Magdeburg — grown, not traded.'),
  ('ig_hero_cta_primary', 'Angebote ansehen', 'View offers'),
  ('ig_hero_cta_ghost', 'So findest du uns', 'How to find us'),
  ('ig_hero_image_url', '/ig-hero.jpg', '/ig-hero.jpg'),
  ('ig_offers_eyebrow', 'Saisonangebote', 'Seasonal offers'),
  ('ig_offers_title', 'Erzeugerpreise — direkt zu dir', 'Grower prices — straight to you'),
  ('ig_offers_subtitle', 'Faire Preise statt Großhandel. Eine kleine Auswahl unserer Saisonpflanzen.', 'Fair prices instead of wholesale. A small selection of our seasonal plants.'),
  ('ig_offers_banner', 'Direkt vom Erzeuger · keine Zwischenhändler', 'Direct from the grower · no middlemen'),
  ('ig_gallery_eyebrow', 'Einblicke', 'Glimpses'),
  ('ig_gallery_title', 'Aus dem Gewächshaus', 'From the greenhouse'),
  ('ig_gallery_subtitle', 'Echte Fotos. Echte Pflanzen. Gewachsen mit Sorgfalt vor deiner Haustür.', 'Real photos. Real plants. Grown with care on your doorstep.'),
  ('ig_location_eyebrow', 'Besuch uns', 'Visit us'),
  ('ig_location_title', 'Öffnungszeiten & Standort', 'Hours & location'),
  ('ig_location_subtitle', 'Komm vorbei — wir freuen uns auf dich im Gewächshaus.', 'Come by — we''d love to see you at the greenhouse.'),
  ('ig_address_name', 'TinPlant Gewächshaus', 'TinPlant Greenhouse'),
  ('ig_address_street', 'Magdeburger Landstraße 33', 'Magdeburger Landstraße 33'),
  ('ig_address_city', '39164 Wanzleben-Börde', '39164 Wanzleben-Börde'),
  ('ig_contact_phone', '+49 39209 69 69 0', '+49 39209 69 69 0'),
  ('ig_contact_phone_tel', '+493920969690', '+493920969690'),
  ('ig_contact_whatsapp', '+493920969690', '+493920969690'),
  ('ig_contact_email', 'info@tinplant-gmbh.de', 'info@tinplant-gmbh.de'),
  ('ig_map_query', 'Magdeburger Landstraße 33, 39164 Wanzleben-Börde', 'Magdeburger Landstraße 33, 39164 Wanzleben-Börde'),
  ('ig_footer_tagline', 'Direkt vom Erzeuger — gewachsen mit Sorgfalt.', 'Direct from the grower — grown with care.'),
  -- Hours: open|close in 24h, or "closed"
  ('ig_hours_mon', '09:00|18:00', '09:00|18:00'),
  ('ig_hours_tue', '09:00|18:00', '09:00|18:00'),
  ('ig_hours_wed', '09:00|18:00', '09:00|18:00'),
  ('ig_hours_thu', '09:00|18:00', '09:00|18:00'),
  ('ig_hours_fri', '09:00|18:00', '09:00|18:00'),
  ('ig_hours_sat', '09:00|18:00', '09:00|18:00'),
  ('ig_hours_sun', 'closed', 'closed')
ON CONFLICT (content_key) DO NOTHING;

-- =========================
-- Storage bucket for IG assets (hero photo + gallery uploads)
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('ig-assets', 'ig-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view ig-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ig-assets');

CREATE POLICY "Admins can upload ig-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ig-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ig-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ig-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ig-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ig-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Add unique constraint on site_content.content_key if missing (for ON CONFLICT to work next time)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_content_content_key_key'
  ) THEN
    ALTER TABLE public.site_content ADD CONSTRAINT site_content_content_key_key UNIQUE (content_key);
  END IF;
END $$;
