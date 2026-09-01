REVOKE ALL ON FUNCTION public.enforce_community_rate_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_mentions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_moderation_action() FROM PUBLIC, anon, authenticated;