alter table strength_sets rename column weight_kg to weight_lbs;
alter table strength_sets add column muscle_group text;
alter table strength_sets add column exercise_id uuid references exercises(id);
