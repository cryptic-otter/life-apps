import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: diet }, { data: strength }, { data: cardio }] = await Promise.all([
    supabase.from('diet_entries').select('calories').eq('date', today),
    supabase.from('strength_sets').select('id').eq('date', today),
    supabase.from('cardio_sessions').select('duration_minutes').eq('date', today),
  ])

  const totalCalories = diet?.reduce((sum, e) => sum + (e.calories ?? 0), 0) ?? 0
  const strengthSets = strength?.length ?? 0
  const cardioMinutes = cardio?.reduce((sum, s) => sum + s.duration_minutes, 0) ?? 0

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Today</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/diet" className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Calories</p>
          <p className="text-3xl font-bold text-gray-900">{totalCalories}</p>
          <p className="text-sm text-gray-400 mt-1">kcal logged today</p>
        </Link>
        <Link href="/strength" className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Strength</p>
          <p className="text-3xl font-bold text-gray-900">{strengthSets}</p>
          <p className="text-sm text-gray-400 mt-1">exercises logged today</p>
        </Link>
        <Link href="/cardio" className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">Cardio</p>
          <p className="text-3xl font-bold text-gray-900">{cardioMinutes}</p>
          <p className="text-sm text-gray-400 mt-1">minutes today</p>
        </Link>
      </div>
    </div>
  )
}
