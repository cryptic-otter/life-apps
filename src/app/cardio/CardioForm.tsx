'use client'

import { useState } from 'react'
import type { DaySchedule, SwimEntry, WeekDay } from './schedule'
import { scheduleLabel, getRowStatus } from './schedule'

const SLEEP_OPTIONS = [
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'average', label: 'Average' },
  { value: 'poor', label: 'Poor' },
  { value: 'terrible', label: 'Terrible' },
]

const FUEL_OPTIONS = [
  { value: 'overfueled', label: 'Overfueled' },
  { value: 'adequately_fueled', label: 'Adequately Fueled' },
  { value: 'underfueled', label: 'Underfueled' },
]

const STATUS_ROW: Record<string, string> = {
  completed: 'bg-green-50 dark:bg-green-900/20',
  bonus:     'bg-green-50 dark:bg-green-900/20',
  underswam: 'bg-orange-50 dark:bg-orange-900/20',
  missed:    'bg-red-50 dark:bg-red-900/20',
  rest:      'bg-gray-50 dark:bg-gray-800/30',
  upcoming:  '',
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Done',   cls: 'text-green-700 dark:text-green-400' },
  bonus:     { label: 'Bonus',  cls: 'text-green-700 dark:text-green-400' },
  underswam: { label: 'Short',  cls: 'text-orange-700 dark:text-orange-400' },
  missed:    { label: 'Missed', cls: 'text-red-700 dark:text-red-400' },
  rest:      { label: 'Rest',   cls: 'text-gray-400 dark:text-gray-500' },
  upcoming:  { label: '—',      cls: 'text-gray-400 dark:text-gray-500' },
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function fmtOption(value: string | null, options: { value: string; label: string }[]) {
  return options.find(o => o.value === value)?.label ?? value ?? '—'
}

const INPUT_CLS = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL_CLS = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

function SwimForm({
  dateStr,
  defaultMiles,
  distanceLocked = false,
  plannedMiles,
  isOffPlan = false,
  existingEntry,
  onSubmit,
  onCancel,
}: {
  dateStr: string
  defaultMiles: number
  distanceLocked?: boolean
  plannedMiles?: number | null
  isOffPlan?: boolean
  existingEntry?: SwimEntry | null
  onSubmit: (formData: FormData) => Promise<void>
  onCancel?: () => void
}) {
  return (
    <form
      action={async (fd) => {
        await onSubmit(fd)
        onCancel?.()
      }}
      className="space-y-3"
    >
      <input type="hidden" name="date" value={dateStr} />
      <input type="hidden" name="planned_miles" value={plannedMiles ?? ''} />
      <input type="hidden" name="is_off_plan" value={isOffPlan ? 'true' : 'false'} />

      <div className="grid grid-cols-2 gap-3">
        {/* Distance */}
        <div className={distanceLocked ? '' : 'col-span-2'}>
          <label className={LABEL_CLS}>Distance (mi)</label>
          {distanceLocked ? (
            <>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                {defaultMiles} mi
              </p>
              <input type="hidden" name="distance_miles" value={defaultMiles} />
            </>
          ) : (
            <input
              name="distance_miles"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={existingEntry?.distance_miles ?? defaultMiles}
              required
              className={INPUT_CLS}
            />
          )}
        </div>

        {/* Sleep Quality */}
        <div>
          <label className={LABEL_CLS}>Sleep Quality</label>
          <select
            name="sleep_quality"
            defaultValue={existingEntry?.sleep_quality ?? ''}
            required
            className={INPUT_CLS}
          >
            <option value="" disabled>Select...</option>
            {SLEEP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Fuel Level */}
        <div>
          <label className={LABEL_CLS}>Fuel Level</label>
          <select
            name="fuel_level"
            defaultValue={existingEntry?.fuel_level ?? ''}
            required
            className={INPUT_CLS}
          >
            <option value="" disabled>Select...</option>
            {FUEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className={LABEL_CLS}>Notes (optional)</label>
          <input
            name="notes"
            defaultValue={existingEntry?.notes ?? ''}
            placeholder="How did it go?"
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-2"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  )
}

type Props = {
  today: string
  todaySchedule: DaySchedule
  tomorrowSchedule: DaySchedule
  todayEntry: SwimEntry | null
  weekDays: WeekDay[]
  pastSwims: SwimEntry[]
  addSwim: (formData: FormData) => Promise<void>
  updateSwim: (id: string, formData: FormData) => Promise<void>
}

export default function CardioForm({
  today,
  todaySchedule,
  tomorrowSchedule,
  todayEntry,
  weekDays,
  pastSwims,
  addSwim,
  updateSwim,
}: Props) {
  const isRangeDay = todaySchedule.type === 'range'
  const [showTodayForm, setShowTodayForm] = useState(isRangeDay && !todayEntry)
  const [todayDistanceLocked, setTodayDistanceLocked] = useState(false)
  const [editingPastId, setEditingPastId] = useState<string | null>(null)

  const todayDefaultMiles = todaySchedule.type !== 'rest' ? todaySchedule.miles : 0
  const todayPlanned = todaySchedule.type !== 'rest' ? todaySchedule.miles : null

  return (
    <div className="space-y-5">

      {/* ── Today's Action Card ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Today</p>

        {todayEntry ? (
          /* Already logged */
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {todayEntry.distance_miles} mi
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Sleep: {fmtOption(todayEntry.sleep_quality, SLEEP_OPTIONS)}
                  {' · '}
                  Fuel: {fmtOption(todayEntry.fuel_level, FUEL_OPTIONS)}
                </p>
                {todayEntry.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">{todayEntry.notes}</p>
                )}
              </div>
              {!showTodayForm && (
                <button
                  onClick={() => setShowTodayForm(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-4 shrink-0"
                >
                  Edit
                </button>
              )}
            </div>
            {showTodayForm && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <SwimForm
                  dateStr={today}
                  defaultMiles={todayEntry.distance_miles ?? todayDefaultMiles}
                  plannedMiles={todayPlanned}
                  existingEntry={todayEntry}
                  onSubmit={(fd) => updateSwim(todayEntry.id, fd)}
                  onCancel={() => setShowTodayForm(false)}
                />
              </div>
            )}
          </div>

        ) : todaySchedule.type === 'rest' ? (
          /* Rest day */
          <div>
            <p className="text-base font-medium text-gray-500 dark:text-gray-400">Rest Day</p>
            {!showTodayForm ? (
              <button
                onClick={() => setShowTodayForm(true)}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                I swam today
              </button>
            ) : (
              <div className="mt-3">
                <SwimForm
                  dateStr={today}
                  defaultMiles={0}
                  isOffPlan={true}
                  onSubmit={addSwim}
                  onCancel={() => setShowTodayForm(false)}
                />
              </div>
            )}
          </div>

        ) : todaySchedule.type === 'range' ? (
          /* Range day — form always visible */
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Planned: {scheduleLabel(todaySchedule)}
            </p>
            <SwimForm
              dateStr={today}
              defaultMiles={todaySchedule.miles}
              plannedMiles={todaySchedule.miles}
              onSubmit={addSwim}
            />
          </div>

        ) : (
          /* Fixed swim day */
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Planned: {scheduleLabel(todaySchedule)}
            </p>
            {!showTodayForm ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setTodayDistanceLocked(true); setShowTodayForm(true) }}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
                >
                  Swim Performed
                </button>
                <button
                  onClick={() => { setTodayDistanceLocked(false); setShowTodayForm(true) }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit distance
                </button>
              </div>
            ) : (
              <SwimForm
                dateStr={today}
                defaultMiles={todayDefaultMiles}
                distanceLocked={todayDistanceLocked}
                plannedMiles={todayPlanned}
                onSubmit={addSwim}
                onCancel={() => setShowTodayForm(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Tomorrow Card ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Tomorrow</p>
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {scheduleLabel(tomorrowSchedule)}
        </p>
        {tomorrowSchedule.type === 'range' && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Range day — you&apos;ll enter your actual distance
          </p>
        )}
      </div>

      {/* ── Weekly Table ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">This Week</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              {['Day', 'Planned', 'Actual', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2 text-xs font-medium text-gray-400 dark:text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDays.map(({ dateStr, dayName, schedule, entry }) => {
              const status = getRowStatus(schedule, entry, dateStr, today)
              const badge = STATUS_BADGE[status]
              const isToday = dateStr === today
              return (
                <tr
                  key={dateStr}
                  className={`border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${STATUS_ROW[status]}`}
                >
                  <td className={`px-4 py-2.5 font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {dayName}{isToday && <span className="ml-1 text-xs font-normal opacity-70">(today)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                    {schedule.type === 'rest'
                      ? '—'
                      : schedule.type === 'range'
                      ? `${schedule.miles}–${schedule.maxMiles} mi`
                      : `${schedule.miles} mi`}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                    {entry?.distance_miles != null ? `${entry.distance_miles} mi` : '—'}
                  </td>
                  <td className={`px-4 py-2.5 font-medium ${badge.cls}`}>{badge.label}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Past Swims ── */}
      {pastSwims.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Swims</h2>
          <div className="space-y-2">
            {pastSwims.map(entry => (
              <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                {editingPastId === entry.id ? (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{fmtDate(entry.date)}</p>
                    <SwimForm
                      key={entry.id}
                      dateStr={entry.date}
                      defaultMiles={entry.distance_miles ?? 0}
                      plannedMiles={entry.planned_miles}
                      existingEntry={entry}
                      onSubmit={(fd) => updateSwim(entry.id, fd)}
                      onCancel={() => setEditingPastId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">{fmtDate(entry.date)}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {entry.distance_miles} mi
                      </span>
                      {entry.sleep_quality && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                          Sleep: {fmtOption(entry.sleep_quality, SLEEP_OPTIONS)}
                        </span>
                      )}
                      {entry.notes && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 italic">{entry.notes}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingPastId(entry.id)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-4 shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
