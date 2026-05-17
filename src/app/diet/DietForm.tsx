'use client'

import { useMemo, useState } from 'react'
import { MEAL_CATEGORIES, type FoodItem, type MealCategory, type MealTemplate } from './types'

type Props = {
  foodItems: FoodItem[]
  mealTemplates: MealTemplate[]
  addFoodEntry: (formData: FormData) => Promise<void>
  addMealEntry: (formData: FormData) => Promise<void>
  today: string
}

export default function DietForm({ foodItems, mealTemplates, addFoodEntry, addMealEntry, today }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'food' | 'meal'>('food')
  const [category, setCategory] = useState<MealCategory>('breakfast')
  const [date, setDate] = useState(today)

  // Food-item mode
  const [search, setSearch] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [servings, setServings] = useState('1')
  const [showDropdown, setShowDropdown] = useState(false)

  // Meal-template mode
  const [templateId, setTemplateId] = useState('')
  const [itemServings, setItemServings] = useState<Record<string, string>>({})
  const [templateServings, setTemplateServings] = useState('1')

  const filteredFoods = useMemo(
    () =>
      search.length > 0
        ? foodItems.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
        : foodItems,
    [search, foodItems]
  )

  const selectedTemplate = mealTemplates.find(t => t.id === templateId)

  function selectFood(food: FoodItem) {
    setSelectedFood(food)
    setSearch(food.name)
    setShowDropdown(false)
  }

  function selectTemplate(id: string) {
    setTemplateId(id)
    setTemplateServings('1')
    const t = mealTemplates.find(m => m.id === id)
    if (t?.items) {
      const defaults: Record<string, string> = {}
      for (const item of t.items) defaults[item.id] = String(item.servings)
      setItemServings(defaults)
    }
  }

  function reset() {
    setOpen(false)
    setMode('food')
    setCategory('breakfast')
    setDate(today)
    setSearch('')
    setSelectedFood(null)
    setServings('1')
    setShowDropdown(false)
    setTemplateId('')
    setItemServings({})
    setTemplateServings('1')
  }

  async function handleFoodSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFood) return
    const fd = new FormData()
    fd.set('food_item_id', selectedFood.id)
    fd.set('servings', servings)
    fd.set('meal_category', category)
    fd.set('date', date)
    await addFoodEntry(fd)
    reset()
  }

  async function handleMealSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTemplate?.items?.length) return
    const multiplier = Number(templateServings) || 1
    const items = selectedTemplate.items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => {
        const s = (Number(itemServings[item.id] ?? item.servings)) * multiplier
        if (item.food_item_id) {
          return { food_item_id: item.food_item_id, food_name: item.food_item?.name ?? '', servings: s }
        }
        return {
          food_name: item.name ?? '',
          servings: s,
          serving_qty: item.serving_qty,
          serving_unit: item.serving_unit,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        }
      })
    const fd = new FormData()
    fd.set('meal_category', category)
    fd.set('items', JSON.stringify(items))
    fd.set('date', date)
    await addMealEntry(fd)
    reset()
  }

  const previewCals = selectedFood
    ? Math.round((selectedFood.calories ?? 0) * Number(servings || 1))
    : null

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
      >
        + Log food
      </button>

      {open && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          {/* Date picker */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {date !== today && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Logging for {date} — not today
              </p>
            )}
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['food', 'meal'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {m === 'food' ? 'Food Item' : 'Meal Template'}
              </button>
            ))}
          </div>

          {mode === 'food' ? (
            <form onSubmit={handleFoodSubmit} className="space-y-3">
              {/* Type-ahead search */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Food item
                </label>
                <input
                  type="text"
                  value={search}
                  placeholder="Search food library…"
                  onChange={e => {
                    setSearch(e.target.value)
                    setSelectedFood(null)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showDropdown && (
                  <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredFoods.length > 0 ? (
                      filteredFoods.map(food => (
                        <li
                          key={food.id}
                          onMouseDown={() => selectFood(food)}
                          className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-medium">{food.name}</span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs ml-3">
                            {food.serving_qty} {food.serving_unit}
                            {food.calories != null && ` · ${food.calories} kcal`}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
                        No items found —{' '}
                        <a href="/diet/library" className="text-blue-500 underline">
                          add to library
                        </a>
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Servings
                    {selectedFood && (
                      <span className="font-normal text-gray-400 dark:text-gray-500 ml-1">
                        ({selectedFood.serving_qty} {selectedFood.serving_unit} each)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={servings}
                    onChange={e => setServings(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Meal</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as MealCategory)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MEAL_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedFood && (
                <div className="grid grid-cols-4 gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{previewCals} kcal</span>
                  <span>{Math.round((selectedFood.protein_g ?? 0) * Number(servings || 1) * 10) / 10}g P</span>
                  <span>{Math.round((selectedFood.carbs_g ?? 0) * Number(servings || 1) * 10) / 10}g C</span>
                  <span>{Math.round((selectedFood.fat_g ?? 0) * Number(servings || 1) * 10) / 10}g F</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={reset}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFood}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMealSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Meal template
                </label>
                {mealTemplates.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No templates yet.{' '}
                    <a href="/diet/meals" className="text-blue-500 underline">
                      Create one
                    </a>
                    .
                  </p>
                ) : (
                  <select
                    value={templateId}
                    onChange={e => selectTemplate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template…</option>
                    {mealTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedTemplate && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Servings of this meal
                    <span className="font-normal text-gray-400 dark:text-gray-500 ml-1">
                      — scales all items proportionally
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={templateServings}
                    onChange={e => setTemplateServings(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {selectedTemplate?.items && selectedTemplate.items.length > 0 && (() => {
                const multiplier = Number(templateServings) || 1
                return (
                  <div className="space-y-2">
                    {[...selectedTemplate.items]
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map(item => {
                        const displayName = item.food_item?.name ?? item.name ?? ''
                        const sizeLabel = item.food_item
                          ? `${item.food_item.serving_qty} ${item.food_item.serving_unit}`
                          : `${item.serving_qty ?? ''} ${item.serving_unit ?? ''}`.trim()
                        const baseServings = Number(itemServings[item.id] ?? item.servings)
                        const effective = Math.round(baseServings * multiplier * 1000) / 1000
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                          >
                            <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">
                              {displayName}
                              {sizeLabel && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                                  / {sizeLabel}
                                </span>
                              )}
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={itemServings[item.id] ?? String(item.servings)}
                              onChange={e =>
                                setItemServings(prev => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-400 dark:text-gray-500 w-20 text-right">
                              {multiplier !== 1 ? `→ ${effective} logged` : 'servings'}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                )
              })()}

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Meal category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as MealCategory)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MEAL_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={reset}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!templateId || !selectedTemplate?.items?.length}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Log Meal
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
