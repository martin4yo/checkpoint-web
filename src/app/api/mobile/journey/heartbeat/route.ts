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
    const { latitude, longitude, timestamp, app_state } = body

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

    // Guardar la ubicación
    await prisma.journeyLocation.create({
      data: {
        userId: payload.userId,
        startCheckpointId: activeJourney.id,
        latitude,
        longitude,
        recordedAt: new Date(timestamp || Date.now()),
        tenantId: user.tenantId,
      }
    })

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
        appState: app_state || 'unknown', // Estado de la app: 'active', 'background', 'inactive'
        alertSent: false // Reset alert si recibimos heartbeat
      },
      create: {
        userId: payload.userId,
        journeyId: activeJourney.id,
        lastHeartbeat: new Date(),
        lastLocation: { latitude, longitude },
        appState: app_state || 'unknown',
        alertSent: false,
        tenantId: user.tenantId,
      }
    })

    console.log('💓 Heartbeat registrado en monitor de jornada - Estado:', app_state || 'unknown')

    return NextResponse.json({
      success: true,
      message: 'Heartbeat registrado'
    })

  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al registrar heartbeat'
    }, { status: 500 })
  }
}