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
    const { place_id, place_name, latitude, longitude } = body

    // Verificar si ya tiene una jornada activa (checkpoint JOURNEY_START sin JOURNEY_END)
    const activeJourney = await prisma.checkpoint.findFirst({
      where: {
        userId: payload.userId,
        type: 'JOURNEY_START'
      },
      orderBy: { timestamp: 'desc' }
    })

    if (activeJourney) {
      // Verificar si tiene un JOURNEY_END posterior
      const journeyEnd = await prisma.checkpoint.findFirst({
        where: {
          userId: payload.userId,
          type: 'JOURNEY_END',
          timestamp: { gt: activeJourney.timestamp }
        }
      })

      if (!journeyEnd) {
        return NextResponse.json({
          success: false,
          error: 'Ya tienes una jornada activa'
        }, { status: 400 })
      }
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
        type: 'JOURNEY_START',
        notes: 'Inicio de jornada laboral'
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