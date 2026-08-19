-- ---------------------------------------------------------------------------
-- Stop users from editing their own usage counter.
--
-- Row level security decides which *rows* a user may touch, not which
-- *columns*. The owner policy on `profiles` therefore let an authenticated
-- user PATCH `generations_used` back to 0 with nothing but their own anon key,
-- which made the free-plan quota advisory rather than enforced.
--
-- Column privileges are the right tool: the role keeps UPDATE on the fields it
-- legitimately owns and loses it everywhere else. The RLS policy still applies
-- on top, so a user can only reach their own row to begin with.
--
-- `generations_used` is now writable only by `increment_generations_used()`
-- (security definer, runs as the owner) and by the service role.
-- ---------------------------------------------------------------------------

revoke update on public.profiles from authenticated, anon;

grant update (full_name, avatar_url, plan) on public.profiles to authenticated;

-- `plan` stays writable because the upgrade flow is a mocked checkout that
-- moves the account itself. Wiring a real payment provider means removing
-- `plan` from this list and having the webhook update it with the service role.
