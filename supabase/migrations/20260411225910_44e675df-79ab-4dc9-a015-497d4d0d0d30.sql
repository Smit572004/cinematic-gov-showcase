-- Fix has_role() to prevent admin enumeration
-- Only allow checking own user_id, unless the caller is already an admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    CASE
      -- Allow checking own role
      WHEN _user_id = auth.uid() THEN
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
      -- Allow admins to check others' roles
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
      ELSE
        false
    END
$$;