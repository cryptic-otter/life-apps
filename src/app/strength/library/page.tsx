import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import ExerciseLibraryForm from './ExerciseLibraryForm'
import { MUSCLE_GROUPS } from '../schedule'

export type Exercise = {
  id: string
  name: string
  muscle_group: string
  created_at: string
}

export default async function ExerciseLibraryPage() {
  const supabase = await createClient()

  const { data: rawExercises } = await supabase
    .from('exercises')
    .select('*')
    .order('muscle_group')
    .order('name')

  const exercises = (rawExercises ?? []) as Exercise[]

  async function addExercise(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('exercises').insert({
      user_id: user.id,
      name: (formData.get('name') as string).trim(),
      muscle_group: formData.get('muscle_group') as string,
    })
    revalidatePath('/strength/library')
    revalidatePath('/strength')
  }

  async function deleteExercise(id: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('exercises').delete().eq('id', id)
    revalidatePath('/strength/library')
    revalidatePath('/strength')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/strength"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          >
            ← Strength
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Exercise Library</h1>
        </div>
      </div>

      <ExerciseLibraryForm
        exercises={exercises}
        muscleGroups={MUSCLE_GROUPS}
        addExercise={addExercise}
        deleteExercise={deleteExercise}
      />
    </div>
  )
}
