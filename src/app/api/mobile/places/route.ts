import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    // Obtener lugares asignados al usuario
    const assignments = await prisma.userPlaceAssignment.findMany({
      where: { userId: payload.userId },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    })

    const places = assignments.map(assignment => ({
      id: assignment.place.id,
      name: assignment.place.name,
      address: assignment.place.address,
      lat: assignment.place.latitude,
      lng: assignment.place.longitude,
    }))

    return NextResponse.json(places)
  } catch (error) {
    console.error('Get mobile places error:', error)
    return NextResponse.json({ error: 'Error al obtener lugares' }, { status: 500 })
  }
}