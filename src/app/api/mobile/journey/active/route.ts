import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar jornada activa
    const journey = await prisma.journey.findFirst({
      where: {
        userId: payload.userId,
        status: 'ACTIVE'
      },
      include: {
        locations: {
          orderBy: { recordedAt: 'asc' }
        }
      }
    })

    if (!journey) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    const now = new Date()
    const durationMinutes = Math.floor((now.getTime() - journey.startedAt.getTime()) / (1000 * 60))

    return NextResponse.json({
      success: true,
      data: {
        journey_id: journey.id,
        place_name: journey.placeName,
        started_at: journey.startedAt.toISOString(),
        duration_minutes: durationMinutes,
        total_locations: journey.locations.length
      }
    })

  } catch (error) {
    console.error('Get active journey error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener jornada activa'
    }, { status: 500 })
  }
}