CREATE TABLE private.mcp_rate_limits (
  user_id uuid PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE private.mcp_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.mcp_rate_limits TO service_role;
CREATE OR REPLACE FUNCTION public.mcp_consume_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  caller_id uuid := auth.uid();
  current_window timestamptz := clock_timestamp();
  current_count integer;
BEGIN
  IF caller_id IS NULL THEN RETURN false; END IF;
  INSERT INTO private.mcp_rate_limits (user_id, window_started_at, request_count, updated_at)
  VALUES (caller_id, current_window, 1, current_window)
  ON CONFLICT (user_id) DO UPDATE
  SET window_started_at = CASE
        WHEN private.mcp_rate_limits.window_started_at <= current_window - interval '1 minute' THEN current_window
        ELSE private.mcp_rate_limits.window_started_at
      END,
      request_count = CASE
        WHEN private.mcp_rate_limits.window_started_at <= current_window - interval '1 minute' THEN 1
        ELSE private.mcp_rate_limits.request_count + 1
      END,
      updated_at = current_window
  RETURNING request_count INTO current_count;
  RETURN current_count <= 60;
END;
$$;
REVOKE ALL ON FUNCTION public.mcp_consume_rate_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mcp_consume_rate_limit() TO authenticated, service_role;