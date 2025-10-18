import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyToken } from '@/lib/auth'

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

    // Superusers can see all users, regular users only see users from their tenant
    const whereClause = currentUser.superuser ? {} : { tenantId: currentUser.tenantId }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
        superuser: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            assignments: true,
            checkpoints: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    const { name, email, password, tenantId } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
    }

    // Check if there are any superusers in the system
    const existingSuperusers = await prisma.user.findMany({
      where: { superuser: true }
    })

    // Determine tenant: use provided tenantId if superuser or if no superusers exist, otherwise use current user's tenant
    let finalTenantId = currentUser.tenantId
    if (tenantId && (currentUser.superuser || existingSuperusers.length === 0)) {
      finalTenantId = tenantId
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tenantId: finalTenantId,
        superuser: false, // New users are not superusers by default
      },
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
        superuser: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}

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

    const { id, name, email, password, tenantId, superuser } = await req.json()

    if (!id || !name || !email) {
      return NextResponse.json(
        { error: 'ID, nombre y email son requeridos' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      name,
      email,
    }

    if (password) {
      updateData.password = await hashPassword(password)
    }

    // Check if there are any superusers in the system
    const existingSuperusers = await prisma.user.findMany({
      where: { superuser: true }
    })

    // Only superusers can change tenant, OR anyone can if there are no superusers
    if (tenantId && (currentUser.superuser || existingSuperusers.length === 0)) {
      updateData.tenantId = tenantId
    }

    // Allow setting superuser only if there are no existing superusers
    if (superuser !== undefined && existingSuperusers.length === 0) {
      updateData.superuser = superuser
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
        superuser: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}