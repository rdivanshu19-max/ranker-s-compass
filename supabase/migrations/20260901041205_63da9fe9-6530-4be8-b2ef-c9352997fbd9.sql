-- 1) ai_usage: prevent clients from lowering/forging their usage counter
CREATE OR REPLACE FUNCTION public.enforce_ai_usage_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.count IS NULL OR NEW.count <> 1 THEN
      NEW.count := 1;
    END IF;
    NEW.usage_date := CURRENT_DATE;
    RETURN NEW;
  END IF;

  -- UPDATE: only allow +1 increments, no key changes
  IF NEW.user_id <> OLD.user_id OR NEW.feature <> OLD.feature OR NEW.usage_date <> OLD.usage_date THEN
    RAISE EXCEPTION 'ai_usage key columns cannot be modified';
  END IF;
  IF NEW.count <> OLD.count + 1 THEN
    RAISE EXCEPTION 'ai_usage count may only be incremented by 1';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_usage_integrity ON public.ai_usage;
CREATE TRIGGER trg_ai_usage_integrity
BEFORE INSERT OR UPDATE ON public.ai_usage
FOR EACH ROW EXECUTE FUNCTION public.enforce_ai_usage_integrity();

DROP POLICY IF EXISTS "Users can update own ai usage" ON public.ai_usage;
CREATE POLICY "Users can update own ai usage"
ON public.ai_usage FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND NOT is_banned(auth.uid()));

-- 2) feedback: only admins may set/modify admin_reply
CREATE OR REPLACE FUNCTION public.enforce_feedback_admin_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.admin_reply := NULL;
    RETURN NEW;
  END IF;
  IF NEW.admin_reply IS DISTINCT FROM OLD.admin_reply THEN
    RAISE EXCEPTION 'Only admins can set an admin reply';
  END IF;
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Feedback ownership cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_feedback_admin_reply ON public.feedback;
CREATE TRIGGER trg_feedback_admin_reply
BEFORE INSERT OR UPDATE ON public.feedback
FOR EACH ROW EXECUTE FUNCTION public.enforce_feedback_admin_reply();

DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;
CREATE POLICY "Users can update own feedback"
ON public.feedback FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND NOT is_banned(auth.uid()));

-- 3) post_votes: restrict value to -1 / +1
UPDATE public.post_votes SET value = 1 WHERE value > 1;
UPDATE public.post_votes SET value = -1 WHERE value < -1;
DELETE FROM public.post_votes WHERE value = 0;

ALTER TABLE public.post_votes
  ADD CONSTRAINT post_votes_value_check CHECK (value IN (-1, 1));