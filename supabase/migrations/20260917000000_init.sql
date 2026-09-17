-- Supabase initial migration for CampusFind
-- Mirrors schema.sql

create extension if not exists "uuid-ossp";

create table if not exists campuses (
  slug text primary key,
  name text not null,
  institution_type text not null check (institution_type in ('college', 'university', 'school', 'other')),
  city text not null,
  status text not null check (status in ('pending_approval', 'approved', 'suspended')),
  contact_email text not null,
  contact_phone text not null,
  desk_pin text not null default '1234',
  centroid_lat double precision not null,
  centroid_lng double precision not null,
  fence_m integer not null default 700,
  places jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists idx_campuses_status on campuses (status);

create table if not exists users (
  id text primary key default uuid_generate_v4()::text,
  phone text unique,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key default uuid_generate_v4()::text,
  user_id text references users(id) on delete set null,
  campus_slug text not null references campuses(slug) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_sessions_campus on sessions (campus_slug);
create index if not exists idx_sessions_user on sessions (user_id);

create table if not exists otp_challenges (
  id text primary key default uuid_generate_v4()::text,
  target text not null,
  code text not null,
  session_id text not null references sessions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_otp_challenges_target on otp_challenges (target);

create table if not exists items (
  id text primary key default uuid_generate_v4()::text,
  campus_slug text not null references campuses(slug) on delete cascade,
  type text not null check (type in ('lost', 'found')),
  status text not null check (status in ('open', 'pending_claim', 'recovered', 'expired', 'desk', 'hidden')),
  title text not null,
  category text not null,
  color text,
  brand text,
  tags text[] not null default '{}',
  caption text,
  description text,
  distinctive text,
  photo_path text,
  lat double precision not null,
  lng double precision not null,
  accuracy_m integer,
  place_id text,
  place_label text,
  source text not null check (source in ('gps_snap', 'gps_raw', 'picked', 'dragged')),
  floor integer,
  note text,
  secret_hash text,
  poster_session_id text not null references sessions(id) on delete cascade,
  poster_user_id text references users(id) on delete set null,
  claim_count integer not null default 0,
  match_ids text[] not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_items_campus_status on items (campus_slug, status);
create index if not exists idx_items_campus_type on items (campus_slug, type);
create index if not exists idx_items_created_at on items (created_at desc);
create index if not exists idx_items_lat_lng on items (lat, lng);
create index if not exists idx_items_tags on items using gin (tags);

create table if not exists claims (
  id text primary key default uuid_generate_v4()::text,
  campus_slug text not null references campuses(slug) on delete cascade,
  item_id text not null references items(id) on delete cascade,
  claimant_user_id text not null references users(id) on delete cascade,
  message text,
  secret_attempt_ok boolean not null default false,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_claims_campus_item on claims (campus_slug, item_id);
create index if not exists idx_claims_claimant on claims (claimant_user_id);

create table if not exists reports (
  id text primary key default uuid_generate_v4()::text,
  campus_slug text not null references campuses(slug) on delete cascade,
  item_id text not null references items(id) on delete cascade,
  session_id text not null references sessions(id) on delete cascade,
  reason text not null check (reason in ('spam', 'inappropriate', 'wrong', 'other')),
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_item on reports (item_id);

alter table campuses enable row level security;
alter table items enable row level security;
alter table claims enable row level security;
alter table sessions enable row level security;
alter table users enable row level security;
alter table otp_challenges enable row level security;
alter table reports enable row level security;

create policy "Public can view approved campuses"
  on campuses for select
  using (status = 'approved');

create policy "Service role has full access to campuses"
  on campuses for all
  using (auth.role() = 'service_role');

create policy "Service role has full access to items"
  on items for all
  using (auth.role() = 'service_role');

create policy "Service role has full access to claims"
  on claims for all
  using (auth.role() = 'service_role');

create policy "Service role has full access to sessions"
  on sessions for all
  using (auth.role() = 'service_role');

create policy "Service role has full access to users"
  on users for all
  using (auth.role() = 'service_role');

create policy "Service role has full access to otp_challenges"
  on otp_challenges for all
  using (auth.role() = 'service_role');

create policy "Service role has full access to reports"
  on reports for all
  using (auth.role() = 'service_role');

create or replace view public_items as
  select
    id,
    campus_slug,
    type,
    status,
    title,
    category,
    color,
    brand,
    tags,
    caption,
    description,
    distinctive,
    photo_path,
    lat,
    lng,
    accuracy_m,
    place_id,
    place_label,
    source,
    floor,
    note,
    claim_count,
    match_ids,
    expires_at,
    created_at,
    updated_at
  from items
  where status != 'hidden';
