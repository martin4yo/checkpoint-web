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

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Filter by tenant (superusers can see all places from their tenant)
    const whereClause = currentUser.superuser
      ? {}
      : { tenantId: currentUser.tenantId }

    const places = await prisma.place.findMany({
      where: whereClause,
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

    if (!user.tenantId) {
      return NextResponse.json({ error: 'Usuario no tiene tenant asignado' }, { status: 400 })
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
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { id, name, address, latitude, longitude } = await req.json()

    if (!id || !name || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Verify place belongs to user's tenant (unless superuser)
    if (!currentUser.superuser) {
      const existingPlace = await prisma.place.findUnique({
        where: { id },
        select: { tenantId: true }
      })

      if (!existingPlace) {
        return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 })
      }

      if (existingPlace.tenantId !== currentUser.tenantId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
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
    return NextResponse.json({ error: 'Error al actualizar lugar' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Verify place belongs to user's tenant (unless superuser)
    if (!currentUser.superuser) {
      const existingPlace = await prisma.place.findUnique({
        where: { id },
        select: { tenantId: true }
      })

      if (!existingPlace) {
        return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 })
      }

      if (existingPlace.tenantId !== currentUser.tenantId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    await prisma.place.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting place:', error)
    return NextResponse.json({ error: 'Error al eliminar lugar' }, { status: 500 })
  }
}