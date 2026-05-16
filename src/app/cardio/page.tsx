import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import CardioForm from './CardioForm'
import { SCHEDULE, DAY_NAMES, type SwimEntry, type WeekDay } from './schedule'

export default async function CardioPage() {
  const supabase = await createClient()

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const todayDow = now.getDay()

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - todayDow)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const { data: rows } = await supabase
    .from('cardio_sessions')
    .select('id, date, distance_miles, planned_miles, sleep_quality, fuel_level, notes, is_off_plan')
    .gte('date', thirtyDaysAgoStr)
    .order('date', { ascending: false })

  const sessions: SwimEntry[] = (rows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    date: r.date as string,
    distance_miles: (r.distance_miles as number) ?? null,
    planned_miles: (r.planned_miles as number) ?? null,
    sleep_quality: (r.sleep_quality as string) ?? null,
    fuel_level: (r.fuel_level as string) ?? null,
    notes: (r.notes as string) ?? null,
    is_off_plan: (r.is_off_plan as boolean) ?? false,
  }))

  const weekDays: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    return {
      dateStr,
      dayName: DAY_NAMES[i],
      schedule: SCHEDULE[i],
      entry: sessions.find(s => s.date === dateStr) ?? null,
    }
  })

  const todayEntry = sessions.find(s => s.date === todayStr) ?? null
  const pastSwims = sessions.filter(s => s.date < weekStartStr)
  const weekMiles = weekDays.reduce((sum, d) => sum + (d.entry?.distance_miles ?? 0), 0)
  const tomorrowDow = (todayDow + 1) % 7

  async function addSwim(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const miles = Number(formData.get('distance_miles'))
    await supabase.from('cardio_sessions').insert({
      user_id: user.id,
      date: formData.get('date') as string,
      activity: 'Swimming',
      distance_miles: miles,
      planned_miles: Number(formData.get('planned_miles')) || null,
      calories: Math.round(miles * 600),
      sleep_quality: formData.get('sleep_quality') as string,
      fuel_level: formData.get('fuel_level') as string,
      notes: (formData.get('notes') as string) || null,
      is_off_plan: formData.get('is_off_plan') === 'true',
    })
    revalidatePath('/cardio')
  }

  async function updateSwim(id: string, formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const miles = Number(formData.get('distance_miles'))
    await supabase.from('cardio_sessions').update({
      distance_miles: miles,
      planned_miles: Number(formData.get('planned_miles')) || null,
      calories: Math.round(miles * 600),
      sleep_quality: formData.get('sleep_quality') as string,
      fuel_level: formData.get('fuel_level') as string,
      notes: (formData.get('notes') as string) || null,
    }).eq('id', id)
    revalidatePath('/cardio')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Cardio</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{weekMiles.toFixed(1)} mi this week</p>
      </div>
      <CardioForm
        today={todayStr}
        todaySchedule={SCHEDULE[todayDow]}
        tomorrowSchedule={SCHEDULE[tomorrowDow]}
        todayEntry={todayEntry}
        weekDays={weekDays}
        pastSwims={pastSwims}
        addSwim={addSwim}
        updateSwim={updateSwim}
      />
    </div>
  )
}
