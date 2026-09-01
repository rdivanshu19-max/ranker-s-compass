-- 1. RATE LIMITING ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_community_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cnt int;
BEGIN
  IF uid IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(uid, 'admin') OR public.has_role(uid, 'moderator') THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME = 'community_posts' THEN
    SELECT count(*) INTO cnt FROM public.community_posts
      WHERE user_id = uid AND created_at > now() - interval '1 hour';
    IF cnt >= 10 THEN RAISE EXCEPTION 'Rate limit reached: you can create up to 10 posts per hour.'; END IF;
    SELECT count(*) INTO cnt FROM public.community_posts
      WHERE user_id = uid AND created_at > now() - interval '30 seconds';
    IF cnt >= 1 THEN RAISE EXCEPTION 'Slow down: please wait 30 seconds between posts.'; END IF;

  ELSIF TG_TABLE_NAME = 'post_comments' THEN
    SELECT count(*) INTO cnt FROM public.post_comments
      WHERE user_id = uid AND created_at > now() - interval '1 hour';
    IF cnt >= 30 THEN RAISE EXCEPTION 'Rate limit reached: you can post up to 30 replies per hour.'; END IF;
    SELECT count(*) INTO cnt FROM public.post_comments
      WHERE user_id = uid AND created_at > now() - interval '5 seconds';
    IF cnt >= 1 THEN RAISE EXCEPTION 'Slow down: please wait a few seconds between replies.'; END IF;

  ELSIF TG_TABLE_NAME = 'post_votes' THEN
    SELECT count(*) INTO cnt FROM public.post_votes
      WHERE user_id = uid AND created_at > now() - interval '1 hour';
    IF cnt >= 120 THEN RAISE EXCEPTION 'Rate limit reached: too many votes in a short time.'; END IF;

  ELSIF TG_TABLE_NAME = 'community_stories' THEN
    SELECT count(*) INTO cnt FROM public.community_stories
      WHERE user_id = uid AND created_at > now() - interval '1 hour';
    IF cnt >= 5 THEN RAISE EXCEPTION 'Rate limit reached: you can add up to 5 stories per hour.'; END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_community_rate_limit() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_rate_limit_posts ON public.community_posts;
CREATE TRIGGER trg_rate_limit_posts BEFORE INSERT ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_community_rate_limit();

DROP TRIGGER IF EXISTS trg_rate_limit_comments ON public.post_comments;
CREATE TRIGGER trg_rate_limit_comments BEFORE INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_community_rate_limit();

DROP TRIGGER IF EXISTS trg_rate_limit_votes ON public.post_votes;
CREATE TRIGGER trg_rate_limit_votes BEFORE INSERT ON public.post_votes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_community_rate_limit();

DROP TRIGGER IF EXISTS trg_rate_limit_stories ON public.community_stories;
CREATE TRIGGER trg_rate_limit_stories BEFORE INSERT ON public.community_stories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_community_rate_limit();

-- 2. @MENTION NOTIFICATIONS -------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_mentions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  handle text;
  target uuid;
  author_name text;
  snippet text;
  post_ref uuid;
BEGIN
  snippet := left(regexp_replace(NEW.content, '\s+', ' ', 'g'), 140);
  IF TG_TABLE_NAME = 'post_comments' THEN post_ref := NEW.post_id; ELSE post_ref := NEW.id; END IF;

  SELECT COALESCE(display_name, 'A student') INTO author_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  FOR handle IN
    SELECT DISTINCT lower(m[1]) FROM regexp_matches(NEW.content, '@([A-Za-z0-9_\.]{2,32})', 'g') AS m
  LOOP
    IF handle = 'admin' THEN
      INSERT INTO public.notifications (user_id, title, message, type, priority)
      SELECT ur.user_id,
             COALESCE(author_name, 'A student') || ' tagged the admin team',
             snippet, 'mention', 'high'
      FROM public.user_roles ur
      WHERE ur.role IN ('admin', 'moderator') AND ur.user_id <> NEW.user_id;
    ELSE
      SELECT p.user_id INTO target FROM public.profiles p WHERE lower(p.username) = handle LIMIT 1;
      IF target IS NOT NULL AND target <> NEW.user_id THEN
        INSERT INTO public.notifications (user_id, title, message, type, priority)
        VALUES (target,
                COALESCE(author_name, 'A student') || ' mentioned you',
                snippet, 'mention', 'high');
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_mentions() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_mentions_posts ON public.community_posts;
CREATE TRIGGER trg_mentions_posts AFTER INSERT ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();

DROP TRIGGER IF EXISTS trg_mentions_comments ON public.post_comments;
CREATE TRIGGER trg_mentions_comments AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_mentions();

-- 3. AUDIT LOG FOR MODERATION ----------------------------------------------
CREATE OR REPLACE FUNCTION public.log_moderation_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  actor text;
  act text;
  tid text;
  info jsonb;
BEGIN
  IF uid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  actor := CASE
    WHEN public.has_role(uid, 'admin') THEN 'admin'
    WHEN public.has_role(uid, 'moderator') THEN 'moderator'
    ELSE 'user' END;

  IF TG_TABLE_NAME = 'community_posts' THEN
    IF TG_OP = 'DELETE' THEN
      act := 'delete_post'; tid := OLD.id::text;
      info := jsonb_build_object('title', OLD.title, 'author', OLD.user_id, 'excerpt', left(OLD.content, 120));
    ELSIF COALESCE(NEW.pinned, false) IS DISTINCT FROM COALESCE(OLD.pinned, false) THEN
      act := CASE WHEN NEW.pinned THEN 'pin_post' ELSE 'unpin_post' END; tid := NEW.id::text;
      info := jsonb_build_object('title', NEW.title, 'author', NEW.user_id);
    ELSE RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'post_comments' AND TG_OP = 'DELETE' THEN
    act := 'delete_comment'; tid := OLD.id::text;
    info := jsonb_build_object('post_id', OLD.post_id, 'author', OLD.user_id, 'excerpt', left(OLD.content, 120));

  ELSIF TG_TABLE_NAME = 'community_stories' AND TG_OP = 'DELETE' THEN
    act := 'delete_story'; tid := OLD.id::text;
    info := jsonb_build_object('author', OLD.user_id, 'caption', OLD.caption);

  ELSIF TG_TABLE_NAME = 'community_spaces' AND TG_OP = 'DELETE' THEN
    act := 'delete_space'; tid := OLD.id::text;
    info := jsonb_build_object('name', OLD.name);

  ELSIF TG_TABLE_NAME = 'feedback' AND TG_OP = 'UPDATE' THEN
    IF NEW.admin_reply IS NOT DISTINCT FROM OLD.admin_reply THEN RETURN NEW; END IF;
    act := 'reply_feedback'; tid := NEW.id::text;
    info := jsonb_build_object('reply', left(COALESCE(NEW.admin_reply, ''), 200), 'author', NEW.user_id);

  ELSIF TG_TABLE_NAME = 'user_reports' AND TG_OP = 'UPDATE' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
    act := 'report_status_' || NEW.status; tid := NEW.id::text;
    info := jsonb_build_object('from', OLD.status, 'to', NEW.status, 'reported_user', NEW.reported_user_id);

  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.activity_log (actor_id, actor_role, action, target_type, target_id, details)
  VALUES (uid, actor, act, TG_TABLE_NAME, tid, info);

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_moderation_action() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_audit_posts ON public.community_posts;
CREATE TRIGGER trg_audit_posts AFTER UPDATE OR DELETE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.log_moderation_action();

DROP TRIGGER IF EXISTS trg_audit_comments ON public.post_comments;
CREATE TRIGGER trg_audit_comments AFTER DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.log_moderation_action();

DROP TRIGGER IF EXISTS trg_audit_stories ON public.community_stories;
CREATE TRIGGER trg_audit_stories AFTER DELETE ON public.community_stories
  FOR EACH ROW EXECUTE FUNCTION public.log_moderation_action();

DROP TRIGGER IF EXISTS trg_audit_spaces ON public.community_spaces;
CREATE TRIGGER trg_audit_spaces AFTER DELETE ON public.community_spaces
  FOR EACH ROW EXECUTE FUNCTION public.log_moderation_action();

DROP TRIGGER IF EXISTS trg_audit_feedback ON public.feedback;
CREATE TRIGGER trg_audit_feedback AFTER UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.log_moderation_action();

DROP TRIGGER IF EXISTS trg_audit_reports ON public.user_reports;
CREATE TRIGGER trg_audit_reports AFTER UPDATE ON public.user_reports
  FOR EACH ROW EXECUTE FUNCTION public.log_moderation_action();