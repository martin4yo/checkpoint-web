import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/tenants - List all tenants (for superusers or if no superusers exist)
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Check if there are any superusers in the system
    const existingSuperusers = await prisma.user.findMany({
      where: { superuser: true }
    })

    // Allow access if user is superuser OR if there are no superusers
    if (!user.superuser && existingSuperusers.length > 0) {
      return NextResponse.json(
        { error: 'No autorizado. Solo superusuarios pueden acceder.' },
        { status: 403 }
      )
    }

    const tenants = await prisma.tenant.findMany({
      orderBy: { name: 'asc' },
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

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Error al obtener tenants' },
      { status: 500 }
    )
  }
}

// POST /api/tenants - Create a new tenant (only for superusers)
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
      where: { id: payload.userId }
    })

    if (!user || !user.superuser) {
      return NextResponse.json(
        { error: 'No autorizado. Solo superusuarios pueden crear tenants.' },
        { status: 403 }
      )
    }

    const { name, slug, isActive } = await req.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nombre y slug son requeridos' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'El slug ya está en uso' },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Error al crear tenant' },
      { status: 500 }
    )
  }
}
