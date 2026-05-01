-- ai_usage table for daily limits
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL CHECK (feature IN ('ai_test','ai_chat','ai_mentor')),
  usage_date date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature, usage_date)
);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai usage" ON public.ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai usage" ON public.ai_usage
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all ai usage" ON public.ai_usage
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ai_usage_updated_at BEFORE UPDATE ON public.ai_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- astra_chat_history
CREATE TABLE IF NOT EXISTS public.astra_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.astra_chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own astra history" ON public.astra_chat_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS astra_chat_history_user_id_created_at_idx
  ON public.astra_chat_history (user_id, created_at);

-- user_reports
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed','actioned')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mods and admins can create reports" ON public.user_reports
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id AND (
      has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    )
  );
CREATE POLICY "Reporters can view own reports" ON public.user_reports
  FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON public.user_reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update reports" ON public.user_reports
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete reports" ON public.user_reports
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER user_reports_updated_at BEFORE UPDATE ON public.user_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Moderator policies on materials & courses (insert + update only)
CREATE POLICY "Moderators can insert materials" ON public.materials
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can update materials" ON public.materials
  FOR UPDATE USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can insert courses" ON public.courses
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can update courses" ON public.courses
  FOR UPDATE USING (has_role(auth.uid(), 'moderator'::app_role));

-- Moderator upload to course-posters bucket
CREATE POLICY "Moderators can upload course posters" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-posters' AND (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
  ));

-- Set testcheckwebsite@gmail.com as moderator if that user exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'moderator'::app_role FROM auth.users WHERE email = 'testcheckwebsite@gmail.com'
ON CONFLICT DO NOTHING;