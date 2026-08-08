-- Favorites
CREATE TABLE public.app_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_id uuid NOT NULL REFERENCES public.study_apps(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);
GRANT SELECT, INSERT, DELETE ON public.app_favorites TO authenticated;
GRANT ALL ON public.app_favorites TO service_role;
ALTER TABLE public.app_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.app_favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Portal extras
ALTER TABLE public.study_portals ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.study_portals ADD COLUMN IF NOT EXISTS logo_url text;

-- Test series
CREATE TABLE public.test_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  poster_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.test_series TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_series TO authenticated;
GRANT ALL ON public.test_series TO service_role;
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Test series viewable by everyone" ON public.test_series FOR SELECT USING (true);
CREATE POLICY "Admins manage test series" ON public.test_series FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.test_series_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.test_series(id) ON DELETE CASCADE,
  name text NOT NULL,
  link text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'available',
  description text,
  scheduled_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.test_series_tests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_series_tests TO authenticated;
GRANT ALL ON public.test_series_tests TO service_role;
ALTER TABLE public.test_series_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tests viewable by everyone" ON public.test_series_tests FOR SELECT USING (true);
CREATE POLICY "Admins manage tests" ON public.test_series_tests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_test_series_updated_at BEFORE UPDATE ON public.test_series
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_test_series_tests_updated_at BEFORE UPDATE ON public.test_series_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();