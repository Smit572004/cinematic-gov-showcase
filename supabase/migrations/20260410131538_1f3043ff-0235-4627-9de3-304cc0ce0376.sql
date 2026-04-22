
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Team members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role_en TEXT NOT NULL,
  role_de TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view team members" ON public.team_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert team members" ON public.team_members FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update team members" ON public.team_members FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete team members" ON public.team_members FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Site content table
CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key TEXT NOT NULL UNIQUE,
  value_en TEXT NOT NULL DEFAULT '',
  value_de TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view site content" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update site content" ON public.site_content FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert site content" ON public.site_content FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin policies for products
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Insert initial team members
INSERT INTO public.team_members (name, role_en, role_de, phone, email, sort_order) VALUES
('Claus Hoelk, Ing. Agr.', 'Managing Director', 'Geschäftsführer', '01578 / 7930211', 'claushoelk@gmail.com', 1),
('Heidrun Erbs, Ing. Agr.', 'Head of Horticulture', 'Gartenbauleiterin', '039209 / 6969-28', 'h.erbs@tinplant-gmbh.de', 2),
('Fabian Meyer', 'Operations Manager', 'Betriebsleiter', '039209 / 6969-0', 'f.meyer@tinplant-gmbh.de', 3);

-- Insert initial site content
INSERT INTO public.site_content (content_key, value_en, value_de) VALUES
('hero_title1', 'Reforestation', 'Aufforstung'),
('hero_title2', 'Made Easier', 'Leicht Gemacht'),
('hero_desc', 'Germany''s premier container seedling producer, combining biotechnology excellence with three decades of forestry expertise for government reforestation programs.', 'Deutschlands führender Containerpflanzen-Produzent, der biotechnologische Exzellenz mit drei Jahrzehnten Forstwirtschafts-Expertise für staatliche Aufforstungsprogramme verbindet.'),
('about_title', 'Three Decades of Forestry Excellence', 'Drei Jahrzehnte Forstwirtschaftliche Exzellenz'),
('about_desc', 'Founded in 1992, TinPlant has grown from a small biotechnology laboratory into Germany''s leading container seedling producer.', 'Gegründet 1992, hat sich TinPlant von einem kleinen Biotechnologie-Labor zu Deutschlands führendem Containerpflanzen-Produzenten entwickelt.'),
('contact_phone', '+49 39209 69 69 0', '+49 39209 69 69 0'),
('contact_email', 'info@tinplant-gmbh.de', 'info@tinplant-gmbh.de'),
('contact_address', 'Magdeburger Landstr. 33\n39164 Wanzleben-Börde\nSachsen-Anhalt, Germany', 'Magdeburger Landstr. 33\n39164 Wanzleben-Börde\nSachsen-Anhalt, Deutschland'),
('contact_fax', '+49 39209 69 69 19', '+49 39209 69 69 19'),
('contact_whatsapp', '+49 157 87930211', '+49 157 87930211');
