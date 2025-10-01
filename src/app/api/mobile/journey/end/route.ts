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

    // Buscar jornada activa (último JOURNEY_START sin JOURNEY_END)
    const activeJourney = await prisma.checkpoint.findFirst({
      where: {
        userId: payload.userId,
        type: 'JOURNEY_START'
      },
      orderBy: { timestamp: 'desc' }
    })

    if (!activeJourney) {
      return NextResponse.json({
        success: false,
        error: 'No tienes jornada activa'
      }, { status: 400 })
    }

    // Verificar si ya tiene un JOURNEY_END posterior
    const journeyEnd = await prisma.checkpoint.findFirst({
      where: {
        userId: payload.userId,
        type: 'JOURNEY_END',
        timestamp: { gt: activeJourney.timestamp }
      }
    })

    if (journeyEnd) {
      return NextResponse.json({
        success: false,
        error: 'No tienes jornada activa'
      }, { status: 400 })
    }

    const endedAt = new Date()
    const durationMinutes = Math.floor((endedAt.getTime() - activeJourney.timestamp.getTime()) / (1000 * 60))

    // Crear checkpoint de fin de jornada
    const endCheckpoint = await prisma.checkpoint.create({
      data: {
        userId: payload.userId,
        placeId: activeJourney.placeId,
        placeName: activeJourney.placeName,
        latitude,
        longitude,
        timestamp: endedAt,
        type: 'JOURNEY_END',
        notes: `Fin de jornada laboral - Duración: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
      }
    })

    // Contar ubicaciones registradas durante la jornada
    const totalLocations = await prisma.journeyLocation.count({
      where: { startCheckpointId: activeJourney.id }
    })

    return NextResponse.json({
      success: true,
      data: {
        journey_id: activeJourney.id,
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