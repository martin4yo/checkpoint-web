import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { CheckpointType } from '@prisma/client'

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

    // Buscar jornada activa (JOURNEY_START sin endTimestamp)
    const activeJourney = await prisma.checkpoint.findFirst({
      where: {
        userId: payload.userId,
        type: CheckpointType.JOURNEY_START,
        endTimestamp: null
      }
    })

    if (!activeJourney) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    // Contar ubicaciones registradas
    const totalLocations = await prisma.journeyLocation.count({
      where: { startCheckpointId: activeJourney.id }
    })

    const now = new Date()
    const durationMinutes = Math.floor((now.getTime() - activeJourney.timestamp.getTime()) / (1000 * 60))

    return NextResponse.json({
      success: true,
      data: {
        journey_id: activeJourney.id,
        place_name: activeJourney.placeName,
        started_at: activeJourney.timestamp.toISOString(),
        duration_minutes: durationMinutes,
        total_locations: totalLocations
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