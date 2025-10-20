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
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { name, address, latitude, longitude } = await req.json()

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const place = await prisma.place.create({
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        tenantId: user.tenantId,
      },
    })

    return NextResponse.json(place, { status: 201 })
  } catch (error) {
    console.error('Create place error:', error)
    return NextResponse.json({ error: 'Error al crear lugar' }, { status: 500 })
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