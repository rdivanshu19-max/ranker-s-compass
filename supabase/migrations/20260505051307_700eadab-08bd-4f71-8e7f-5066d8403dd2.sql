ALTER TABLE public.user_reports
ADD COLUMN IF NOT EXISTS status_timeline jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.user_reports
SET status_timeline = jsonb_build_array(
  jsonb_build_object('status', 'pending', 'at', created_at, 'by', reporter_id, 'note', 'Report submitted')
)
WHERE status_timeline = '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_user_reports_status_timeline ON public.user_reports USING gin (status_timeline);

DROP FUNCTION IF EXISTS public.get_user_lookup();
CREATE FUNCTION public.get_user_lookup()
RETURNS TABLE(user_id uuid, display_name text, email text, username text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.user_id,
    p.display_name,
    u.email,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) AS username,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'moderator'::app_role)
  ORDER BY p.display_name NULLS LAST, u.email
$function$;

CREATE OR REPLACE FUNCTION public.append_report_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status_timeline = '[]'::jsonb THEN
      NEW.status_timeline = jsonb_build_array(
        jsonb_build_object('status', NEW.status, 'at', NEW.created_at, 'by', NEW.reporter_id, 'note', 'Report submitted')
      );
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    NEW.status_timeline = COALESCE(OLD.status_timeline, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'status', NEW.status,
        'at', now(),
        'by', auth.uid(),
        'note', COALESCE(NEW.admin_notes, '')
      )
    );
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_user_reports_timeline ON public.user_reports;
CREATE TRIGGER trg_user_reports_timeline
BEFORE INSERT OR UPDATE ON public.user_reports
FOR EACH ROW
EXECUTE FUNCTION public.append_report_timeline();