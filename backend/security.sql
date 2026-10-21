-- Run once in the Supabase SQL Editor for the existing public.users table.
-- The Express server is the only component that should access private rows.
begin;
alter table public.users enable row level security;
revoke all on table public.users from public, anon, authenticated;
grant select, insert, update, delete on table public.users to service_role;
commit;
