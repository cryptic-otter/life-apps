export type DaySchedule =
  | { type: 'fixed'; miles: number }
  | { type: 'range'; miles: number; maxMiles: number }
  | { type: 'rest' }

export const SCHEDULE: Record<number, DaySchedule> = {
  0: { type: 'rest' },
  1: { type: 'fixed', miles: 1.0 },
  2: { type: 'fixed', miles: 0.5 },
  3: { type: 'range', miles: 1.0, maxMiles: 1.5 },
  4: { type: 'fixed', miles: 0.5 },
  5: { type: 'rest' },
  6: { type: 'range', miles: 1.5, maxMiles: 2.0 },
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export interface SwimEntry {
  id: string
  date: string
  distance_miles: number | null
  planned_miles: number | null
  sleep_quality: string | null
  fuel_level: string | null
  notes: string | null
  is_off_plan: boolean
}

export interface WeekDay {
  dateStr: string
  dayName: string
  schedule: DaySchedule
  entry: SwimEntry | null
}

export function scheduleLabel(s: DaySchedule): string {
  if (s.type === 'rest') return 'Rest Day'
  if (s.type === 'range') return `${s.miles}–${s.maxMiles} mi`
  return `${s.miles} mi`
}

export function getRowStatus(
  schedule: DaySchedule,
  entry: SwimEntry | null,
  dateStr: string,
  todayStr: string
): 'completed' | 'bonus' | 'underswam' | 'missed' | 'rest' | 'upcoming' {
  const isPast = dateStr < todayStr
  const miles = entry?.distance_miles

  if (miles != null) {
    if (schedule.type === 'rest') return 'bonus'
    if (miles >= schedule.miles) return 'completed'
    return 'underswam'
  }

  if (schedule.type === 'rest') return 'rest'
  if (isPast) return 'missed'
  return 'upcoming'
}
