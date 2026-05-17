'use client'

import { useRef, useState } from 'react'
import type { Exercise } from './page'
import type { MuscleGroup } from '../schedule'

type Props = {
  exercises: Exercise[]
  muscleGroups: readonly MuscleGroup[]
  addExercise: (formData: FormData) => Promise<void>
  deleteExercise: (id: string) => Promise<void>
}

const inputCls =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

const GROUP_LABELS: Record<string, string> = {
  back: 'Back',
  bis: 'Biceps',
  chest: 'Chest',
  tris: 'Triceps',
  shoulders: 'Shoulders',
  legs: 'Legs',
}

export default function ExerciseLibraryForm({ exercises, muscleGroups, addExercise, deleteExercise }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const addFormRef = useRef<HTMLFormElement>(null)

  const byGroup = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
    acc[ex.muscle_group].push(ex)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Add exercise
        </button>
      ) : (
        <form
          ref={addFormRef}
          action={async (fd) => {
            await addExercise(fd)
            addFormRef.current?.reset()
            setShowAdd(false)
          }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
        >
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">New exercise</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name *</label>
              <input
                name="name"
                required
                placeholder="e.g. Bench Press"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Muscle group *</label>
              <select name="muscle_group" required className={inputCls}>
                <option value="">Select…</option>
                {muscleGroups.map(g => (
                  <option key={g} value={g}>{GROUP_LABELS[g] ?? g}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button
              type="button"
              onClick={() => { setShowAdd(false); addFormRef.current?.reset() }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {exercises.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-12">
          No exercises yet. Add your first one above.
        </p>
      )}

      <div className="space-y-4">
        {muscleGroups.filter(g => byGroup[g]?.length).map(group => (
          <div key={group}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              {GROUP_LABELS[group] ?? group}
            </h2>
            <div className="space-y-1">
              {byGroup[group]!.map(ex => (
                <div
                  key={ex.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-sm text-gray-900 dark:text-gray-100">{ex.name}</span>
                  <form action={async () => { await deleteExercise(ex.id) }}>
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
