import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: diet }, { data: strength }, { data: cardio }] = await Promise.all([
    supabase
      .from('diet_log_entries')
      .select('servings, calories_snap, food_item:food_items(calories)')
      .eq('date', today),
    supabase.from('strength_sets').select('id').eq('date', today),
    supabase.from('cardio_sessions').select('duration_minutes').eq('date', today),
  ])

  const totalCalories = Math.round(
    (diet as unknown as Array<{ servings: number; calories_snap: number | null; food_item: { calories: number | null } | null }>)
      ?.reduce((sum, e) => {
        const cal = e.food_item ? (e.food_item.calories ?? 0) : (e.calories_snap ?? 0)
        return sum + cal * (e.servings ?? 1)
      }, 0) ?? 0
  )
  const strengthSets = strength?.length ?? 0
  const cardioMinutes = cardio?.reduce((sum, s) => sum + s.duration_minutes, 0) ?? 0

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Today</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/diet" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Calories</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCalories}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">kcal logged today</p>
        </Link>
        <Link href="/strength" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Strength</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{strengthSets}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">exercises logged today</p>
        </Link>
        <Link href="/cardio" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cardio</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{cardioMinutes}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">minutes today</p>
        </Link>
      </div>
    </div>
  )
}
