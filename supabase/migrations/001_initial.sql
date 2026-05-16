create table diet_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null default current_date,
  meal text not null,
  food text not null,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  created_at timestamptz default now()
);

create table strength_sets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null default current_date,
  exercise text not null,
  sets integer not null,
  reps integer not null,
  weight_kg numeric,
  notes text,
  created_at timestamptz default now()
);

create table cardio_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null default current_date,
  activity text not null,
  duration_minutes integer not null,
  distance_km numeric,
  notes text,
  created_at timestamptz default now()
);

alter table diet_entries enable row level security;
alter table strength_sets enable row level security;
alter table cardio_sessions enable row level security;

create policy "own_diet" on diet_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_strength" on strength_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_cardio" on cardio_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
