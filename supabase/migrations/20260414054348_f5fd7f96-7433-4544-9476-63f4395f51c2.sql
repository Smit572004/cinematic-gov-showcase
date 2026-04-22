
-- Fix: restrict gallery_images SELECT to only active images for public, admins see all
DROP POLICY "Everyone can view gallery images" ON public.gallery_images;

CREATE POLICY "Everyone can view active gallery images"
ON public.gallery_images
FOR SELECT
TO anon, authenticated
USING ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role));
