import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        tenantId: true,
        superuser: true
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userId = searchParams.get('userId')
    const placeId = searchParams.get('placeId')
    const tenantIdParam = searchParams.get('tenantId')

    // Determine which tenantId to filter by
    let filterTenantId = currentUser.tenantId

    // If user is superuser and specifies a tenantId, use that
    if (currentUser.superuser && tenantIdParam) {
      filterTenantId = tenantIdParam
    }

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

    // Add tenant filter to user relation
    where.user = {
      tenantId: filterTenantId
    }

    const checkpoints = await prisma.checkpoint.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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