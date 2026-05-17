'use client'

import { useRef, useState } from 'react'
import type { Exercise, LastSetByExercise } from './page'
import type { MuscleGroup } from './schedule'

type Props = {
  exercises: Exercise[]
  muscleGroups: readonly MuscleGroup[]
  lastSetByExercise: LastSetByExercise
  scheduledGroups: MuscleGroup[]
  isRestDay: boolean
  addSet: (formData: FormData) => Promise<void>
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

const FREETEXT_VALUE = '__freetext__'

export default function StrengthForm({
  exercises,
  muscleGroups,
  lastSetByExercise,
  isRestDay,
  addSet,
}: Props) {
  const [open, setOpen] = useState(false)
  const [showRestForm, setShowRestForm] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [isFreetext, setIsFreetext] = useState(false)
  const [exerciseName, setExerciseName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const exerciseMap = Object.fromEntries(exercises.map(e => [e.id, e]))

  function handleExerciseChange(value: string) {
    setSelectedExerciseId(value)
    if (value === FREETEXT_VALUE) {
      setIsFreetext(true)
      setExerciseName('')
      setMuscleGroup('')
      setWeightLbs('')
    } else if (value === '') {
      setIsFreetext(false)
      setExerciseName('')
      setMuscleGroup('')
      setWeightLbs('')
    } else {
      setIsFreetext(false)
      const ex = exerciseMap[value]
      if (ex) {
        setExerciseName(ex.name)
        setMuscleGroup(ex.muscle_group)
        const last = lastSetByExercise[ex.name]
        setWeightLbs(last?.weight_lbs != null ? String(last.weight_lbs) : '')
      }
    }
  }

  function resetForm() {
    formRef.current?.reset()
    setSelectedExerciseId('')
    setIsFreetext(false)
    setExerciseName('')
    setMuscleGroup('')
    setWeightLbs('')
  }

  function closeForm() {
    setOpen(false)
    setShowRestForm(false)
    resetForm()
  }

  const formVisible = isRestDay ? showRestForm : open

  const formJsx = (
    <form
      ref={formRef}
      action={async (fd) => {
        await addSet(fd)
        resetForm()
        setOpen(false)
        setShowRestForm(false)
      }}
      className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3"
    >
      {/* Hidden fields carrying resolved values */}
      <input type="hidden" name="exercise_id" value={isFreetext ? '' : selectedExerciseId} />

      {/* Exercise selector */}
      <div>
        <label className={labelCls}>Exercise *</label>
        <select
          value={selectedExerciseId}
          onChange={e => handleExerciseChange(e.target.value)}
          className={inputCls}
          required={!isFreetext}
        >
          <option value="">Select exercise…</option>
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name} ({GROUP_LABELS[ex.muscle_group] ?? ex.muscle_group})</option>
          ))}
          <option value={FREETEXT_VALUE}>Other (freetext)…</option>
        </select>
      </div>

      {/* Freetext exercise name — shown only when "Other" is selected */}
      {isFreetext && (
        <div>
          <label className={labelCls}>Exercise name *</label>
          <input
            name="exercise"
            required
            value={exerciseName}
            onChange={e => setExerciseName(e.target.value)}
            placeholder="e.g. Cable Fly"
            className={inputCls}
          />
        </div>
      )}

      {/* Hidden exercise name for library-selected exercises */}
      {!isFreetext && selectedExerciseId !== '' && (
        <input type="hidden" name="exercise" value={exerciseName} />
      )}

      {/* If no exercise selected yet, show a required hidden input to prevent submit */}
      {!isFreetext && selectedExerciseId === '' && (
        <input type="hidden" name="exercise" value="" />
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Muscle group */}
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>Muscle group *</label>
          <select
            name="muscle_group"
            required
            value={muscleGroup}
            onChange={e => setMuscleGroup(e.target.value)}
            className={inputCls}
          >
            <option value="">Select…</option>
            {muscleGroups.map(g => (
              <option key={g} value={g}>{GROUP_LABELS[g] ?? g}</option>
            ))}
          </select>
        </div>

        {/* Weight */}
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>Weight (lbs)</label>
          <input
            name="weight_lbs"
            type="number"
            min="0"
            step="0.5"
            placeholder="Bodyweight if blank"
            value={weightLbs}
            onChange={e => setWeightLbs(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Sets */}
        <div>
          <label className={labelCls}>Sets *</label>
          <input
            name="sets"
            type="number"
            min="1"
            defaultValue="3"
            required
            className={inputCls}
          />
        </div>

        {/* Reps */}
        <div>
          <label className={labelCls}>Reps *</label>
          <input
            name="reps"
            type="number"
            min="1"
            defaultValue="10"
            required
            className={inputCls}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes</label>
        <input
          name="notes"
          placeholder="Optional"
          className={inputCls}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={closeForm}
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
  )

  if (isRestDay) {
    return (
      <div>
        {!showRestForm ? (
          <button
            onClick={() => setShowRestForm(true)}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2"
          >
            Log anyway
          </button>
        ) : (
          formJsx
        )}
      </div>
    )
  }

  return (
    <div>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Log set
        </button>
      )}
      {formVisible && formJsx}
    </div>
  )
}
