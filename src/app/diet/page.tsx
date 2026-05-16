import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import DietForm from './DietForm'

export default async function DietPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: entries } = await supabase
    .from('diet_entries')
    .select('*')
    .eq('date', today)
    .order('created_at', { ascending: true })

  const totalCalories = entries?.reduce((sum, e) => sum + (e.calories ?? 0), 0) ?? 0
  const totalProtein = entries?.reduce((sum, e) => sum + (e.protein_g ?? 0), 0) ?? 0

  async function addEntry(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('diet_entries').insert({
      user_id: user.id,
      date: today,
      meal: formData.get('meal'),
      food: formData.get('food'),
      calories: Number(formData.get('calories')) || null,
      protein_g: Number(formData.get('protein')) || null,
      carbs_g: Number(formData.get('carbs')) || null,
      fat_g: Number(formData.get('fat')) || null,
    })
    revalidatePath('/diet')
  }

  async function deleteEntry(id: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('diet_entries').delete().eq('id', id)
    revalidatePath('/diet')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Diet</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalCalories} kcal &middot; {totalProtein}g protein today
        </p>
      </div>

      <DietForm addEntry={addEntry} />

      <div className="mt-6 space-y-2">
        {entries?.map(entry => (
          <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mr-2">
                {entry.meal}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.food}</span>
              {entry.calories != null && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{entry.calories} kcal</span>
              )}
              {entry.protein_g != null && (
                <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">&middot; {entry.protein_g}g P</span>
              )}
              {entry.carbs_g != null && (
                <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">&middot; {entry.carbs_g}g C</span>
              )}
              {entry.fat_g != null && (
                <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">&middot; {entry.fat_g}g F</span>
              )}
            </div>
            <form action={deleteEntry.bind(null, entry.id)}>
              <button type="submit" className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none px-1">
                &times;
              </button>
            </form>
          </div>
        ))}
        {(!entries || entries.length === 0) && (
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-12">No food logged today.</p>
        )}
      </div>
    </div>
  )
}
