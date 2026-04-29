-- ProviderPulse Supabase schema
-- Run this once in Supabase SQL Editor after creating a new project.
-- Then add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to GitHub Secrets
-- and as repo variables for the build.

-- ─── subscribers ─────────────────────────────────────────
-- Users sign up to receive email alerts when selected providers have incidents.
create table if not exists public.subscribers (
  id                bigserial primary key,
  email             text not null,
  providers         text[] not null default '{}',
  unsubscribe_token text not null default gen_random_uuid()::text,
  verified          boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (email)
);

create index if not exists idx_subscribers_providers on public.subscribers using gin (providers);

alter table public.subscribers enable row level security;

-- Anonymous users can sign up, but cannot read others' subscriptions.
create policy "anon insert subscribers" on public.subscribers
  for insert to anon with check (true);

-- Service role (used by monitor.mjs) reads everything; anon reads nothing.
-- (No select policy for anon = blocked by default with RLS on.)

-- ─── reports ─────────────────────────────────────────────
-- Community-sourced incident reports. Pending until moderator approves.
create table if not exists public.reports (
  id            bigserial primary key,
  provider_id   text not null,
  incident_type text not null,                -- e.g. 'outage', 'degraded', 'auth', 'rate-limit'
  description   text not null,
  user_email    text,                          -- optional, for follow-up
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now()
);

create index if not exists idx_reports_status on public.reports (status);
create index if not exists idx_reports_provider on public.reports (provider_id);

alter table public.reports enable row level security;

create policy "anon insert reports" on public.reports
  for insert to anon with check (
    char_length(description) between 10 and 2000
    and char_length(provider_id) between 1 and 50
  );

-- Approved reports can be read publicly (community section)
create policy "anon read approved reports" on public.reports
  for select to anon using (status = 'approved');
