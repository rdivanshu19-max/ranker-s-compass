CREATE OR REPLACE FUNCTION public.append_report_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status_timeline IS NULL OR NEW.status_timeline = '[]'::jsonb THEN
      NEW.status_timeline = jsonb_build_array(
        jsonb_build_object(
          'status', COALESCE(NEW.status, 'pending'),
          'at', COALESCE(NEW.created_at, now()),
          'by', NEW.reporter_id,
          'note', 'Report submitted'
        )
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
        'note', COALESCE(NULLIF(NEW.admin_notes, ''), CASE NEW.status
          WHEN 'reviewed' THEN 'Report reviewed'
          WHEN 'action_taken' THEN 'Action taken by admin'
          WHEN 'rejected' THEN 'Report rejected'
          ELSE 'Status updated'
        END)
      )
    );
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_reports_status_timeline ON public.user_reports;
CREATE TRIGGER user_reports_status_timeline
BEFORE INSERT OR UPDATE ON public.user_reports
FOR EACH ROW
EXECUTE FUNCTION public.append_report_timeline();

UPDATE public.user_reports
SET status_timeline = CASE
  WHEN status_timeline IS NULL OR status_timeline = '[]'::jsonb THEN jsonb_build_array(
    jsonb_build_object('status', 'pending', 'at', created_at, 'by', reporter_id, 'note', 'Report submitted'),
    jsonb_build_object('status', status, 'at', updated_at, 'by', NULL, 'note', COALESCE(admin_notes, 'Status updated'))
  )
  WHEN NOT EXISTS (SELECT 1 FROM jsonb_array_elements(status_timeline) elem WHERE elem->>'status' = status) THEN
    status_timeline || jsonb_build_array(jsonb_build_object('status', status, 'at', updated_at, 'by', NULL, 'note', COALESCE(admin_notes, 'Status updated')))
  ELSE status_timeline
END
WHERE status <> 'pending' OR status_timeline IS NULL OR status_timeline = '[]'::jsonb;