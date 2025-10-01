import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userId = searchParams.get('userId')
    const placeId = searchParams.get('placeId')

    const where: Record<string, unknown> = {}

    if (search) {
      where.placeName = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (dateFrom) {
      where.timestamp = {
        ...(where.timestamp || {}),
        gte: new Date(dateFrom),
      }
    }

    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      where.timestamp = {
        ...(where.timestamp || {}),
        lte: endDate,
      }
    }

    if (userId) {
      where.userId = userId
    }

    if (placeId) {
      where.placeId = placeId
    }

    const checkpoints = await prisma.checkpoint.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        place: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        _count: {
          select: {
            journeyLocations: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    })

    return NextResponse.json(checkpoints)
  } catch (error) {
    console.error('Error fetching checkpoints:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    await prisma.checkpoint.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting checkpoint:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}