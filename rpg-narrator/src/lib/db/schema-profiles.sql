-- ============================================================
-- RPG Narrator — Profiles & User-Character Integration
-- Run after supabase-schema.sql
-- ============================================================

-- User profiles (synced from auth on first login)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  email text,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Anyone can read profiles (for Hall of Fame)
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Service role / trigger can insert (see trigger below)
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Add created_by to campaigns (who created it)
alter table campaigns add column if not exists created_by uuid references auth.users(id) on delete set null;
create index if not exists idx_campaigns_created_by on campaigns(created_by);

-- Add owner_id to characters (who owns this character — sees it in profile)
alter table characters add column if not exists owner_id uuid references auth.users(id) on delete set null;
create index if not exists idx_characters_owner on characters(owner_id);

-- RLS for campaigns: everyone can read (shared), authenticated can create
alter table campaigns enable row level security;
create policy "Campaigns readable by all" on campaigns for select using (true);
create policy "Authenticated can create campaigns" on campaigns for insert with check (auth.role() = 'authenticated');
create policy "Creator can update own campaign" on campaigns for update using (auth.uid() = created_by or created_by is null);
create policy "Creator can delete own campaign" on campaigns for delete using (auth.uid() = created_by or created_by is null);

-- RLS for characters: owner sees in profile; campaign members see in campaign context
alter table characters enable row level security;
-- All can read characters (for campaigns + hall of fame)
create policy "Characters readable by all" on characters for select using (true);
create policy "Authenticated can create characters" on characters for insert with check (auth.role() = 'authenticated');
create policy "Owner can update character" on characters for update using (auth.uid() = owner_id or owner_id is null);
create policy "Owner can delete character" on characters for delete using (auth.uid() = owner_id or owner_id is null);

-- Trigger: create/update profile on sign-up (optional — API upsert also works)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url, email, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    now()
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    last_seen_at = now(),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
