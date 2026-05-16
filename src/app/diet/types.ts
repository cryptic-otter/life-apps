export type MealCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre-workout'
  | 'post-workout'

export const MEAL_CATEGORIES: { value: MealCategory; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'pre-workout', label: 'Pre-workout' },
  { value: 'post-workout', label: 'Post-workout' },
]

export interface FoodItem {
  id: string
  user_id: string
  name: string
  serving_qty: number
  serving_unit: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  created_at: string
}

export interface MealTemplateItem {
  id: string
  meal_template_id: string
  food_item_id: string | null
  name: string | null
  servings: number
  serving_qty: number | null
  serving_unit: string | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  sort_order: number
  food_item?: FoodItem | null
}

export interface MealTemplate {
  id: string
  user_id: string
  name: string
  created_at: string
  items?: MealTemplateItem[]
}

export interface DietLogEntry {
  id: string
  user_id: string
  date: string
  meal_category: MealCategory
  food_item_id: string | null
  food_name: string
  servings: number
  serving_qty: number | null
  serving_unit: string | null
  calories_snap: number | null
  protein_snap: number | null
  carbs_snap: number | null
  fat_snap: number | null
  created_at: string
  food_item?: FoodItem | null
}

/** Compute macros for a single log entry at the given serving count (defaults to entry.servings). */
export function entryMacros(entry: DietLogEntry, servings?: number) {
  const s = servings ?? entry.servings
  const fi = entry.food_item
  if (fi) {
    return {
      calories: (fi.calories ?? 0) * s,
      protein: (fi.protein_g ?? 0) * s,
      carbs: (fi.carbs_g ?? 0) * s,
      fat: (fi.fat_g ?? 0) * s,
    }
  }
  return {
    calories: (entry.calories_snap ?? 0) * s,
    protein: (entry.protein_snap ?? 0) * s,
    carbs: (entry.carbs_snap ?? 0) * s,
    fat: (entry.fat_snap ?? 0) * s,
  }
}
