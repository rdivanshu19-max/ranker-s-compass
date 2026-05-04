-- 1) Mark column for unread receipts
ALTER TABLE public.astra_chat_history
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 2) Admin/mod searchable user directory (with email)
CREATE OR REPLACE FUNCTION public.get_user_lookup()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  email text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, u.email, p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'moderator'::app_role)
$$;

GRANT EXECUTE ON FUNCTION public.get_user_lookup() TO authenticated;