import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import StrengthForm from './StrengthForm'

export default async function StrengthPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: entries } = await supabase
    .from('strength_sets')
    .select('*')
    .eq('date', today)
    .order('created_at', { ascending: true })

  const byExercise = (entries ?? []).reduce<Record<string, typeof entries>>((acc, entry) => {
    if (!acc[entry.exercise]) acc[entry.exercise] = []
    acc[entry.exercise]!.push(entry)
    return acc
  }, {})

  async function addEntry(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('strength_sets').insert({
      user_id: user.id,
      date: today,
      exercise: formData.get('exercise'),
      sets: Number(formData.get('sets')),
      reps: Number(formData.get('reps')),
      weight_kg: Number(formData.get('weight')) || null,
      notes: (formData.get('notes') as string) || null,
    })
    revalidatePath('/strength')
  }

  async function deleteEntry(id: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('strength_sets').delete().eq('id', id)
    revalidatePath('/strength')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Strength</h1>
        <p className="text-sm text-gray-500">{entries?.length ?? 0} exercises today</p>
      </div>

      <StrengthForm addEntry={addEntry} />

      <div className="mt-6 space-y-4">
        {Object.entries(byExercise).map(([exercise, sets]) => (
          <div key={exercise} className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">{exercise}</h3>
            <div className="space-y-2">
              {sets!.map(entry => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {entry.sets} &times; {entry.reps} reps
                    {entry.weight_kg ? ` @ ${entry.weight_kg} kg` : ''}
                  </span>
                  {entry.notes && <span className="text-gray-400 text-xs mx-2">{entry.notes}</span>}
                  <form action={deleteEntry.bind(null, entry.id)}>
                    <button type="submit" className="text-gray-300 hover:text-red-500 text-lg leading-none px-1">
                      &times;
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(byExercise).length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">No exercises logged today.</p>
        )}
      </div>
    </div>
  )
}
