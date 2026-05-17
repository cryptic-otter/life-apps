import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-gray-900">Life Apps</Link>
          <Link href="/diet" className="text-sm text-gray-600 hover:text-gray-900">Diet</Link>
          <Link href="/strength" className="text-sm text-gray-600 hover:text-gray-900">Strength</Link>
          <Link href="/cardio" className="text-sm text-gray-600 hover:text-gray-900">Cardio</Link>
          <Link href="/meal-plan" className="text-sm text-gray-600 hover:text-gray-900">Meal Plan</Link>
          <Link href="/schema" className="text-sm text-gray-600 hover:text-gray-900">Schema</Link>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
