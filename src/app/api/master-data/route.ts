import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Obtener registros de una tabla específica
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
      where: { id: payload.userId },
      select: { tenantId: true, superuser: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const table = searchParams.get('table')
    const tenantId = user.superuser && searchParams.get('tenantId')
      ? searchParams.get('tenantId')!
      : user.tenantId

    if (!table) {
      return NextResponse.json({ error: 'Parámetro table es requerido' }, { status: 400 })
    }

    const records = await prisma.masterDataTable.findMany({
      where: {
        tenantId,
        table
      },
      orderBy: [
        { order: 'asc' },
        { code: 'asc' }
      ]
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Error fetching master data:', error)
    return NextResponse.json(
      { error: 'Error al obtener registros' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo registro
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

    const body = await req.json()
    const { table, code, description, order } = body

    if (!table || !code || !description) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Verificar si ya existe
    const existing = await prisma.masterDataTable.findUnique({
      where: {
        tenantId_table_code: {
          tenantId: user.tenantId,
          table,
          code
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un registro con ese código' },
        { status: 400 }
      )
    }

    const record = await prisma.masterDataTable.create({
      data: {
        tenantId: user.tenantId,
        table,
        code: code.trim(),
        description: description.trim(),
        order: order ?? 0
      }
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error('Error creating master data:', error)
    return NextResponse.json(
      { error: 'Error al crear registro' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar registro
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { id, code, description, isActive, order } = body

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Verificar que el registro pertenece al tenant
    const existing = await prisma.masterDataTable.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    const record = await prisma.masterDataTable.update({
      where: { id },
      data: {
        code: code?.trim() || existing.code,
        description: description?.trim() || existing.description,
        isActive: isActive ?? existing.isActive,
        order: order ?? existing.order
      }
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Error updating master data:', error)
    return NextResponse.json(
      { error: 'Error al actualizar registro' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar registro
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    // Verificar que el registro pertenece al tenant
    const existing = await prisma.masterDataTable.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    await prisma.masterDataTable.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting master data:', error)
    return NextResponse.json(
      { error: 'Error al eliminar registro' },
      { status: 500 }
    )
  }
}
