import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import LibraryForm from './LibraryForm'
import type { FoodItem } from '../types'

export default async function LibraryPage() {
  const supabase = await createClient()

  const { data: rawItems } = await supabase
    .from('food_items')
    .select('*')
    .order('name')

  const foodItems = (rawItems ?? []) as FoodItem[]

  async function addFoodItem(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('food_items').insert({
      user_id: user.id,
      name: (formData.get('name') as string).trim(),
      serving_qty: Number(formData.get('serving_qty')),
      serving_unit: (formData.get('serving_unit') as string).trim(),
      calories: Number(formData.get('calories')) || null,
      protein_g: Number(formData.get('protein_g')) || null,
      carbs_g: Number(formData.get('carbs_g')) || null,
      fat_g: Number(formData.get('fat_g')) || null,
    })
    revalidatePath('/diet/library')
  }

  async function updateFoodItem(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('food_items')
      .update({
        name: (formData.get('name') as string).trim(),
        serving_qty: Number(formData.get('serving_qty')),
        serving_unit: (formData.get('serving_unit') as string).trim(),
        calories: Number(formData.get('calories')) || null,
        protein_g: Number(formData.get('protein_g')) || null,
        carbs_g: Number(formData.get('carbs_g')) || null,
        fat_g: Number(formData.get('fat_g')) || null,
      })
      .eq('id', formData.get('id') as string)
      .eq('user_id', user.id)
    // Revalidate both pages because macros are read live from food_items
    revalidatePath('/diet/library')
    revalidatePath('/diet')
  }

  async function deleteFoodItem(id: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('food_items').delete().eq('id', id)
    revalidatePath('/diet/library')
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Food Library</h1>
        </div>
        <Link
          href="/diet/meals"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Meal Templates →
        </Link>
      </div>

      <LibraryForm
        foodItems={foodItems}
        addFoodItem={addFoodItem}
        updateFoodItem={updateFoodItem}
        deleteFoodItem={deleteFoodItem}
      />
    </div>
  )
}
