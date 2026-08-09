-- helper: ban check
CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.banned_users WHERE user_id = _user_id)
$$;
REVOKE ALL ON FUNCTION public.is_banned(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_banned(uuid) TO authenticated, anon, service_role;

-- 1. user_badges: no arbitrary awards
DROP POLICY IF EXISTS "Anyone authenticated can insert badges" ON public.user_badges;
CREATE POLICY "Admins can award badges"
ON public.user_badges FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. notifications: only admins may create
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. activity_log: actor_role cannot be forged
DROP POLICY IF EXISTS "Authenticated can log own actions" ON public.activity_log;
CREATE POLICY "Authenticated can log own actions"
ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = actor_id
  AND NOT public.is_banned(auth.uid())
  AND (
    (actor_role = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
    OR (actor_role = 'moderator' AND public.has_role(auth.uid(), 'moderator'::app_role))
    OR (actor_role = 'user')
  )
);

-- 4. ratings: hide who rated what from anonymous visitors
DROP POLICY IF EXISTS "Ratings viewable by everyone" ON public.ratings;
CREATE POLICY "Ratings viewable by signed-in users"
ON public.ratings FOR SELECT TO authenticated
USING (true);

-- 5. storage course-posters: require admin/moderator
DROP POLICY IF EXISTS "Admins can upload course posters" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course posters" ON storage.objects;
CREATE POLICY "Staff can upload course posters"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-posters'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
);
CREATE POLICY "Staff can delete course posters"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'course-posters'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
);
CREATE POLICY "Staff can update course posters"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'course-posters'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
)
WITH CHECK (
  bucket_id = 'course-posters'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
);

-- 6. enforce bans server-side on user write paths
DROP POLICY IF EXISTS "Users can insert own ai usage" ON public.ai_usage;
CREATE POLICY "Users can insert own ai usage" ON public.ai_usage FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users manage own favorites" ON public.app_favorites;
CREATE POLICY "Users manage own favorites" ON public.app_favorites FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users manage own astra history" ON public.astra_chat_history;
CREATE POLICY "Users manage own astra history" ON public.astra_chat_history FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
CREATE POLICY "Users can insert own feedback" ON public.feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can rate" ON public.ratings;
CREATE POLICY "Users can rate" ON public.ratings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can update own rating" ON public.ratings;
CREATE POLICY "Users can update own rating" ON public.ratings FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND NOT public.is_banned(auth.uid()))
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.study_sessions;
CREATE POLICY "Users can insert own sessions" ON public.study_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own vault" ON public.study_vault;
CREATE POLICY "Users can insert own vault" ON public.study_vault FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own results" ON public.test_results;
CREATE POLICY "Users can insert own results" ON public.test_results FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can track downloads" ON public.user_downloads;
CREATE POLICY "Users can track downloads" ON public.user_downloads FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Mods and admins can create reports" ON public.user_reports;
CREATE POLICY "Mods and admins can create reports" ON public.user_reports FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = reporter_id
  AND NOT public.is_banned(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
);

-- 7. lock down SECURITY DEFINER helpers that must never be called over the API
REVOKE ALL ON FUNCTION public.get_user_lookup() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_lookup() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.append_report_timeline() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 8. private realtime channels scoped to the user's own topic
DO $$
BEGIN
  EXECUTE 'CREATE POLICY "Users access own realtime topic" ON realtime.messages FOR SELECT TO authenticated USING (realtime.topic() = ''user:'' || auth.uid()::text)';
  EXECUTE 'CREATE POLICY "Users write own realtime topic" ON realtime.messages FOR INSERT TO authenticated WITH CHECK (realtime.topic() = ''user:'' || auth.uid()::text)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'realtime.messages policies skipped: %', SQLERRM;
END $$;