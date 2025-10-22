-- Schema definitions for TTRPG Companion App
-- This file declares the desired schema state for Supabase migrations

-- enable uuid extension
create extension if not exists "uuid-ossp";

-- sessions table
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  gm_id uuid references auth.users(id) on delete set null,
  name text not null,
  showing text not null default 'lobby',
  active_image_url text,
  teaser_text text,
  active_turn_character_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- premade_characters table
create table public.premade_characters (
  id uuid primary key default uuid_generate_v4(),
  gm_id uuid references auth.users(id) on delete cascade,
  name text not null,
  portrait_url text,
  stats_json jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- session_characters table
create table public.session_characters (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.sessions(id) on delete cascade,
  name text not null,
  portrait_url text,
  is_premade boolean default false,
  character_type text default 'player',
  initiative_modifier integer default 0,
  initiative_roll integer,
  hand_raised boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- session_assets table
create table public.session_assets (
  id uuid primary key default uuid_generate_v4(),
  gm_id uuid references auth.users(id) on delete cascade,
  asset_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  public_url text,
  friendly_name text,
  created_at timestamptz default now()
);

-- indexes
create index idx_sessions_gm_id on public.sessions (gm_id);
create index idx_premade_gm_id on public.premade_characters (gm_id);
create index idx_session_characters_session_id on public.session_characters (session_id);

-- timestamps trigger function
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- timestamps triggers
create trigger touch_sessions_updated_at
  before update on public.sessions
  for each row execute function public.touch_updated_at();

create trigger touch_premade_updated_at
  before update on public.premade_characters
  for each row execute function public.touch_updated_at();

create trigger touch_session_characters_updated_at
  before update on public.session_characters
  for each row execute function public.touch_updated_at();

-- enable RLS on tables
alter table public.sessions enable row level security;
alter table public.premade_characters enable row level security;
alter table public.session_characters enable row level security;
alter table public.session_assets enable row level security;

-- RLS policies
create policy "sessions_owner" on public.sessions
  for all using (gm_id = auth.uid());

create policy "characters_owner" on public.premade_characters
  for all using (gm_id = auth.uid());

create policy "session_characters_public_read" on public.session_characters
  for select using (true);

create policy "session_characters_owner_write" on public.session_characters
  for insert with check (true);

create policy "assets_public_read" on public.session_assets
  for select using (true);

create policy "assets_owner_write" on public.session_assets
  for all using (gm_id = auth.uid())
  with check (gm_id = auth.uid());