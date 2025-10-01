import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await req.json()
    const { latitude, longitude } = body

    // Buscar jornada activa
    const journey = await prisma.journey.findFirst({
      where: {
        userId: payload.userId,
        status: 'ACTIVE'
      }
    })

    if (!journey) {
      return NextResponse.json({
        success: false,
        error: 'No tienes jornada activa'
      }, { status: 400 })
    }

    const endedAt = new Date()
    const durationMinutes = Math.floor((endedAt.getTime() - journey.startedAt.getTime()) / (1000 * 60))

    // Finalizar jornada
    const updatedJourney = await prisma.journey.update({
      where: { id: journey.id },
      data: {
        endLatitude: latitude,
        endLongitude: longitude,
        endedAt: endedAt,
        durationMinutes: durationMinutes,
        status: 'COMPLETED'
      }
    })

    // Contar ubicaciones registradas
    const totalLocations = await prisma.journeyLocation.count({
      where: { journeyId: journey.id }
    })

    return NextResponse.json({
      success: true,
      data: {
        journey_id: updatedJourney.id,
        duration_minutes: durationMinutes,
        total_locations: totalLocations
      }
    })

  } catch (error) {
    console.error('End journey error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al finalizar jornada'
    }, { status: 500 })
  }
}