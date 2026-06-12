-- ============================================================================
-- Important Contacts cleanup helper (run manually after PWA rollout window)
-- ============================================================================

-- NOTE:
-- This migration intentionally does not drop the table immediately to avoid
-- breaking stale PWA clients during service worker upgrade lag.

CREATE OR REPLACE FUNCTION public.drop_deprecated_important_contacts_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
	DROP TABLE IF EXISTS public.important_contacts;
END;
$$;

COMMENT ON FUNCTION public.drop_deprecated_important_contacts_table() IS
	'Manual cleanup helper: execute after all active clients are on static important contacts JSON.';
