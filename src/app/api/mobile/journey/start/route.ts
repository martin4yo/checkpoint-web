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

    // Verificar si ya tiene una jornada activa
    const activeJourney = await prisma.journey.findFirst({
      where: {
        userId: payload.userId,
        status: 'ACTIVE'
      }
    })

    if (activeJourney) {
      return NextResponse.json({
        success: false,
        error: 'Ya tienes una jornada activa'
      }, { status: 400 })
    }

    // Crear nueva jornada
    const journey = await prisma.journey.create({
      data: {
        userId: payload.userId,
        placeId: place_id || null,
        placeName: place_name,
        startLatitude: latitude,
        startLongitude: longitude,
        startedAt: new Date(),
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        journey_id: journey.id,
        status: journey.status,
        started_at: journey.startedAt.toISOString()
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