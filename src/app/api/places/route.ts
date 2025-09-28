import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    await prisma.place.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting place:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}