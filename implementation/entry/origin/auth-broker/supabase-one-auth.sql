-- Apply once in the Supabase SQL editor for the CAUAI One auth project.
-- Keep tables in the non-exposed private schema. Only narrowly granted RPC functions live in public.
-- Tables contain hashed login tickets, revoked session IDs, replay IDs, and encrypted refresh tokens.
-- This project stores no balances and does not replace New API as account or credit authority.

create schema if not exists private;

create table if not exists private.one_auth_login_tickets (
  ticket_hash text primary key,
  subject text not null,
  email text not null,
  target text not null check (target in ('hb', 'sd2', 'apic')),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create table if not exists private.one_auth_revoked_sessions (
  jti text primary key,
  expires_at timestamptz not null
);

create table if not exists private.one_auth_assertion_replays (
  jti text primary key,
  expires_at timestamptz not null
);

create table if not exists private.one_auth_upstream_sessions (
  jti text primary key,
  encrypted_refresh_token text not null,
  expires_at timestamptz not null
);

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on table
  private.one_auth_login_tickets,
  private.one_auth_revoked_sessions,
  private.one_auth_assertion_replays,
  private.one_auth_upstream_sessions
to service_role;

alter table private.one_auth_login_tickets enable row level security;
alter table private.one_auth_revoked_sessions enable row level security;
alter table private.one_auth_assertion_replays enable row level security;
alter table private.one_auth_upstream_sessions enable row level security;

revoke all on private.one_auth_login_tickets from public, anon, authenticated;
revoke all on private.one_auth_revoked_sessions from public, anon, authenticated;
revoke all on private.one_auth_assertion_replays from public, anon, authenticated;
revoke all on private.one_auth_upstream_sessions from public, anon, authenticated;

create or replace function public.one_auth_create_login_ticket(
  p_ticket_hash text, p_subject text, p_email text, p_target text, p_expires_at timestamptz
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  delete from private.one_auth_login_tickets where expires_at <= pg_catalog.now();
  insert into private.one_auth_login_tickets(ticket_hash, subject, email, target, expires_at)
  values (p_ticket_hash, p_subject, pg_catalog.lower(p_email), p_target, p_expires_at);
  return true;
exception when unique_violation then
  return false;
end;
$$;

create or replace function public.one_auth_consume_login_ticket(
  p_ticket_hash text, p_target text
) returns table(subject text, email text) language sql security invoker set search_path = '' as $$
  update private.one_auth_login_tickets as ticket
  set consumed_at = pg_catalog.now()
  where ticket.ticket_hash = p_ticket_hash and ticket.target = p_target and ticket.consumed_at is null and ticket.expires_at > pg_catalog.now()
  returning ticket.subject, ticket.email;
$$;

create or replace function public.one_auth_is_session_revoked(p_jti text)
returns boolean language sql security invoker set search_path = '' as $$
  select exists (select 1 from private.one_auth_revoked_sessions where jti = p_jti and expires_at > pg_catalog.now());
$$;

create or replace function public.one_auth_revoke_session(p_jti text, p_expires_at timestamptz)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  delete from private.one_auth_revoked_sessions where expires_at <= pg_catalog.now();
  insert into private.one_auth_revoked_sessions as revoked(jti, expires_at)
  values (p_jti, p_expires_at)
  on conflict (jti) do update set expires_at = pg_catalog.greatest(revoked.expires_at, excluded.expires_at);
  return true;
end;
$$;

create or replace function public.one_auth_consume_assertion(p_jti text, p_expires_at timestamptz)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare inserted_jti text;
begin
  delete from private.one_auth_assertion_replays where expires_at <= pg_catalog.now();
  insert into private.one_auth_assertion_replays as replay(jti, expires_at)
  values (p_jti, p_expires_at)
  on conflict (jti) do update set expires_at = excluded.expires_at
  where replay.expires_at <= pg_catalog.now()
  returning jti into inserted_jti;
  return inserted_jti is not null;
end;
$$;

create or replace function public.one_auth_save_upstream_session(
  p_jti text, p_encrypted_refresh_token text, p_expires_at timestamptz
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  delete from private.one_auth_upstream_sessions where expires_at <= pg_catalog.now();
  insert into private.one_auth_upstream_sessions(jti, encrypted_refresh_token, expires_at)
  values (p_jti, p_encrypted_refresh_token, p_expires_at)
  on conflict (jti) do update set encrypted_refresh_token = excluded.encrypted_refresh_token, expires_at = excluded.expires_at;
  return true;
end;
$$;

create or replace function public.one_auth_consume_upstream_session(p_jti text)
returns text language plpgsql security invoker set search_path = '' as $$
declare encrypted_token text;
begin
  delete from private.one_auth_upstream_sessions
  where jti = p_jti and expires_at > pg_catalog.now()
  returning encrypted_refresh_token into encrypted_token;
  return encrypted_token;
end;
$$;

create or replace function public.one_auth_cleanup_expired()
returns void language plpgsql security invoker set search_path = '' as $$
begin
  delete from private.one_auth_login_tickets where expires_at <= pg_catalog.now();
  delete from private.one_auth_revoked_sessions where expires_at <= pg_catalog.now();
  delete from private.one_auth_assertion_replays where expires_at <= pg_catalog.now();
  delete from private.one_auth_upstream_sessions where expires_at <= pg_catalog.now();
end;
$$;

revoke all on function public.one_auth_create_login_ticket(text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.one_auth_consume_login_ticket(text, text) from public, anon, authenticated;
revoke all on function public.one_auth_is_session_revoked(text) from public, anon, authenticated;
revoke all on function public.one_auth_revoke_session(text, timestamptz) from public, anon, authenticated;
revoke all on function public.one_auth_consume_assertion(text, timestamptz) from public, anon, authenticated;
revoke all on function public.one_auth_save_upstream_session(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.one_auth_consume_upstream_session(text) from public, anon, authenticated;
revoke all on function public.one_auth_cleanup_expired() from public, anon, authenticated;
grant execute on function public.one_auth_create_login_ticket(text, text, text, text, timestamptz) to service_role;
grant execute on function public.one_auth_consume_login_ticket(text, text) to service_role;
grant execute on function public.one_auth_is_session_revoked(text) to service_role;
grant execute on function public.one_auth_revoke_session(text, timestamptz) to service_role;
grant execute on function public.one_auth_consume_assertion(text, timestamptz) to service_role;
grant execute on function public.one_auth_save_upstream_session(text, text, timestamptz) to service_role;
grant execute on function public.one_auth_consume_upstream_session(text) to service_role;
grant execute on function public.one_auth_cleanup_expired() to service_role;
