# Data Model

This document describes the Life Apps database schema and how all tables relate to each other.

## Entity Relationship Diagram

```mermaid
erDiagram
    auth_users {
        uuid id PK
    }

    food_items {
        uuid id PK
        uuid user_id FK
        text name
        numeric serving_qty
        text serving_unit
        numeric calories
        numeric protein_g
        numeric carbs_g
        numeric fat_g
        timestamptz created_at
    }

    meal_templates {
        uuid id PK
        uuid user_id FK
        text name
        timestamptz created_at
    }

    meal_template_items {
        uuid id PK
        uuid meal_template_id FK
        uuid food_item_id FK
        text name
        numeric servings
        numeric serving_qty
        text serving_unit
        numeric calories
        numeric protein_g
        numeric carbs_g
        numeric fat_g
        int sort_order
    }

    diet_log_entries {
        uuid id PK
        uuid user_id FK
        date date
        text meal_category
        uuid food_item_id FK
        text food_name
        numeric servings
        numeric serving_qty
        text serving_unit
        numeric calories_snap
        numeric protein_snap
        numeric carbs_snap
        numeric fat_snap
        timestamptz created_at
    }

    diet_entries {
        uuid id PK
        uuid user_id FK
        date date
        text meal
        text food
        int calories
        numeric protein_g
        numeric carbs_g
        numeric fat_g
        timestamptz created_at
    }

    cardio_sessions {
        uuid id PK
        uuid user_id FK
        date date
        text activity
        int duration_minutes
        numeric distance_km
        numeric distance_miles
        numeric planned_miles
        text sleep_quality
        text fuel_level
        int calories
        boolean is_off_plan
        text notes
        timestamptz created_at
    }

    strength_sets {
        uuid id PK
        uuid user_id FK
        date date
        text exercise
        int sets
        int reps
        numeric weight_kg
        text notes
        timestamptz created_at
    }

    auth_users ||--o{ food_items : "owns"
    auth_users ||--o{ meal_templates : "owns"
    auth_users ||--o{ diet_log_entries : "owns"
    auth_users ||--o{ diet_entries : "owns"
    auth_users ||--o{ cardio_sessions : "owns"
    auth_users ||--o{ strength_sets : "owns"
    meal_templates ||--o{ meal_template_items : "contains"
    food_items ||--o{ meal_template_items : "referenced by"
    food_items ||--o{ diet_log_entries : "logged as"
```

## Table Descriptions

| Table | Purpose |
|---|---|
| `food_items` | Reusable food library — nutritional info per serving |
| `meal_templates` | Named collections of foods (e.g. "Pre-swim breakfast") |
| `meal_template_items` | Line items inside a meal template; snapshotted macros allow templates to evolve independently |
| `diet_log_entries` | Daily food log — each row is one food eaten at one meal. Macros are snapshotted at log time so historical records are stable even if `food_items` changes |
| `diet_entries` | **Legacy** — replaced by `diet_log_entries`. Kept for historical data only |
| `cardio_sessions` | One row per swim session; tracks distance, planned vs actual, sleep quality, and fuel level |
| `strength_sets` | One row per exercise per session; tracks sets, reps, and weight |

## Row-Level Security

Every table has RLS enabled with the policy `auth.uid() = user_id`. Users can only ever read and write their own rows.
