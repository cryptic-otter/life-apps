import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import MealsForm from './MealsForm'
import type { FoodItem, MealTemplate } from '../types'

type TemplateItemInput = {
  food_item_id?: string | null
  name?: string | null
  servings: number
  serving_qty?: number | null
  serving_unit?: string | null
  calories?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
}

export default async function MealsPage() {
  const supabase = await createClient()

  const [{ data: rawTemplates }, { data: rawFoods }] = await Promise.all([
    supabase
      .from('meal_templates')
      .select(
        '*, items:meal_template_items(*, food_item:food_items(id, name, serving_qty, serving_unit, calories, protein_g, carbs_g, fat_g))'
      )
      .order('name'),
    supabase.from('food_items').select('*').order('name'),
  ])

  const templates = (rawTemplates ?? []) as MealTemplate[]
  const foodItems = (rawFoods ?? []) as FoodItem[]

  async function addTemplate(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const name = (formData.get('name') as string).trim()
    const items: TemplateItemInput[] = JSON.parse(formData.get('items') as string)

    const { data: template } = await supabase
      .from('meal_templates')
      .insert({ user_id: user.id, name })
      .select()
      .single()

    if (template && items.length > 0) {
      await supabase.from('meal_template_items').insert(
        items.map((item, idx) => ({
          meal_template_id: template.id,
          food_item_id: item.food_item_id ?? null,
          name: item.food_item_id ? null : (item.name ?? null),
          servings: item.servings,
          serving_qty: item.food_item_id ? null : (item.serving_qty ?? null),
          serving_unit: item.food_item_id ? null : (item.serving_unit ?? null),
          calories: item.food_item_id ? null : (item.calories ?? null),
          protein_g: item.food_item_id ? null : (item.protein_g ?? null),
          carbs_g: item.food_item_id ? null : (item.carbs_g ?? null),
          fat_g: item.food_item_id ? null : (item.fat_g ?? null),
          sort_order: idx,
        }))
      )
    }
    revalidatePath('/diet/meals')
    revalidatePath('/diet')
  }

  async function updateTemplate(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const id = formData.get('id') as string
    const name = (formData.get('name') as string).trim()
    const items: TemplateItemInput[] = JSON.parse(formData.get('items') as string)

    await supabase
      .from('meal_templates')
      .update({ name })
      .eq('id', id)
      .eq('user_id', user.id)

    // Replace all items
    await supabase.from('meal_template_items').delete().eq('meal_template_id', id)
    if (items.length > 0) {
      await supabase.from('meal_template_items').insert(
        items.map((item, idx) => ({
          meal_template_id: id,
          food_item_id: item.food_item_id ?? null,
          name: item.food_item_id ? null : (item.name ?? null),
          servings: item.servings,
          serving_qty: item.food_item_id ? null : (item.serving_qty ?? null),
          serving_unit: item.food_item_id ? null : (item.serving_unit ?? null),
          calories: item.food_item_id ? null : (item.calories ?? null),
          protein_g: item.food_item_id ? null : (item.protein_g ?? null),
          carbs_g: item.food_item_id ? null : (item.carbs_g ?? null),
          fat_g: item.food_item_id ? null : (item.fat_g ?? null),
          sort_order: idx,
        }))
      )
    }
    revalidatePath('/diet/meals')
    revalidatePath('/diet')
  }

  async function deleteTemplate(id: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('meal_templates').delete().eq('id', id)
    revalidatePath('/diet/meals')
    revalidatePath('/diet')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/diet"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          >
            ← Diet
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Meal Templates</h1>
        </div>
        <Link
          href="/diet/library"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          ← Food Library
        </Link>
      </div>

      <MealsForm
        templates={templates}
        foodItems={foodItems}
        addTemplate={addTemplate}
        updateTemplate={updateTemplate}
        deleteTemplate={deleteTemplate}
      />
    </div>
  )
}
