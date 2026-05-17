import MermaidDiagram from './MermaidDiagram'

const ERD = `
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
    }

    meal_templates {
        uuid id PK
        uuid user_id FK
        text name
    }

    meal_template_items {
        uuid id PK
        uuid meal_template_id FK
        uuid food_item_id FK
        text name
        numeric servings
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
        numeric calories_snap
        numeric protein_snap
        numeric carbs_snap
        numeric fat_snap
    }

    diet_entries {
        uuid id PK
        uuid user_id FK
        date date
        text meal
        text food
        int calories
        numeric protein_g
    }

    cardio_sessions {
        uuid id PK
        uuid user_id FK
        date date
        text activity
        int duration_minutes
        numeric distance_miles
        numeric planned_miles
        text sleep_quality
        text fuel_level
        boolean is_off_plan
    }

    exercises {
        uuid id PK
        uuid user_id FK
        text name
        text muscle_group
    }

    strength_sets {
        uuid id PK
        uuid user_id FK
        date date
        text exercise
        uuid exercise_id FK
        text muscle_group
        int sets
        int reps
        numeric weight_lbs
    }

    meal_plan_entries {
        uuid id PK
        uuid user_id FK
        date date
        text meal_category
        text note
        boolean is_covered
    }

    auth_users ||--o{ food_items : "owns"
    auth_users ||--o{ meal_templates : "owns"
    auth_users ||--o{ diet_log_entries : "owns"
    auth_users ||--o{ diet_entries : "owns"
    auth_users ||--o{ cardio_sessions : "owns"
    auth_users ||--o{ exercises : "owns"
    auth_users ||--o{ strength_sets : "owns"
    auth_users ||--o{ meal_plan_entries : "owns"
    meal_templates ||--o{ meal_template_items : "contains"
    food_items ||--o{ meal_template_items : "referenced by"
    food_items ||--o{ diet_log_entries : "logged as"
    exercises ||--o{ strength_sets : "logged as"
`

const tables = [
  {
    name: 'food_items',
    description: 'Reusable food library — nutritional info per serving.',
  },
  {
    name: 'meal_templates',
    description: 'Named collections of foods (e.g. "Pre-swim breakfast").',
  },
  {
    name: 'meal_template_items',
    description:
      'Line items inside a meal template. Macros are snapshotted so templates can be edited without affecting historical logs.',
  },
  {
    name: 'diet_log_entries',
    description:
      'Daily food log — one row per food per meal. Macros are snapshotted at log time so history is stable even if the food library changes.',
  },
  {
    name: 'diet_entries',
    badge: 'legacy',
    description: 'Original diet log. Superseded by diet_log_entries; kept for historical data.',
  },
  {
    name: 'cardio_sessions',
    description:
      'One row per swim session. Tracks actual vs planned distance, sleep quality, and fuel level.',
  },
  {
    name: 'exercises',
    description: 'Exercise library — reusable exercises tagged with a muscle group (back, bis, chest, tris, shoulders, legs).',
  },
  {
    name: 'strength_sets',
    description: 'One row per set per session. Tracks exercise, muscle group, sets, reps, and weight in lbs.',
  },
  {
    name: 'meal_plan_entries',
    description:
      'Weekly meal coverage plan — one row per meal slot per day. Tracks whether each meal is sorted for the week. Slots already logged in diet_log_entries are auto-marked covered at display time.',
  },
]

export default function SchemaPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Data Model</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Live schema — all tables, columns, and relationships.
        </p>
      </div>

      <MermaidDiagram chart={ERD} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Table descriptions
        </h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Table
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tables.map((t) => (
                <tr key={t.name} className="bg-white dark:bg-gray-900">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-800 dark:text-gray-200">
                    {t.name}
                    {t.badge && (
                      <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                        {t.badge}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600">
        Row-level security is enabled on every table.{' '}
        <code className="font-mono">auth.uid() = user_id</code> — users only ever see their own
        rows.
      </p>
    </div>
  )
}
