import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/novelty-types - List all novelty types
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

    // Filter by tenant (superusers can see all)
    const whereClause = currentUser.superuser ? {} : { tenantId: currentUser.tenantId }

    const noveltyTypes = await prisma.noveltyType.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            novelties: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(noveltyTypes)
  } catch (error) {
    console.error('Error fetching novelty types:', error)
    return NextResponse.json({ error: 'Error al obtener tipos de novedades' }, { status: 500 })
  }
}

// POST /api/novelty-types - Create a new novelty type
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

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const {
      name,
      description,
      color,
      icon,
      requiresAmount,
      requiresDate,
      requiresDateRange,
      allowsAttachments,
      isActive
    } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const noveltyType = await prisma.noveltyType.create({
      data: {
        name,
        description,
        color: color || '#3B82F6',
        icon: icon || 'FileText',
        requiresAmount: requiresAmount || false,
        requiresDate: requiresDate || false,
        requiresDateRange: requiresDateRange || false,
        allowsAttachments: allowsAttachments || false,
        isActive: isActive !== undefined ? isActive : true,
        tenantId: currentUser.tenantId
      }
    })

    return NextResponse.json(noveltyType, { status: 201 })
  } catch (error) {
    console.error('Error creating novelty type:', error)
    return NextResponse.json({ error: 'Error al crear tipo de novedad' }, { status: 500 })
  }
}

// PUT /api/novelty-types - Update a novelty type
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
      select: { id: true, tenantId: true, superuser: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const {
      id,
      name,
      description,
      color,
      icon,
      requiresAmount,
      requiresDate,
      requiresDateRange,
      allowsAttachments,
      isActive
    } = await req.json()

    if (!id || !name) {
      return NextResponse.json({ error: 'ID y nombre son requeridos' }, { status: 400 })
    }

    const noveltyType = await prisma.noveltyType.update({
      where: { id },
      data: {
        name,
        description,
        color,
        icon,
        requiresAmount,
        requiresDate,
        requiresDateRange,
        allowsAttachments,
        isActive
      }
    })

    return NextResponse.json(noveltyType)
  } catch (error) {
    console.error('Error updating novelty type:', error)
    return NextResponse.json({ error: 'Error al actualizar tipo de novedad' }, { status: 500 })
  }
}

// DELETE /api/novelty-types - Delete a novelty type
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Check if there are novelties using this type
    const noveltiesCount = await prisma.novelty.count({
      where: { noveltyTypeId: id }
    })

    if (noveltiesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un tipo de novedad con novedades asociadas' },
        { status: 400 }
      )
    }

    await prisma.noveltyType.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting novelty type:', error)
    return NextResponse.json({ error: 'Error al eliminar tipo de novedad' }, { status: 500 })
  }
}
