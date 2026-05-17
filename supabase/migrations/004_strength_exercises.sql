create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  muscle_group text not null,
  created_at timestamptz default now()
);
alter table exercises enable row level security;
create policy "users manage own exercises" on exercises
  for all using (auth.uid() = user_id);
