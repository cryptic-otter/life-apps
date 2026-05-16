import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import CardioForm from './CardioForm'

export default async function CardioPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: sessions } = await supabase
    .from('cardio_sessions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  const todayMinutes = (sessions ?? [])
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + s.duration_minutes, 0)

  async function addSession(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('cardio_sessions').insert({
      user_id: user.id,
      date: (formData.get('date') as string) || today,
      activity: formData.get('activity'),
      duration_minutes: Number(formData.get('duration')),
      distance_km: Number(formData.get('distance')) || null,
      notes: (formData.get('notes') as string) || null,
    })
    revalidatePath('/cardio')
  }

  async function deleteSession(id: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('cardio_sessions').delete().eq('id', id)
    revalidatePath('/cardio')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Cardio</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{todayMinutes} min today</p>
      </div>

      <CardioForm addSession={addSession} />

      <div className="mt-6 space-y-2">
        {sessions?.map(session => (
          <div key={session.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">{session.date}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.activity}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{session.duration_minutes} min</span>
              {session.distance_km != null && (
                <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">&middot; {session.distance_km} km</span>
              )}
              {session.notes && (
                <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">&middot; {session.notes}</span>
              )}
            </div>
            <form action={deleteSession.bind(null, session.id)}>
              <button type="submit" className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none px-1">
                &times;
              </button>
            </form>
          </div>
        ))}
        {(!sessions || sessions.length === 0) && (
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-12">No cardio sessions logged yet.</p>
        )}
      </div>
    </div>
  )
}
