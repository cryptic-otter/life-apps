-- Food item library
create table food_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  name         text not null,
  serving_qty  numeric not null,
  serving_unit text not null,
  calories     numeric,
  protein_g    numeric,
  carbs_g      numeric,
  fat_g        numeric,
  created_at   timestamptz default now()
);

alter table food_items enable row level security;
create policy "own_food_items" on food_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Meal templates
create table meal_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  name       text not null,
  created_at timestamptz default now()
);

alter table meal_templates enable row level security;
create policy "own_meal_templates" on meal_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Items within each meal template.
-- food_item_id is null for ad-hoc items typed directly in the template builder.
create table meal_template_items (
  id               uuid primary key default gen_random_uuid(),
  meal_template_id uuid references meal_templates(id) on delete cascade not null,
  food_item_id     uuid references food_items(id) on delete set null,
  name             text,          -- populated only when food_item_id is null (ad-hoc)
  servings         numeric not null default 1,
  serving_qty      numeric,       -- ad-hoc only
  serving_unit     text,          -- ad-hoc only
  calories         numeric,       -- ad-hoc only
  protein_g        numeric,       -- ad-hoc only
  carbs_g          numeric,       -- ad-hoc only
  fat_g            numeric,       -- ad-hoc only
  sort_order       integer not null default 0
);

alter table meal_template_items enable row level security;
create policy "own_meal_template_items" on meal_template_items
  for all
  using (
    exists (
      select 1 from meal_templates mt
      where mt.id = meal_template_items.meal_template_id
        and mt.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from meal_templates mt
      where mt.id = meal_template_items.meal_template_id
        and mt.user_id = auth.uid()
    )
  );

-- New daily log — replaces diet_entries.
-- When food_item_id is set, macros are read live from food_items (retroactive on edit).
-- When food_item_id is null (ad-hoc item from a template), snapshot columns hold the macros.
create table diet_log_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users not null,
  date           date not null default current_date,
  meal_category  text not null,  -- breakfast | lunch | dinner | snack | pre-workout | post-workout
  food_item_id   uuid references food_items(id) on delete set null,
  food_name      text not null,
  servings       numeric not null default 1,
  serving_qty    numeric,        -- snapshot, ad-hoc only
  serving_unit   text,           -- snapshot, ad-hoc only
  calories_snap  numeric,        -- snapshot, ad-hoc only
  protein_snap   numeric,        -- snapshot, ad-hoc only
  carbs_snap     numeric,        -- snapshot, ad-hoc only
  fat_snap       numeric,        -- snapshot, ad-hoc only
  created_at     timestamptz default now()
);

alter table diet_log_entries enable row level security;
create policy "own_diet_log_entries" on diet_log_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Migrate existing diet_entries rows into diet_log_entries as ad-hoc entries
-- so historical data is preserved in the new table.
insert into diet_log_entries (
  id, user_id, date, meal_category,
  food_item_id, food_name, servings,
  calories_snap, protein_snap, carbs_snap, fat_snap,
  created_at
)
select
  id, user_id, date, meal,
  null, food, 1,
  calories, protein_g, carbs_g, fat_g,
  created_at
from diet_entries;
