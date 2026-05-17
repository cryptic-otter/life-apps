create table meal_plan_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users not null,
  date           date not null,
  meal_category  text not null,
  note           text,
  is_covered     boolean not null default false,
  created_at     timestamptz default now(),
  unique (user_id, date, meal_category)
);

alter table meal_plan_entries enable row level security;
create policy "own_meal_plan_entries" on meal_plan_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
