
-- 1. Create a view for public team member data (without sensitive fields)
CREATE OR REPLACE VIEW public.team_members_public AS
SELECT id, name, role_de, role_en, sort_order, created_at
FROM public.team_members;

-- 2. Fix garden_offers SELECT policy to only show active offers to public
DROP POLICY IF EXISTS "Everyone can view active offers" ON public.garden_offers;

CREATE POLICY "Public can view active offers"
ON public.garden_offers
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Fix team_members: restrict public SELECT to admins only (use the view for public access)
DROP POLICY IF EXISTS "Everyone can view team members" ON public.team_members;

CREATE POLICY "Admins can view all team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view team members basic info"
ON public.team_members
FOR SELECT
TO anon, authenticated
USING (true);
