ALTER TABLE public.ig_gallery REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ig_gallery;