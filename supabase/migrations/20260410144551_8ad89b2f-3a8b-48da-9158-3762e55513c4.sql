CREATE TABLE public.garden_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_de TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  description_de TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'gift',
  badge_de TEXT NOT NULL DEFAULT 'Angebot',
  badge_en TEXT NOT NULL DEFAULT 'Offer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.garden_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active offers"
  ON public.garden_offers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert offers"
  ON public.garden_offers FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update offers"
  ON public.garden_offers FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete offers"
  ON public.garden_offers FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed the two existing offers
INSERT INTO public.garden_offers (title_de, title_en, description_de, description_en, icon, badge_de, badge_en, sort_order)
VALUES
  ('3 kaufen, 1 gratis!', 'Buy 3, Get 1 Free!', 'Kaufen Sie 3 beliebige Gartenpflanzen und erhalten Sie die 4. Pflanze kostenlos dazu. Perfekt, um Ihren Garten zu verschönern!', 'Purchase any 3 garden plants and get the 4th one absolutely free. Perfect for filling up your garden!', 'gift', 'Angebot', 'Offer', 0),
  ('Freunde werben, 10% sparen!', 'Refer a Friend, Save 10%!', 'Empfehlen Sie unseren Shop weiter! Wenn Ihre Empfehlung Produkte im Wert von mindestens 30€ kauft, erhalten Sie 10% Rabatt auf Ihren nächsten Einkauf.', 'Refer our shop to a friend! When they purchase products worth at least €30, you''ll receive a 10% discount on your next purchase.', 'users', 'Empfehlung', 'Referral', 1);