CREATE TABLE public.community_story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.community_stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_story_likes_story_user_unique UNIQUE (story_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.community_story_likes TO authenticated;
GRANT ALL ON public.community_story_likes TO service_role;
ALTER TABLE public.community_story_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own likes and authors see likes on own stories" ON public.community_story_likes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.community_stories s WHERE s.id = story_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Users like active stories as themselves" ON public.community_story_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.community_stories s
      WHERE s.id = story_id AND s.user_id <> auth.uid() AND s.expires_at > now()
    )
  );
CREATE POLICY "Users remove their own story likes" ON public.community_story_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE INDEX community_story_likes_story_id_idx ON public.community_story_likes(story_id);

CREATE OR REPLACE FUNCTION public.get_community_story_like_counts(_story_ids uuid[])
RETURNS TABLE(story_id uuid, like_count bigint, liked_by_me boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT s.id, count(l.id), COALESCE(bool_or(l.user_id = auth.uid()), false)
  FROM public.community_stories s
  LEFT JOIN public.community_story_likes l ON l.story_id = s.id
  WHERE s.id = ANY(_story_ids)
    AND auth.uid() IS NOT NULL
  GROUP BY s.id
$function$;
REVOKE EXECUTE ON FUNCTION public.get_community_story_like_counts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_story_like_counts(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_community_story_likers(_story_id uuid)
RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT p.user_id, p.display_name, p.username, p.avatar_url
  FROM public.community_story_likes l
  JOIN public.community_stories s ON s.id = l.story_id
  JOIN public.profiles p ON p.user_id = l.user_id
  WHERE l.story_id = _story_id
    AND s.user_id = auth.uid()
    AND auth.uid() IS NOT NULL
  ORDER BY l.created_at DESC
$function$;
REVOKE EXECUTE ON FUNCTION public.get_community_story_likers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_story_likers(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_community_story_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  story_owner uuid;
  liker_name text;
BEGIN
  SELECT s.user_id INTO story_owner FROM public.community_stories s WHERE s.id = NEW.story_id;
  IF story_owner IS NULL OR story_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(p.display_name, 'A student') INTO liker_name FROM public.profiles p WHERE p.user_id = NEW.user_id;
  INSERT INTO public.notifications (user_id, title, message, type, priority)
  VALUES (story_owner, COALESCE(liker_name, 'A student') || ' liked your story', 'Open your story to see who liked it.', 'story_like', 'normal');
  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.notify_community_story_like() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_notify_community_story_like
  AFTER INSERT ON public.community_story_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_community_story_like();