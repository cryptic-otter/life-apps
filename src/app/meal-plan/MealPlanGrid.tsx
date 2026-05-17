'use client'

import { useRef } from 'react'

interface CellData {
  date: string
  mealCategory: string
  isDietLogged: boolean
  planId: string | null
  note: string | null
  isCovered: boolean
}

interface Props {
  weekDates: string[]
  today: string
  cells: CellData[][]
  mealCategories: string[]
  mealLabels: Record<string, string>
  upsertPlanEntry: (formData: FormData) => Promise<void>
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function EditableCell({
  cell,
  upsertEntry,
}: {
  cell: CellData
  upsertEntry: (fd: FormData) => Promise<void>
}) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={upsertEntry} className="p-2 flex flex-col gap-1.5 min-h-[64px]">
      <input type="hidden" name="date" value={cell.date} />
      <input type="hidden" name="meal_category" value={cell.mealCategory} />
      <input
        type="text"
        name="note"
        defaultValue={cell.note ?? ''}
        placeholder="What's the plan?"
        onBlur={() => formRef.current?.requestSubmit()}
        className="w-full text-xs bg-transparent border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
      />
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          name="is_covered"
          defaultChecked={cell.isCovered}
          onChange={() => formRef.current?.requestSubmit()}
          className="accent-green-500 w-3 h-3"
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">Covered</span>
      </label>
    </form>
  )
}

export default function MealPlanGrid({
  weekDates,
  today,
  cells,
  mealCategories,
  mealLabels,
  upsertPlanEntry,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-[780px] w-full border-collapse">
        <thead>
          <tr>
            <th className="w-14 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            {mealCategories.map((mc) => (
              <th
                key={mc}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-center whitespace-nowrap"
              >
                {mealLabels[mc]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weekDates.map((date, di) => {
            const isToday = date === today
            const dayNum = new Date(date + 'T12:00:00Z').getUTCDate()
            return (
              <tr key={date}>
                <td
                  className={`border border-gray-200 dark:border-gray-700 px-2 py-2 text-center whitespace-nowrap ${
                    isToday
                      ? 'bg-blue-50 dark:bg-blue-950/40'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <span
                    className={`text-xs font-medium block ${
                      isToday
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {DAY_LABELS[di]}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      isToday
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {dayNum}
                  </span>
                </td>
                {cells[di].map((cell) => (
                  <td
                    key={cell.mealCategory}
                    className={`border border-gray-200 dark:border-gray-700 ${
                      cell.isCovered
                        ? 'bg-green-50 dark:bg-green-950/30'
                        : 'bg-white dark:bg-gray-900'
                    }`}
                  >
                    {cell.isDietLogged ? (
                      <div className="p-2 min-h-[64px] flex items-center justify-center">
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          Logged
                        </span>
                      </div>
                    ) : (
                      <EditableCell
                        key={`${cell.date}:${cell.mealCategory}:${cell.isCovered}`}
                        cell={cell}
                        upsertEntry={upsertPlanEntry}
                      />
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
