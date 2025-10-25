import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/tenants/[id] - Get a single tenant
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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
      where: { id: payload.userId }
    })

    if (!user || !user.superuser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            places: true,
            checkpoints: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { error: 'Error al obtener tenant' },
      { status: 500 }
    )
  }
}

// PUT /api/tenants/[id] - Update a tenant
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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
      where: { id: payload.userId }
    })

    if (!user || !user.superuser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { name, slug, isActive } = await req.json()

    // Check if slug is being changed and if it's already in use
    if (slug) {
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          slug,
          NOT: { id: params.id }
        }
      })

      if (existingTenant) {
        return NextResponse.json(
          { error: 'El slug ya está en uso' },
          { status: 400 }
        )
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tenant' },
      { status: 500 }
    )
  }
}

// DELETE /api/tenants/[id] - Delete a tenant
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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
      where: { id: payload.userId }
    })

    if (!user || !user.superuser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Check if tenant has users
    const tenantWithUsers = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (tenantWithUsers && tenantWithUsers._count.users > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un tenant con usuarios asociados' },
        { status: 400 }
      )
    }

    await prisma.tenant.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Tenant eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json(
      { error: 'Error al eliminar tenant' },
      { status: 500 }
    )
  }
}
