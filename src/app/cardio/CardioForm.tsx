'use client'

import { useRef, useState } from 'react'

const ACTIVITIES = ['Running', 'Cycling', 'Swimming', 'Walking', 'Rowing', 'HIIT', 'Other']

type Props = { addSession: (formData: FormData) => Promise<void> }

export default function CardioForm({ addSession }: Props) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
      >
        + Log session
      </button>

      {open && (
        <form
          ref={formRef}
          action={async (formData) => {
            await addSession(formData)
            formRef.current?.reset()
            setOpen(false)
          }}
          className="mt-4 bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Activity</label>
            <select
              name="activity"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTIVITIES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              name="date"
              type="date"
              defaultValue={today}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Duration (min)</label>
            <input
              name="duration"
              type="number"
              min="1"
              required
              placeholder="30"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Distance (km)</label>
            <input
              name="distance"
              type="number"
              min="0"
              step="0.01"
              placeholder="optional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
            <input
              name="notes"
              placeholder="e.g. morning run, felt great"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2 flex gap-2 justify-end">
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
