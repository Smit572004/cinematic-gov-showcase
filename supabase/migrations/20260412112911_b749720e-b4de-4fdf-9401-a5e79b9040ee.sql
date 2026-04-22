
-- Drop the problematic view
DROP VIEW IF EXISTS public.team_members_public;

-- Clean up redundant SELECT policies on team_members
DROP POLICY IF EXISTS "Admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Public can view team members basic info" ON public.team_members;

-- Re-create a single public SELECT policy
-- Team contact info is intentionally public on the website
CREATE POLICY "Everyone can view team members"
ON public.team_members
FOR SELECT
TO anon, authenticated
USING (true);
