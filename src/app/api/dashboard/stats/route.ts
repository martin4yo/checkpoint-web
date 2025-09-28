import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalUsers, totalPlaces, totalCheckpoints, todayCheckpoints] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.place.count({ where: { isActive: true } }),
      prisma.checkpoint.count(),
      prisma.checkpoint.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalPlaces,
      totalCheckpoints,
      todayCheckpoints,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}