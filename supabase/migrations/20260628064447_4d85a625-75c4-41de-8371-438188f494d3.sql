
ALTER VIEW public.public_leaderboard SET (security_invoker = true);
REVOKE EXECUTE ON FUNCTION public.payments_split() FROM PUBLIC, anon, authenticated;
