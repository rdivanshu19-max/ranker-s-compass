ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';