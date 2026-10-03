CREATE TABLE public.mathango_unlocks (
  user_id uuid PRIMARY KEY,
  unlocked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mathango_unlocks TO authenticated;
GRANT ALL ON public.mathango_unlocks TO service_role;
ALTER TABLE public.mathango_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own mathango unlock" ON public.mathango_unlocks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.redeem_mathango_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF upper(trim(_code)) <> 'GCDITSUPRE' THEN RETURN false; END IF;
  INSERT INTO public.mathango_unlocks (user_id) VALUES (auth.uid()) ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.redeem_mathango_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_mathango_code(text) TO authenticated;