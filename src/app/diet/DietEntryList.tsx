'use client'

import { useMemo, useState } from 'react'
import { entryMacros, MEAL_CATEGORIES, type DietLogEntry, type FoodItem, type MealCategory } from './types'

type Props = {
  entries: DietLogEntry[]
  foodItems: FoodItem[]
  updateEntry: (formData: FormData) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export default function DietEntryList({ entries, foodItems, updateEntry, deleteEntry }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<MealCategory, DietLogEntry[]>()
    for (const cat of MEAL_CATEGORIES) map.set(cat.value, [])
    for (const entry of entries) {
      map.get(entry.meal_category)?.push(entry)
    }
    return MEAL_CATEGORIES.map(cat => ({
      ...cat,
      entries: map.get(cat.value) ?? [],
    })).filter(g => g.entries.length > 0)
  }, [entries])

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-12">
        Nothing logged for this day.
      </p>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      {grouped.map(group => {
        const sub = group.entries.reduce(
          (acc, e) => {
            const m = entryMacros(e)
            return {
              calories: acc.calories + m.calories,
              protein: acc.protein + m.protein,
              carbs: acc.carbs + m.carbs,
              fat: acc.fat + m.fat,
            }
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        )

        return (
          <div key={group.value}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {group.label}
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {Math.round(sub.calories)} kcal &middot; {round1(sub.protein)}g P &middot;{' '}
                {round1(sub.carbs)}g C &middot; {round1(sub.fat)}g F
              </span>
            </div>

            <div className="space-y-2">
              {group.entries.map(entry =>
                editingId === entry.id ? (
                  <EditRow
                    key={entry.id}
                    entry={entry}
                    foodItems={foodItems}
                    updateEntry={updateEntry}
                    onDone={() => setEditingId(null)}
                  />
                ) : (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onEdit={() => setEditingId(entry.id)}
                    deleteEntry={deleteEntry}
                  />
                )
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EntryRow({
  entry,
  onEdit,
  deleteEntry,
}: {
  entry: DietLogEntry
  onEdit: () => void
  deleteEntry: (id: string) => Promise<void>
}) {
  const m = entryMacros(entry)
  const fi = entry.food_item
  const servingLabel = fi
    ? `${entry.servings}×${fi.serving_qty}${fi.serving_unit}`
    : `${entry.servings} serving${entry.servings !== 1 ? 's' : ''}`

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      onClick={onEdit}
      title="Click to edit"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {entry.food_name}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">
            {servingLabel}
          </span>
        </div>
        <div className="flex gap-3 mt-0.5 flex-wrap">
          {m.calories > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(m.calories)} kcal</span>
          )}
          {m.protein > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{round1(m.protein)}g P</span>
          )}
          {m.carbs > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{round1(m.carbs)}g C</span>
          )}
          {m.fat > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{round1(m.fat)}g F</span>
          )}
        </div>
      </div>
      <form
        action={async () => { await deleteEntry(entry.id) }}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="submit"
          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none px-1"
          title="Delete"
        >
          &times;
        </button>
      </form>
    </div>
  )
}

function EditRow({
  entry,
  foodItems,
  updateEntry,
  onDone,
}: {
  entry: DietLogEntry
  foodItems: FoodItem[]
  updateEntry: (fd: FormData) => Promise<void>
  onDone: () => void
}) {
  const [servings, setServings] = useState(String(entry.servings))
  const [category, setCategory] = useState<MealCategory>(entry.meal_category)
  const [search, setSearch] = useState(entry.food_name)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(entry.food_item ?? null)
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = useMemo(
    () => foodItems.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [search, foodItems]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('id', entry.id)
    fd.set('servings', servings)
    fd.set('meal_category', category)
    if (selectedFood && selectedFood.id !== entry.food_item_id) {
      fd.set('food_item_id', selectedFood.id)
    }
    await updateEntry(fd)
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-800 px-4 py-3 space-y-3"
    >
      {/* Food item picker */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Food item
        </label>
        <input
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setSelectedFood(null)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showDropdown && filtered.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filtered.map(food => (
              <li
                key={food.id}
                onMouseDown={() => {
                  setSelectedFood(food)
                  setSearch(food.name)
                  setShowDropdown(false)
                }}
                className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer flex items-center justify-between"
              >
                <span>{food.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                  {food.serving_qty} {food.serving_unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Servings
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={servings}
            onChange={e => setServings(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Meal
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as MealCategory)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MEAL_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  )
}
