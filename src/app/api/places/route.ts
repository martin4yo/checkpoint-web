import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const places = await prisma.place.findMany({
      include: {
        _count: {
          select: {
            assignments: true,
            checkpoints: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(places)
  } catch (error) {
    console.error('Get places error:', error)
    return NextResponse.json({ error: 'Error al obtener lugares' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/places - Starting...')
    const token = req.cookies.get('token')?.value
    console.log('Token found:', !!token)

    if (!token) {
      console.log('No token in cookies')
      return NextResponse.json({ error: 'No autenticado - no hay token' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    console.log('Token payload:', payload)

    if (!payload) {
      console.log('Token verification failed')
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, name: true }
    })
    console.log('User found:', user)

    if (!user) {
      console.log('User not found for userId:', payload.userId)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (!user.tenantId) {
      console.log('User has no tenantId:', user)
      return NextResponse.json({ error: 'Usuario no tiene tenant asignado' }, { status: 400 })
    }

    const { name, address, latitude, longitude } = await req.json()

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    console.log('Creating place with tenantId:', user.tenantId)
    const place = await prisma.place.create({
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        tenantId: user.tenantId,
      },
    })

    console.log('Place created successfully:', place.id)
    return NextResponse.json(place, { status: 201 })
  } catch (error) {
    console.error('Create place error:', error)
    return NextResponse.json({ error: 'Error al crear lugar: ' + (error as Error).message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, address, latitude, longitude } = await req.json()

    if (!id || !name || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const place = await prisma.place.update({
      where: { id },
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    })

    return NextResponse.json(place)
  } catch (error) {
    console.error('Error updating place:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    await prisma.place.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting place:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}