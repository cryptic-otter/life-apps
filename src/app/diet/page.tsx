import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import DietForm from './DietForm'
import DietEntryList from './DietEntryList'
import { entryMacros, type DietLogEntry, type FoodItem, type MealTemplate } from './types'

export default async function DietPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: rawEntries }, { data: rawFoods }, { data: rawTemplates }] = await Promise.all([
    supabase
      .from('diet_log_entries')
      .select('*, food_item:food_items(id, name, serving_qty, serving_unit, calories, protein_g, carbs_g, fat_g)')
      .eq('date', today)
      .order('created_at', { ascending: true }),
    supabase.from('food_items').select('*').order('name'),
    supabase
      .from('meal_templates')
      .select('*, items:meal_template_items(*, food_item:food_items(id, name, serving_qty, serving_unit, calories, protein_g, carbs_g, fat_g))')
      .order('name'),
  ])

  const entries = (rawEntries ?? []) as DietLogEntry[]
  const foodItems = (rawFoods ?? []) as FoodItem[]
  const mealTemplates = (rawTemplates ?? []) as MealTemplate[]

  const totals = entries.reduce(
    (acc, e) => {
      const m = entryMacros(e)
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  async function addFoodEntry(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const food_item_id = formData.get('food_item_id') as string
    const servings = Number(formData.get('servings')) || 1
    const meal_category = formData.get('meal_category') as string
    const date = (formData.get('date') as string | null) ?? new Date().toISOString().split('T')[0]
    const { data: fi } = await supabase
      .from('food_items')
      .select('name')
      .eq('id', food_item_id)
      .single()
    await supabase.from('diet_log_entries').insert({
      user_id: user.id,
      date,
      meal_category,
      food_item_id,
      food_name: fi?.name ?? '',
      servings,
    })
    revalidatePath('/diet')
  }

  async function addMealEntry(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const meal_category = formData.get('meal_category') as string
    const date = (formData.get('date') as string | null) ?? new Date().toISOString().split('T')[0]
    const itemsJson = formData.get('items') as string
    const items: Array<{
      food_item_id?: string
      food_name: string
      servings: number
      serving_qty?: number | null
      serving_unit?: string | null
      calories?: number | null
      protein_g?: number | null
      carbs_g?: number | null
      fat_g?: number | null
    }> = JSON.parse(itemsJson)

    const libraryIds = items.filter(i => i.food_item_id).map(i => i.food_item_id as string)
    let nameMap: Record<string, string> = {}
    if (libraryIds.length > 0) {
      const { data: fis } = await supabase
        .from('food_items')
        .select('id, name')
        .in('id', libraryIds)
      nameMap = Object.fromEntries(fis?.map(f => [f.id, f.name]) ?? [])
    }

    const rows = items.map(item => ({
      user_id: user.id,
      date,
      meal_category,
      food_item_id: item.food_item_id ?? null,
      food_name: item.food_item_id ? (nameMap[item.food_item_id] ?? item.food_name) : item.food_name,
      servings: item.servings,
      serving_qty: item.food_item_id ? null : (item.serving_qty ?? null),
      serving_unit: item.food_item_id ? null : (item.serving_unit ?? null),
      calories_snap: item.food_item_id ? null : (item.calories ?? null),
      protein_snap: item.food_item_id ? null : (item.protein_g ?? null),
      carbs_snap: item.food_item_id ? null : (item.carbs_g ?? null),
      fat_snap: item.food_item_id ? null : (item.fat_g ?? null),
    }))

    await supabase.from('diet_log_entries').insert(rows)
    revalidatePath('/diet')
  }

  async function updateEntry(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const id = formData.get('id') as string
    const servings = Number(formData.get('servings'))
    const meal_category = formData.get('meal_category') as string
    const new_food_item_id = formData.get('food_item_id') as string | null

    const updates: Record<string, unknown> = { servings, meal_category }
    if (new_food_item_id) {
      const { data: fi } = await supabase
        .from('food_items')
        .select('name')
        .eq('id', new_food_item_id)
        .single()
      updates.food_item_id = new_food_item_id
      updates.food_name = fi?.name ?? ''
      // Clear snapshot fields since this is now a library item
      updates.calories_snap = null
      updates.protein_snap = null
      updates.carbs_snap = null
      updates.fat_snap = null
    }

    await supabase
      .from('diet_log_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
    revalidatePath('/diet')
  }

  async function deleteEntry(id: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('diet_log_entries').delete().eq('id', id)
    revalidatePath('/diet')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Diet</h1>
        <div className="flex gap-4 text-sm">
          <Link
            href="/diet/library"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Library
          </Link>
          <Link
            href="/diet/meals"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Meals
          </Link>
        </div>
      </div>

      {/* Daily totals */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Calories', value: Math.round(totals.calories), unit: 'kcal' },
          { label: 'Protein', value: Math.round(totals.protein), unit: 'g' },
          { label: 'Carbs', value: Math.round(totals.carbs), unit: 'g' },
          { label: 'Fat', value: Math.round(totals.fat), unit: 'g' },
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3 text-center"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-0.5">{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <DietForm
        foodItems={foodItems}
        mealTemplates={mealTemplates}
        addFoodEntry={addFoodEntry}
        addMealEntry={addMealEntry}
        today={today}
      />

      <DietEntryList
        entries={entries}
        foodItems={foodItems}
        updateEntry={updateEntry}
        deleteEntry={deleteEntry}
      />
    </div>
  )
}
