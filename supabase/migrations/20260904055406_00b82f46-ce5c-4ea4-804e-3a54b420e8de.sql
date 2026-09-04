ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS placements text[] NOT NULL DEFAULT ARRAY['store']::text[],
  ADD COLUMN IF NOT EXISTS max_impressions integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS style text NOT NULL DEFAULT 'banner';