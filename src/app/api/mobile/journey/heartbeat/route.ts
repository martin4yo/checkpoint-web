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
    const { latitude, longitude, isMoving, timestamp } = body

    // Buscar jornada activa
    const activeJourney = await prisma.checkpoint.findFirst({
      where: {
        userId: payload.userId,
        type: CheckpointType.JOURNEY_START
      },
      orderBy: { timestamp: 'desc' }
    })

    if (!activeJourney) {
      return NextResponse.json({
        success: false,
        error: 'No tienes jornada activa'
      }, { status: 400 })
    }

    // Verificar si ya finalizó
    const journeyEnd = await prisma.checkpoint.findFirst({
      where: {
        userId: payload.userId,
        type: CheckpointType.JOURNEY_END,
        timestamp: { gt: activeJourney.timestamp }
      }
    })

    if (journeyEnd) {
      return NextResponse.json({
        success: false,
        error: 'La jornada ya finalizó'
      }, { status: 400 })
    }

    // Si el usuario se movió, guardar la ubicación
    if (isMoving !== false) {
      await prisma.journeyLocation.create({
        data: {
          userId: payload.userId,
          startCheckpointId: activeJourney.id,
          latitude,
          longitude,
          recordedAt: new Date(timestamp || Date.now())
        }
      })
    }

    // Actualizar o crear registro de monitoreo de jornada
    await prisma.journeyMonitor.upsert({
      where: {
        userId_journeyId: {
          userId: payload.userId,
          journeyId: activeJourney.id
        }
      },
      update: {
        lastHeartbeat: new Date(),
        lastLocation: { latitude, longitude },
        isMoving,
        alertSent: false // Reset alert si recibimos heartbeat
      },
      create: {
        userId: payload.userId,
        journeyId: activeJourney.id,
        lastHeartbeat: new Date(),
        lastLocation: { latitude, longitude },
        isMoving,
        alertSent: false
      }
    })

    console.log('💓 Heartbeat registrado en monitor de jornada')

    // Verificar si hace mucho que no se mueve (más de 30 minutos sin cambio de ubicación)
    const lastLocationUpdate = await prisma.journeyLocation.findFirst({
      where: { startCheckpointId: activeJourney.id },
      orderBy: { recordedAt: 'desc' }
    })

    const minutesSinceLastMove = lastLocationUpdate
      ? Math.floor((Date.now() - lastLocationUpdate.recordedAt.getTime()) / (1000 * 60))
      : Math.floor((Date.now() - activeJourney.timestamp.getTime()) / (1000 * 60))

    return NextResponse.json({
      success: true,
      message: 'Heartbeat registrado',
      data: {
        minutesSinceLastMove,
        shouldSendNotification: minutesSinceLastMove > 30 && !isMoving
      }
    })

  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al registrar heartbeat'
    }, { status: 500 })
  }
}