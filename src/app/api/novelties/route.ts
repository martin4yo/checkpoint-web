import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/novelties - List novelties
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Superusers can see all novelties from their tenant, regular users only see their own
    const whereClause = currentUser.superuser
      ? { tenantId: currentUser.tenantId }
      : { tenantId: currentUser.tenantId, userId: currentUser.id }

    const novelties = await prisma.novelty.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        noveltyType: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            requiresAmount: true,
            requiresDate: true,
            requiresDateRange: true,
            allowsAttachments: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            attachments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(novelties)
  } catch (error) {
    console.error('Error fetching novelties:', error)
    return NextResponse.json({ error: 'Error al obtener novedades' }, { status: 500 })
  }
}

// POST /api/novelties - Create a new novelty
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const {
      noveltyTypeId,
      amount,
      date,
      startDate,
      endDate,
      notes
    } = await req.json()

    if (!noveltyTypeId) {
      return NextResponse.json({ error: 'El tipo de novedad es requerido' }, { status: 400 })
    }

    // Validate that the novelty type exists and is active
    const noveltyType = await prisma.noveltyType.findUnique({
      where: { id: noveltyTypeId }
    })

    if (!noveltyType || !noveltyType.isActive) {
      return NextResponse.json({ error: 'Tipo de novedad no válido' }, { status: 400 })
    }

    const novelty = await prisma.novelty.create({
      data: {
        userId: currentUser.id,
        noveltyTypeId,
        amount: amount || null,
        date: date ? new Date(date) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes,
        tenantId: currentUser.tenantId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        noveltyType: true
      }
    })

    return NextResponse.json(novelty, { status: 201 })
  } catch (error) {
    console.error('Error creating novelty:', error)
    return NextResponse.json({ error: 'Error al crear novedad' }, { status: 500 })
  }
}

// PUT /api/novelties - Update a novelty
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const {
      id,
      noveltyTypeId,
      amount,
      date,
      startDate,
      endDate,
      notes
    } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Check if user owns this novelty or is superuser
    const existingNovelty = await prisma.novelty.findUnique({
      where: { id }
    })

    if (!existingNovelty) {
      return NextResponse.json({ error: 'Novedad no encontrada' }, { status: 404 })
    }

    if (existingNovelty.userId !== currentUser.id && !currentUser.superuser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Cannot edit approved novelties unless you're a superuser
    if (existingNovelty.status === 'APPROVED' && !currentUser.superuser) {
      return NextResponse.json(
        { error: 'No se pueden editar novedades aprobadas' },
        { status: 400 }
      )
    }

    const novelty = await prisma.novelty.update({
      where: { id },
      data: {
        noveltyTypeId: noveltyTypeId || existingNovelty.noveltyTypeId,
        amount: amount !== undefined ? amount : existingNovelty.amount,
        date: date ? new Date(date) : existingNovelty.date,
        startDate: startDate ? new Date(startDate) : existingNovelty.startDate,
        endDate: endDate ? new Date(endDate) : existingNovelty.endDate,
        notes: notes !== undefined ? notes : existingNovelty.notes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        noveltyType: true,
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(novelty)
  } catch (error) {
    console.error('Error updating novelty:', error)
    return NextResponse.json({ error: 'Error al actualizar novedad' }, { status: 500 })
  }
}

// DELETE /api/novelties - Delete a novelty
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Check if user owns this novelty or is superuser
    const existingNovelty = await prisma.novelty.findUnique({
      where: { id }
    })

    if (!existingNovelty) {
      return NextResponse.json({ error: 'Novedad no encontrada' }, { status: 404 })
    }

    if (existingNovelty.userId !== currentUser.id && !currentUser.superuser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Cannot delete approved novelties
    if (existingNovelty.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'No se pueden eliminar novedades aprobadas' },
        { status: 400 }
      )
    }

    await prisma.novelty.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting novelty:', error)
    return NextResponse.json({ error: 'Error al eliminar novedad' }, { status: 500 })
  }
}
