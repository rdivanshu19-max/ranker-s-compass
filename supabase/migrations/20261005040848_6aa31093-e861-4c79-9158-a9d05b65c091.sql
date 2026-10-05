CREATE OR REPLACE FUNCTION public.notify_mentions()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  handle text; target uuid; author_name text; snippet text; post_ref uuid; is_staff boolean;
BEGIN
  snippet := left(regexp_replace(NEW.content, '\s+', ' ', 'g'), 140);
  IF TG_TABLE_NAME = 'post_comments' THEN post_ref := NEW.post_id; ELSE post_ref := NEW.id; END IF;
  SELECT COALESCE(display_name, 'A student') INTO author_name FROM public.profiles WHERE user_id = NEW.user_id;
  is_staff := public.has_role(NEW.user_id, 'admin') OR public.has_role(NEW.user_id, 'moderator');

  FOR handle IN
    SELECT DISTINCT lower(m[1]) FROM regexp_matches(NEW.content, '@([A-Za-z0-9_\.]{2,32})', 'g') AS m
  LOOP
    IF handle = 'admin' THEN
      INSERT INTO public.notifications (user_id, title, message, type, priority)
      SELECT ur.user_id, COALESCE(author_name, 'A student') || ' tagged @admin', snippet, 'mention', 'urgent'
      FROM public.user_roles ur WHERE ur.role IN ('admin','moderator') AND ur.user_id <> NEW.user_id;
    ELSE
      target := NULL;
      SELECT p.user_id INTO target FROM public.profiles p WHERE lower(p.username) = handle LIMIT 1;
      IF target IS NOT NULL AND target <> NEW.user_id THEN
        INSERT INTO public.notifications (user_id, title, message, type, priority)
        VALUES (target,
          CASE WHEN is_staff THEN 'Admin ' || COALESCE(author_name,'') || ' mentioned you' ELSE COALESCE(author_name, 'A student') || ' mentioned you' END,
          snippet, 'mention', CASE WHEN is_staff THEN 'urgent' ELSE 'normal' END);
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_post_reply()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  owner uuid; author_name text; is_staff boolean;
BEGIN
  SELECT user_id INTO owner FROM public.community_posts WHERE id = NEW.post_id;
  IF owner IS NULL OR owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, 'A student') INTO author_name FROM public.profiles WHERE user_id = NEW.user_id;
  is_staff := public.has_role(NEW.user_id, 'admin') OR public.has_role(NEW.user_id, 'moderator');
  INSERT INTO public.notifications (user_id, title, message, type, priority)
  VALUES (owner,
    CASE WHEN is_staff THEN 'Admin ' || COALESCE(author_name,'') || ' replied to your post' ELSE COALESCE(author_name,'A student') || ' replied to your post' END,
    left(regexp_replace(NEW.content, '\s+', ' ', 'g'), 140), 'reply',
    CASE WHEN is_staff THEN 'urgent' ELSE 'normal' END);
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_post_reply() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_reply_notify ON public.post_comments;
CREATE TRIGGER trg_reply_notify AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_post_reply();