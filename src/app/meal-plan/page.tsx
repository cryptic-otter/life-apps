import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import MealPlanGrid from './MealPlanGrid'

const MEAL_CATEGORIES = [
  'breakfast',
  'lunch',
  'dinner',
  'pre-workout',
  'post-workout',
  'snack',
] as const

type MealCat = (typeof MEAL_CATEGORIES)[number]

const MEAL_LABELS: Record<MealCat, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  'pre-workout': 'Pre-workout',
  'post-workout': 'Post-workout',
  snack: 'Snack',
}

export interface CellData {
  date: string
  mealCategory: string
  isDietLogged: boolean
  planId: string | null
  note: string | null
  isCovered: boolean
}

function getWeekDates(): string[] {
  const now = new Date()
  const dow = now.getUTCDay()
  const daysFromMon = dow === 0 ? 6 : dow - 1
  const mon = new Date(now)
  mon.setUTCDate(now.getUTCDate() - daysFromMon)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setUTCDate(mon.getUTCDate() + i)
    return d.toISOString().split('T')[0]
  })
}

function formatWeekRange(dates: string[]): string {
  const fmt = (s: string) =>
    new Date(s + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(dates[0])} – ${fmt(dates[6])}`
}

export default async function MealPlanPage() {
  const supabase = await createClient()
  const weekDates = getWeekDates()
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  const [{ data: dietRows }, { data: planRows }] = await Promise.all([
    supabase
      .from('diet_log_entries')
      .select('date, meal_category')
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase
      .from('meal_plan_entries')
      .select('id, date, meal_category, note, is_covered')
      .gte('date', weekStart)
      .lte('date', weekEnd),
  ])

  const dietLoggedSet = new Set(
    (dietRows ?? []).map((r) => `${r.date}:${r.meal_category}`)
  )
  const planMap = new Map(
    (planRows ?? []).map((r) => [`${r.date}:${r.meal_category}`, r])
  )

  const cells: CellData[][] = weekDates.map((date) =>
    MEAL_CATEGORIES.map((mc) => {
      const key = `${date}:${mc}`
      const isDietLogged = dietLoggedSet.has(key)
      const plan = planMap.get(key)
      return {
        date,
        mealCategory: mc,
        isDietLogged,
        planId: plan?.id ?? null,
        note: plan?.note ?? null,
        isCovered: isDietLogged || (plan?.is_covered ?? false),
      }
    })
  )

  async function upsertPlanEntry(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const date = formData.get('date') as string
    const meal_category = formData.get('meal_category') as string
    const note = ((formData.get('note') as string) ?? '').trim() || null
    const is_covered = formData.get('is_covered') === 'on'
    await supabase
      .from('meal_plan_entries')
      .upsert(
        { user_id: user.id, date, meal_category, note, is_covered },
        { onConflict: 'user_id,date,meal_category' }
      )
    revalidatePath('/meal-plan')
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Meal Planner</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatWeekRange(weekDates)}</p>
      </div>
      <MealPlanGrid
        weekDates={weekDates}
        today={new Date().toISOString().split('T')[0]}
        cells={cells}
        mealCategories={[...MEAL_CATEGORIES]}
        mealLabels={MEAL_LABELS}
        upsertPlanEntry={upsertPlanEntry}
      />
    </div>
  )
}
