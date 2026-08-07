CREATE TABLE public.portal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portal_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_categories TO authenticated;
GRANT ALL ON public.portal_categories TO service_role;
ALTER TABLE public.portal_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories viewable by everyone" ON public.portal_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.portal_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.study_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  banner_url text NOT NULL DEFAULT '',
  courses_included text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.study_apps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_apps TO authenticated;
GRANT ALL ON public.study_apps TO service_role;
ALTER TABLE public.study_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Study apps viewable by everyone" ON public.study_apps FOR SELECT USING (true);
CREATE POLICY "Admins manage study apps" ON public.study_apps FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.study_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.study_apps(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  badge text NOT NULL DEFAULT 'standard',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.study_portals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_portals TO authenticated;
GRANT ALL ON public.study_portals TO service_role;
ALTER TABLE public.study_portals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portals viewable by everyone" ON public.study_portals FOR SELECT USING (true);
CREATE POLICY "Admins manage portals" ON public.study_portals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER study_apps_updated_at BEFORE UPDATE ON public.study_apps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER study_portals_updated_at BEFORE UPDATE ON public.study_portals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER portal_categories_updated_at BEFORE UPDATE ON public.portal_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.portal_categories (name) VALUES
 ('JEE'),('NEET'),('UPSC'),('Class 11'),('Class 12'),('Boards'),('Foundation'),('Test Series'),('Books'),('Notes'),('PYQs'),('DPP'),('Other')
ON CONFLICT (name) DO NOTHING;