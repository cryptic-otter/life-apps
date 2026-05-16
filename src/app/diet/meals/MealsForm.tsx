'use client'

import { useMemo, useState } from 'react'
import type { FoodItem, MealTemplate, MealTemplateItem } from '../types'

type Props = {
  templates: MealTemplate[]
  foodItems: FoodItem[]
  addTemplate: (formData: FormData) => Promise<void>
  updateTemplate: (formData: FormData) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
}

// A draft item in the builder — either linked to the library or fully ad-hoc
type DraftItem = {
  key: string // local stable key for React
  food_item_id?: string
  food_item?: FoodItem // resolved library item
  name: string // display name (for ad-hoc) or library item name
  servings: number
  serving_qty?: number
  serving_unit?: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
}

function toFormPayload(items: DraftItem[]) {
  return items.map(item => ({
    food_item_id: item.food_item_id ?? null,
    name: item.food_item_id ? null : item.name,
    servings: item.servings,
    serving_qty: item.food_item_id ? null : (item.serving_qty ?? null),
    serving_unit: item.food_item_id ? null : (item.serving_unit ?? null),
    calories: item.food_item_id ? null : (item.calories ?? null),
    protein_g: item.food_item_id ? null : (item.protein_g ?? null),
    carbs_g: item.food_item_id ? null : (item.carbs_g ?? null),
    fat_g: item.food_item_id ? null : (item.fat_g ?? null),
  }))
}

function templateToItems(t: MealTemplate): DraftItem[] {
  return (t.items ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(item => ({
      key: item.id,
      food_item_id: item.food_item_id ?? undefined,
      food_item: item.food_item ?? undefined,
      name: item.food_item?.name ?? item.name ?? '',
      servings: item.servings,
      serving_qty: item.serving_qty ?? undefined,
      serving_unit: item.serving_unit ?? undefined,
      calories: item.calories ?? undefined,
      protein_g: item.protein_g ?? undefined,
      carbs_g: item.carbs_g ?? undefined,
      fat_g: item.fat_g ?? undefined,
    }))
}

const inputCls =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

// ─── Template builder (shared by create and edit) ─────────────────────────────

function TemplateBuilder({
  initialName = '',
  initialItems = [],
  foodItems,
  templateId,
  onSave,
  onCancel,
}: {
  initialName?: string
  initialItems?: DraftItem[]
  foodItems: FoodItem[]
  templateId?: string
  onSave: (formData: FormData) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [items, setItems] = useState<DraftItem[]>(initialItems)

  // Item adder state
  const [addMode, setAddMode] = useState<'library' | 'adhoc'>('library')
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null)
  const [pendingServings, setPendingServings] = useState('1')
  // Ad-hoc fields
  const [adName, setAdName] = useState('')
  const [adServings, setAdServings] = useState('1')
  const [adQty, setAdQty] = useState('')
  const [adUnit, setAdUnit] = useState('')
  const [adCal, setAdCal] = useState('')
  const [adProt, setAdProt] = useState('')
  const [adCarb, setAdCarb] = useState('')
  const [adFat, setAdFat] = useState('')

  const filtered = useMemo(
    () => foodItems.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [search, foodItems]
  )

  function addLibraryItem() {
    if (!pendingFood) return
    setItems(prev => [
      ...prev,
      {
        key: `${pendingFood.id}-${Date.now()}`,
        food_item_id: pendingFood.id,
        food_item: pendingFood,
        name: pendingFood.name,
        servings: Number(pendingServings) || 1,
      },
    ])
    setSearch('')
    setPendingFood(null)
    setPendingServings('1')
  }

  function addAdhocItem() {
    if (!adName.trim()) return
    setItems(prev => [
      ...prev,
      {
        key: `adhoc-${Date.now()}`,
        name: adName.trim(),
        servings: Number(adServings) || 1,
        serving_qty: Number(adQty) || undefined,
        serving_unit: adUnit.trim() || undefined,
        calories: Number(adCal) || undefined,
        protein_g: Number(adProt) || undefined,
        carbs_g: Number(adCarb) || undefined,
        fat_g: Number(adFat) || undefined,
      },
    ])
    setAdName('')
    setAdServings('1')
    setAdQty('')
    setAdUnit('')
    setAdCal('')
    setAdProt('')
    setAdCarb('')
    setAdFat('')
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  function updateServings(key: string, val: string) {
    setItems(prev =>
      prev.map(i => (i.key === key ? { ...i, servings: Number(val) || i.servings } : i))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const fd = new FormData()
    if (templateId) fd.set('id', templateId)
    fd.set('name', name)
    fd.set('items', JSON.stringify(toFormPayload(items)))
    await onSave(fd)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Template name */}
      <div>
        <label className={labelCls}>Template name *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder="e.g. Oatmeal Bowl"
          className={inputCls}
        />
      </div>

      {/* Current items */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className={labelCls}>Items</p>
          {items.map(item => (
            <div
              key={item.key}
              className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
            >
              <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">
                {item.name}
                {(item.serving_qty || item.food_item) && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                    / {item.food_item ? `${item.food_item.serving_qty} ${item.food_item.serving_unit}` : `${item.serving_qty ?? ''} ${item.serving_unit ?? ''}`.trim()}
                  </span>
                )}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={item.servings}
                onChange={e => updateServings(item.key, e.target.value)}
                className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400 dark:text-gray-500 w-14">servings</span>
              <button
                type="button"
                onClick={() => removeItem(item.key)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none px-1"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add item section */}
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-3 space-y-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['library', 'adhoc'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setAddMode(m)}
              className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                addMode === m
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {m === 'library' ? 'From library' : 'Ad-hoc'}
            </button>
          ))}
        </div>

        {addMode === 'library' ? (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPendingFood(null)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Search food library…"
                className={inputCls}
              />
              {showDropdown && (
                <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filtered.length > 0 ? (
                    filtered.map(food => (
                      <li
                        key={food.id}
                        onMouseDown={() => {
                          setPendingFood(food)
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
                    ))
                  ) : (
                    <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
                      No items found
                    </li>
                  )}
                </ul>
              )}
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className={labelCls}>Servings</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={pendingServings}
                  onChange={e => setPendingServings(e.target.value)}
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={addLibraryItem}
                disabled={!pendingFood}
                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>Name *</label>
                <input
                  value={adName}
                  onChange={e => setAdName(e.target.value)}
                  placeholder="e.g. Protein shake"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Serving qty</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adQty}
                  onChange={e => setAdQty(e.target.value)}
                  placeholder="1"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Unit</label>
                <input
                  value={adUnit}
                  onChange={e => setAdUnit(e.target.value)}
                  placeholder="scoop"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Calories</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adCal}
                  onChange={e => setAdCal(e.target.value)}
                  placeholder="—"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Protein (g)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adProt}
                  onChange={e => setAdProt(e.target.value)}
                  placeholder="—"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Carbs (g)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adCarb}
                  onChange={e => setAdCarb(e.target.value)}
                  placeholder="—"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Fat (g)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adFat}
                  onChange={e => setAdFat(e.target.value)}
                  placeholder="—"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Servings in template</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={adServings}
                  onChange={e => setAdServings(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addAdhocItem}
                disabled={!adName.trim()}
                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add item
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {templateId ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MealsForm({
  templates,
  foodItems,
  addTemplate,
  updateTemplate,
  deleteTemplate,
}: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {!showCreate && !editingId && (
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + New template
        </button>
      )}

      {showCreate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">New template</h2>
          <TemplateBuilder
            foodItems={foodItems}
            onSave={async fd => {
              await addTemplate(fd)
              setShowCreate(false)
            }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {templates.length === 0 && !showCreate && (
        <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-12">
          No meal templates yet. Create your first one above.
        </p>
      )}

      <div className="space-y-3">
        {templates.map(template =>
          editingId === template.id ? (
            <div
              key={template.id}
              className="bg-blue-50 dark:bg-gray-700 rounded-xl border border-blue-200 dark:border-blue-800 p-4"
            >
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Edit: {template.name}
              </h2>
              <TemplateBuilder
                initialName={template.name}
                initialItems={templateToItems(template)}
                foodItems={foodItems}
                templateId={template.id}
                onSave={async fd => {
                  await updateTemplate(fd)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {template.name}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreate(false)
                      setEditingId(template.id)
                    }}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    Edit
                  </button>
                  <form action={async () => { await deleteTemplate(template.id) }}>
                    <button
                      type="submit"
                      className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none"
                    >
                      &times;
                    </button>
                  </form>
                </div>
              </div>

              {(template.items ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">No items</p>
              ) : (
                <ul className="space-y-1">
                  {[...(template.items ?? [])]
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(item => {
                      const displayName = item.food_item?.name ?? item.name ?? ''
                      const sizeLabel = item.food_item
                        ? `${item.food_item.serving_qty} ${item.food_item.serving_unit}`
                        : `${item.serving_qty ?? ''} ${item.serving_unit ?? ''}`.trim()
                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span>
                            {displayName}
                            {sizeLabel && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                                / {sizeLabel}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">
                            {item.servings} serving{item.servings !== 1 ? 's' : ''}
                          </span>
                        </li>
                      )
                    })}
                </ul>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
