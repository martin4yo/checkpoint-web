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

    // Get user's tenantId
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { place_id, place_name, latitude, longitude } = body

    // Verificar si ya tiene una jornada activa (checkpoint JOURNEY_START sin endTimestamp)
    const activeJourney = await prisma.checkpoint.findFirst({
      where: {
        userId: payload.userId,
        type: CheckpointType.JOURNEY_START,
        endTimestamp: null
      }
    })

    if (activeJourney) {
      return NextResponse.json({
        success: false,
        error: 'Ya tienes una jornada activa'
      }, { status: 400 })
    }

    // Crear checkpoint de inicio de jornada
    const startCheckpoint = await prisma.checkpoint.create({
      data: {
        userId: payload.userId,
        placeId: place_id || null,
        placeName: place_name,
        latitude,
        longitude,
        timestamp: new Date(),
        type: CheckpointType.JOURNEY_START,
        notes: 'Inicio de jornada laboral',
        tenantId: user.tenantId,
      }
    })

    // Crear la primera ubicación de la jornada (ubicación de inicio)
    await prisma.journeyLocation.create({
      data: {
        userId: payload.userId,
        startCheckpointId: startCheckpoint.id,
        latitude,
        longitude,
        recordedAt: startCheckpoint.timestamp,
        tenantId: user.tenantId,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        journey_id: startCheckpoint.id,
        status: 'active',
        started_at: startCheckpoint.timestamp.toISOString()
      }
    })

  } catch (error) {
    console.error('Start journey error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al iniciar jornada'
    }, { status: 500 })
  }
}