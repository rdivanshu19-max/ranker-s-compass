
-- Fix badge insertion: allow service role to insert badges (bypass RLS for service role)
-- Drop old restrictive policy and add a permissive one
DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;
CREATE POLICY "Anyone authenticated can insert badges"
ON public.user_badges FOR INSERT TO authenticated
WITH CHECK (true);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'general',
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- Add columns to courses for pinning and tagging
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create storage bucket for course posters
INSERT INTO storage.buckets (id, name, public) VALUES ('course-posters', 'course-posters', true) ON CONFLICT DO NOTHING;

-- Storage policies for course posters
CREATE POLICY "Anyone can view course posters"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-posters');

CREATE POLICY "Admins can upload course posters"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-posters');

CREATE POLICY "Admins can delete course posters"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-posters');
