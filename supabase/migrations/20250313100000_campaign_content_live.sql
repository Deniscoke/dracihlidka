-- ============================================================
-- Live party room — obsah kampane v Supabase + Realtime
-- ============================================================

-- Narrácie
create table if not exists narrations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  mode text not null default 'ai' check (mode in ('mock', 'ai')),
  user_input text not null default '',
  narration_text text not null default '',
  suggested_actions text[] default '{}',
  consequences jsonb,
  created_at timestamptz default now()
);

-- Postavy v kampani
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  race text default '',
  class text default '',
  specialization text,
  gender text,
  level int not null default 1,
  hp int,
  max_hp int,
  xp int,
  stats jsonb not null default '{}',
  statuses text[] default '{}',
  injuries text[] default '{}',
  inventory text[] default '{}',
  notes text default '',
  is_npc boolean not null default false,
  portrait_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sedenia
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title text not null default '',
  summary text default '',
  date date default current_date,
  "order" int default 0,
  created_at timestamptz default now()
);

-- Stav kampane (location, scene, memory_summary…)
create table if not exists campaign_states (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null unique references campaigns(id) on delete cascade,
  location text,
  scene text,
  party text[] default '{}',
  npcs text[] default '{}',
  threads text[] default '{}',
  flags jsonb default '{}',
  tone text,
  last_beats text[] default '{}',
  last_phrases text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Memory entries (notes, lore…)
create table if not exists memory_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  type text not null default 'note' check (type in ('note', 'event', 'lore', 'quest')),
  title text not null default '',
  content text default '',
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- Indexy
create index if not exists idx_narrations_campaign on narrations(campaign_id);
create index if not exists idx_characters_campaign on characters(campaign_id);
create index if not exists idx_sessions_campaign on sessions(campaign_id);
create index if not exists idx_memory_campaign on memory_entries(campaign_id);

-- RLS — len členovia kampane môžu čítať a písať
create policy "Members read narrations"
  on narrations for select using (
    auth.uid() in (select user_id from campaign_members where campaign_id = narrations.campaign_id)
  );
create policy "Members insert narrations"
  on narrations for insert with check (
    auth.uid() in (select user_id from campaign_members where campaign_id = narrations.campaign_id)
  );
create policy "Members update narrations"
  on narrations for update using (
    auth.uid() in (select user_id from campaign_members where campaign_id = narrations.campaign_id)
  );
create policy "Members delete narrations"
  on narrations for delete using (
    auth.uid() in (select user_id from campaign_members where campaign_id = narrations.campaign_id)
  );

create policy "Members read characters"
  on characters for select using (
    auth.uid() in (select user_id from campaign_members where campaign_id = characters.campaign_id)
  );
create policy "Members insert characters"
  on characters for insert with check (
    auth.uid() in (select user_id from campaign_members where campaign_id = characters.campaign_id)
  );
create policy "Members update characters"
  on characters for update using (
    auth.uid() in (select user_id from campaign_members where campaign_id = characters.campaign_id)
  );
create policy "Members delete characters"
  on characters for delete using (
    auth.uid() in (select user_id from campaign_members where campaign_id = characters.campaign_id)
  );

create policy "Members read sessions"
  on sessions for select using (
    auth.uid() in (select user_id from campaign_members where campaign_id = sessions.campaign_id)
  );
create policy "Members insert sessions"
  on sessions for insert with check (
    auth.uid() in (select user_id from campaign_members where campaign_id = sessions.campaign_id)
  );
create policy "Members update sessions"
  on sessions for update using (
    auth.uid() in (select user_id from campaign_members where campaign_id = sessions.campaign_id)
  );
create policy "Members delete sessions"
  on sessions for delete using (
    auth.uid() in (select user_id from campaign_members where campaign_id = sessions.campaign_id)
  );

create policy "Members read campaign_states"
  on campaign_states for select using (
    auth.uid() in (select user_id from campaign_members where campaign_id = campaign_states.campaign_id)
  );
create policy "Members insert campaign_states"
  on campaign_states for insert with check (
    auth.uid() in (select user_id from campaign_members where campaign_id = campaign_states.campaign_id)
  );
create policy "Members update campaign_states"
  on campaign_states for update using (
    auth.uid() in (select user_id from campaign_members where campaign_id = campaign_states.campaign_id)
  );

create policy "Members read memory_entries"
  on memory_entries for select using (
    auth.uid() in (select user_id from campaign_members where campaign_id = memory_entries.campaign_id)
  );
create policy "Members insert memory_entries"
  on memory_entries for insert with check (
    auth.uid() in (select user_id from campaign_members where campaign_id = memory_entries.campaign_id)
  );
create policy "Members update memory_entries"
  on memory_entries for update using (
    auth.uid() in (select user_id from campaign_members where campaign_id = memory_entries.campaign_id)
  );
create policy "Members delete memory_entries"
  on memory_entries for delete using (
    auth.uid() in (select user_id from campaign_members where campaign_id = memory_entries.campaign_id)
  );

alter table narrations enable row level security;
alter table characters enable row level security;
alter table sessions enable row level security;
alter table campaign_states enable row level security;
alter table memory_entries enable row level security;

-- Povolenie Realtime pre live updates
alter publication supabase_realtime add table narrations;
alter publication supabase_realtime add table characters;
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table campaign_states;
