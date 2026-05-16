'use client'

import { useRef, useState } from 'react'

type Props = { addEntry: (formData: FormData) => Promise<void> }

export default function DietForm({ addEntry }: Props) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
      >
        + Log food
      </button>

      {open && (
        <form
          ref={formRef}
          action={async (formData) => {
            await addEntry(formData)
            formRef.current?.reset()
            setOpen(false)
          }}
          className="mt-4 bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-3"
        >
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Food</label>
            <input
              name="food"
              required
              placeholder="e.g. Chicken breast, 200g"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Meal</label>
            <select
              name="meal"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Calories</label>
            <input
              name="calories"
              type="number"
              min="0"
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Protein (g)</label>
            <input
              name="protein"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Carbs (g)</label>
            <input
              name="carbs"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fat (g)</label>
            <input
              name="fat"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
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
