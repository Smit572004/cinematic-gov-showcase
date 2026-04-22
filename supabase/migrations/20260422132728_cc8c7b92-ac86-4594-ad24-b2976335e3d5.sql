INSERT INTO public.user_roles (user_id, role)
VALUES ('48aeacd6-cc65-48dc-bd89-f3ed737ffb57', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;