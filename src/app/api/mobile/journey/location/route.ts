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

    // Agregar ubicación a la jornada
    await prisma.journeyLocation.create({
      data: {
        journeyId: journey.id,
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