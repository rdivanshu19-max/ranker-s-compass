CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- privileged implementations live outside the exposed API schema
CREATE OR REPLACE FUNCTION private.has_role_impl(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_banned_impl(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.banned_users WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION private.user_lookup_impl()
RETURNS TABLE(user_id uuid, display_name text, email text, username text, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.display_name,
    u.email,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) AS username,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE private.has_role_impl(auth.uid(), 'admin'::public.app_role)
     OR private.has_role_impl(auth.uid(), 'moderator'::public.app_role)
  ORDER BY p.display_name NULLS LAST, u.email
$$;

REVOKE ALL ON FUNCTION private.has_role_impl(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_banned_impl(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.user_lookup_impl() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role_impl(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_banned_impl(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.user_lookup_impl() TO authenticated, service_role;

-- public wrappers now run as the caller (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.has_role_impl(_user_id, _role)
$$;

CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.is_banned_impl(_user_id)
$$;

DROP FUNCTION IF EXISTS public.get_user_lookup();
CREATE FUNCTION public.get_user_lookup()
RETURNS TABLE(user_id uuid, display_name text, email text, username text, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM private.user_lookup_impl()
$$;

REVOKE ALL ON FUNCTION public.get_user_lookup() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_lookup() TO authenticated, service_role;

-- trigger functions: definer but not callable by API roles
CREATE OR REPLACE FUNCTION public.append_report_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;
REVOKE ALL ON FUNCTION public.append_report_timeline() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;