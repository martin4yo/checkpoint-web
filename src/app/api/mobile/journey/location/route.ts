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

    // Buscar jornada activa (último JOURNEY_START sin JOURNEY_END)
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

    // Verificar si tiene un JOURNEY_END posterior
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
        error: 'No tienes jornada activa'
      }, { status: 400 })
    }

    // Agregar ubicación intermedia a la jornada
    await prisma.journeyLocation.create({
      data: {
        userId: payload.userId,
        startCheckpointId: activeJourney.id,
        latitude,
        longitude,
        recordedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Ubicación registrada'
    })

  } catch (error) {
    console.error('Add journey location error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al registrar ubicación'
    }, { status: 500 })
  }
}