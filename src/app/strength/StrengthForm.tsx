'use client'

import { useRef, useState } from 'react'

type Props = { addEntry: (formData: FormData) => Promise<void> }

export default function StrengthForm({ addEntry }: Props) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
      >
        + Log exercise
      </button>

      {open && (
        <form
          ref={formRef}
          action={async (formData) => {
            await addEntry(formData)
            formRef.current?.reset()
            setOpen(false)
          }}
          className="mt-4 bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-3 gap-3"
        >
          <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Exercise</label>
            <input
              name="exercise"
              required
              placeholder="e.g. Bench Press"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sets</label>
            <input
              name="sets"
              type="number"
              min="1"
              defaultValue="3"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reps</label>
            <input
              name="reps"
              type="number"
              min="1"
              defaultValue="10"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg)</label>
            <input
              name="weight"
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
            <input
              name="notes"
              placeholder="e.g. felt strong today"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-900 px-4 py-2"
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
    </div>
  )
}
