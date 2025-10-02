import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { CheckpointType } from '@prisma/client'

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
        success: false,
        error: 'No tienes jornada activa'
      }, { status: 400 })
    }

    const endedAt = new Date()
    const durationMinutes = Math.floor((endedAt.getTime() - activeJourney.timestamp.getTime()) / (1000 * 60))

    // Actualizar el checkpoint de jornada con los datos de finalización
    await prisma.checkpoint.update({
      where: { id: activeJourney.id },
      data: {
        endLatitude: latitude,
        endLongitude: longitude,
        endTimestamp: endedAt,
        endNotes: `Duración: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
      }
    })

    // Crear la última ubicación de la jornada (ubicación de fin)
    await prisma.journeyLocation.create({
      data: {
        userId: payload.userId,
        startCheckpointId: activeJourney.id,
        latitude,
        longitude,
        recordedAt: endedAt
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