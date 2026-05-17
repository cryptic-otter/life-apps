import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import StrengthForm from './StrengthForm'
import { SCHEDULE, MUSCLE_GROUPS } from './schedule'
import type { MuscleGroup } from './schedule'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const GROUP_LABELS: Record<string, string> = {
  back: 'Back',
  bis: 'Biceps',
  chest: 'Chest',
  tris: 'Triceps',
  shoulders: 'Shoulders',
  legs: 'Legs',
}

function formatGroups(groups: MuscleGroup[]) {
  return groups.map(g => GROUP_LABELS[g] ?? g).join(' & ')
}

export type StrengthSet = {
  id: string
  exercise: string
  muscle_group: string | null
  weight_lbs: number | null
  sets: number
  reps: number
  notes: string | null
  date: string
  exercise_id: string | null
}

export type Exercise = {
  id: string
  name: string
  muscle_group: string
}

export type LastSetByExercise = Record<string, { weight_lbs: number | null; muscle_group: string | null }>

export default async function StrengthPage() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dayOfWeek = today.getDay()
  const scheduledGroups: MuscleGroup[] = SCHEDULE[dayOfWeek] ?? []
  const isRestDay = scheduledGroups.length === 0
  const dayName = DAY_NAMES[dayOfWeek]

  // Fetch today's sets
  const { data: rawTodaySets } = await supabase
    .from('strength_sets')
    .select('*')
    .eq('date', todayStr)
    .order('created_at', { ascending: true })

  const todaySets = (rawTodaySets ?? []) as StrengthSet[]

  // Fetch exercises for the dropdown
  const { data: rawExercises } = await supabase
    .from('exercises')
    .select('id, name, muscle_group')
    .order('muscle_group')
    .order('name')

  const exercises = (rawExercises ?? []) as Exercise[]

  // Fetch the most recent weight used per exercise (for pre-fill)
  const { data: rawRecentSets } = await supabase
    .from('strength_sets')
    .select('exercise, weight_lbs, muscle_group')
    .order('created_at', { ascending: false })

  const lastSetByExercise: LastSetByExercise = {}
  for (const row of rawRecentSets ?? []) {
    const typedRow = row as { exercise: string; weight_lbs: number | null; muscle_group: string | null }
    if (!lastSetByExercise[typedRow.exercise]) {
      lastSetByExercise[typedRow.exercise] = {
        weight_lbs: typedRow.weight_lbs,
        muscle_group: typedRow.muscle_group,
      }
    }
  }

  // Previous session: most recent date (before today) with any of today's scheduled groups
  let prevSets: StrengthSet[] = []
  if (!isRestDay) {
    const { data: prevDateRow } = await supabase
      .from('strength_sets')
      .select('date')
      .in('muscle_group', scheduledGroups)
      .lt('date', todayStr)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (prevDateRow) {
      const { data: rawPrevSets } = await supabase
        .from('strength_sets')
        .select('*')
        .eq('date', (prevDateRow as { date: string }).date)
        .in('muscle_group', scheduledGroups)
        .order('exercise')
        .order('created_at', { ascending: true })

      prevSets = (rawPrevSets ?? []) as StrengthSet[]
    }
  }

  const prevByExercise = prevSets.reduce<Record<string, StrengthSet[]>>((acc, s) => {
    if (!acc[s.exercise]) acc[s.exercise] = []
    acc[s.exercise].push(s)
    return acc
  }, {})

  const todayByExercise = todaySets.reduce<Record<string, StrengthSet[]>>((acc, s) => {
    if (!acc[s.exercise]) acc[s.exercise] = []
    acc[s.exercise].push(s)
    return acc
  }, {})

  async function addSet(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const exerciseIdRaw = formData.get('exercise_id') as string | null
    const exerciseId = exerciseIdRaw && exerciseIdRaw !== '' ? exerciseIdRaw : null

    await supabase.from('strength_sets').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      exercise: (formData.get('exercise') as string).trim(),
      muscle_group: (formData.get('muscle_group') as string) || null,
      exercise_id: exerciseId,
      weight_lbs: Number(formData.get('weight_lbs')) || null,
      sets: Number(formData.get('sets')),
      reps: Number(formData.get('reps')),
      notes: (formData.get('notes') as string) || null,
    })
    revalidatePath('/strength')
  }

  async function deleteSet(id: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('strength_sets').delete().eq('id', id)
    revalidatePath('/strength')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {isRestDay
              ? `${dayName} — Rest Day`
              : `${dayName} — ${formatGroups(scheduledGroups)}`}
          </h1>
        </div>
        <Link
          href="/strength/library"
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Exercise library →
        </Link>
      </div>

      {/* Previous session panel */}
      {!isRestDay && prevSets.length > 0 && (
        <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Last session
          </h2>
          <div className="space-y-3">
            {Object.entries(prevByExercise).map(([exercise, sets]) => (
              <div key={exercise}>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{exercise}</p>
                <div className="flex flex-wrap gap-2">
                  {sets.map(s => (
                    <span
                      key={s.id}
                      className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-gray-600 dark:text-gray-400"
                    >
                      {s.weight_lbs != null ? `${s.weight_lbs} lbs` : 'BW'} &times; {s.reps} reps
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log form */}
      <StrengthForm
        exercises={exercises}
        muscleGroups={MUSCLE_GROUPS}
        lastSetByExercise={lastSetByExercise}
        scheduledGroups={scheduledGroups}
        isRestDay={isRestDay}
        addSet={addSet}
      />

      {/* Today's sets */}
      <div className="mt-6 space-y-4">
        {Object.keys(todayByExercise).length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-12">No sets logged today.</p>
        )}
        {Object.entries(todayByExercise).map(([exercise, sets]) => (
          <div key={exercise} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{exercise}</h3>
              {sets[0]?.muscle_group && (
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded px-2 py-0.5">
                  {GROUP_LABELS[sets[0].muscle_group] ?? sets[0].muscle_group}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {sets.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {s.weight_lbs != null ? `${s.weight_lbs} lbs` : 'Bodyweight'} &times; {s.reps} reps
                    {s.sets > 1 ? ` (${s.sets} sets)` : ''}
                  </span>
                  {s.notes && (
                    <span className="text-gray-400 dark:text-gray-500 text-xs mx-2 truncate max-w-32">{s.notes}</span>
                  )}
                  <form action={deleteSet.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none px-1"
                    >
                      &times;
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
