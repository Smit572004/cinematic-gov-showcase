
-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_de TEXT NOT NULL,
  description_en TEXT,
  description_de TEXT,
  species TEXT NOT NULL,
  container_size TEXT NOT NULL DEFAULT 'medium',
  price NUMERIC(10,2),
  availability TEXT NOT NULL DEFAULT 'in-stock',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are publicly viewable (catalog)
CREATE POLICY "Products are viewable by everyone"
ON public.products
FOR SELECT
TO anon, authenticated
USING (true);

-- Insert some sample products
INSERT INTO public.products (name_en, name_de, description_en, description_de, species, container_size, price, availability, image_url) VALUES
('European Beech Seedling', 'Rotbuche Setzling', 'High-quality container-grown European Beech seedlings with excellent root development. Ideal for reforestation on fresh to moist sites.', 'Hochwertige containergewachsene Rotbuchen-Setzlinge mit hervorragender Wurzelentwicklung. Ideal für Aufforstung auf frischen bis feuchten Standorten.', 'Beech', 'medium', 2.50, 'in-stock', NULL),
('Sessile Oak Seedling', 'Traubeneiche Setzling', 'Robust Sessile Oak seedlings grown using proven biotechnology methods. Suitable for dry to moderately fresh sites with M-Index 2-3.', 'Robuste Traubeneichen-Setzlinge, gezüchtet mit bewährten Biotechnologie-Methoden. Geeignet für trockene bis mäßig frische Standorte mit M-Index 2-3.', 'Oak', 'large', 3.20, 'in-stock', NULL),
('Norway Spruce Seedling', 'Gemeine Fichte Setzling', 'Fast-growing Norway Spruce container seedlings with optimized plug geometry for hydraulic soil contact.', 'Schnellwachsende Gemeine Fichten-Containersetzlinge mit optimierter Plug-Geometrie für hydraulischen Bodenkontakt.', 'Spruce', 'small', 1.80, 'in-stock', NULL),
('Scots Pine Seedling', 'Waldkiefer Setzling', 'Hardy Scots Pine seedlings developed for challenging dry sites. Compact root plug ensures excellent establishment rates.', 'Winterharte Waldkiefer-Setzlinge, entwickelt für anspruchsvolle trockene Standorte. Kompakter Wurzelplug gewährleistet hervorragende Anwuchsraten.', 'Pine', 'small', 1.60, 'pre-order', NULL),
('European Larch Seedling', 'Europäische Lärche Setzling', 'Premium European Larch seedlings with superior growth characteristics. Excellent choice for mixed-species reforestation projects.', 'Premium Europäische Lärchen-Setzlinge mit überlegenen Wachstumseigenschaften. Ausgezeichnete Wahl für Aufforstungsprojekte mit Mischbaumarten.', 'Larch', 'medium', 2.80, 'in-stock', NULL),
('Silver Birch Seedling', 'Hängebirke Setzling', 'Vigorous Silver Birch seedlings ideal for pioneer planting and site preparation. Fast-establishing with broad site tolerance.', 'Kräftige Hängebirken-Setzlinge, ideal für Pionierpflanzung und Standortvorbereitung. Schnell anwachsend mit breiter Standorttoleranz.', 'Birch', 'medium', 2.10, 'seasonal', NULL),
('Douglas Fir Seedling', 'Douglasie Setzling', 'Climate-resilient Douglas Fir seedlings adapted for Central European conditions. High yield potential on suitable sites.', 'Klimaresiliente Douglasien-Setzlinge, angepasst an mitteleuropäische Bedingungen. Hohes Ertragspotenzial auf geeigneten Standorten.', 'Douglas Fir', 'large', 3.50, 'in-stock', NULL),
('Wild Cherry Seedling', 'Vogelkirsche Setzling', 'Valuable hardwood Wild Cherry seedlings for enrichment planting. Excellent timber quality and ecological value.', 'Wertvolle Laubholz-Vogelkirschen-Setzlinge für Anreicherungspflanzung. Hervorragende Holzqualität und ökologischer Wert.', 'Cherry', 'large', 4.00, 'pre-order', NULL);
