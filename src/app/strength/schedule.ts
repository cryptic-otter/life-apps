export const MUSCLE_GROUPS = ['back', 'bis', 'chest', 'tris', 'shoulders', 'legs'] as const
export type MuscleGroup = typeof MUSCLE_GROUPS[number]

export const SCHEDULE: Record<number, MuscleGroup[]> = {
  2: ['legs', 'shoulders'],  // Tuesday
  4: ['chest', 'tris'],      // Thursday
  5: ['back', 'bis'],        // Friday
}
// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
