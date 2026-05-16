'use client'

import { useRef, useState } from 'react'
import type { FoodItem } from '../types'

type Props = {
  foodItems: FoodItem[]
  addFoodItem: (formData: FormData) => Promise<void>
  updateFoodItem: (formData: FormData) => Promise<void>
  deleteFoodItem: (id: string) => Promise<void>
}

const inputCls =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

function FoodItemFields({ item }: { item?: FoodItem }) {
  return (
    <>
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="col-span-2 sm:col-span-3">
        <label className={labelCls}>Name *</label>
        <input
          name="name"
          required
          defaultValue={item?.name}
          placeholder="e.g. Rolled Oats"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Serving qty *</label>
        <input
          name="serving_qty"
          type="number"
          required
          min="0.001"
          step="any"
          defaultValue={item?.serving_qty}
          placeholder="100"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Unit *</label>
        <input
          name="serving_unit"
          required
          defaultValue={item?.serving_unit}
          placeholder="g"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Calories</label>
        <input
          name="calories"
          type="number"
          min="0"
          step="any"
          defaultValue={item?.calories ?? ''}
          placeholder="—"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Protein (g)</label>
        <input
          name="protein_g"
          type="number"
          min="0"
          step="any"
          defaultValue={item?.protein_g ?? ''}
          placeholder="—"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Carbs (g)</label>
        <input
          name="carbs_g"
          type="number"
          min="0"
          step="any"
          defaultValue={item?.carbs_g ?? ''}
          placeholder="—"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Fat (g)</label>
        <input
          name="fat_g"
          type="number"
          min="0"
          step="any"
          defaultValue={item?.fat_g ?? ''}
          placeholder="—"
          className={inputCls}
        />
      </div>
    </>
  )
}

export default function LibraryForm({ foodItems, addFoodItem, updateFoodItem, deleteFoodItem }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const addFormRef = useRef<HTMLFormElement>(null)

  return (
    <div className="space-y-4">
      {/* Add new item */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Add food item
        </button>
      ) : (
        <form
          ref={addFormRef}
          action={async (fd) => {
            await addFoodItem(fd)
            addFormRef.current?.reset()
            setShowAdd(false)
          }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
        >
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">New food item</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FoodItemFields />
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

      {/* Item list */}
      {foodItems.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-12">
          No food items yet. Add your first one above.
        </p>
      )}

      <div className="space-y-2">
        {foodItems.map(item =>
          editingId === item.id ? (
            <form
              key={item.id}
              action={async (fd) => {
                await updateFoodItem(fd)
                setEditingId(null)
              }}
              className="bg-blue-50 dark:bg-gray-700 rounded-xl border border-blue-200 dark:border-blue-800 p-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FoodItemFields item={item} />
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
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
          ) : (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    per {item.serving_qty} {item.serving_unit}
                  </span>
                </div>
                <div className="flex gap-3 mt-0.5 flex-wrap">
                  {item.calories != null && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.calories} kcal</span>
                  )}
                  {item.protein_g != null && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{item.protein_g}g P</span>
                  )}
                  {item.carbs_g != null && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{item.carbs_g}g C</span>
                  )}
                  {item.fat_g != null && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{item.fat_g}g F</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditingId(item.id)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 px-2 py-1"
              >
                Edit
              </button>
              <form action={async () => { await deleteFoodItem(item.id) }}>
                <button
                  type="submit"
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none px-1"
                >
                  &times;
                </button>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  )
}
