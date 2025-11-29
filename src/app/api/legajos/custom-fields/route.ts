import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Obtener todos los campos personalizados del tenant
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
    const tenantId = user.superuser && searchParams.get('tenantId')
      ? searchParams.get('tenantId')!
      : user.tenantId

    const customFields = await prisma.legajoCustomField.findMany({
      where: { tenantId },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({ customFields })
  } catch (error) {
    console.error('Error fetching custom fields:', error)
    return NextResponse.json(
      { error: 'Error al obtener campos personalizados' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo campo personalizado
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
    const { fieldName, fieldType, defaultValue, isRequired, order } = body

    if (!fieldName || !fieldName.trim()) {
      return NextResponse.json({ error: 'El nombre del campo es requerido' }, { status: 400 })
    }

    if (!fieldType) {
      return NextResponse.json({ error: 'El tipo de dato es requerido' }, { status: 400 })
    }

    // Verificar si ya existe un campo con el mismo nombre
    const existing = await prisma.legajoCustomField.findUnique({
      where: {
        tenantId_fieldName: {
          tenantId: user.tenantId,
          fieldName: fieldName.trim()
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un campo con ese nombre' },
        { status: 400 }
      )
    }

    const customField = await prisma.legajoCustomField.create({
      data: {
        tenantId: user.tenantId,
        fieldName: fieldName.trim(),
        fieldType,
        defaultValue: defaultValue?.trim() || null,
        isRequired: isRequired ?? false,
        order: order ?? 0
      }
    })

    return NextResponse.json({ customField }, { status: 201 })
  } catch (error) {
    console.error('Error creating custom field:', error)
    return NextResponse.json(
      { error: 'Error al crear campo personalizado' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un campo personalizado
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
    const { id, fieldName, fieldType, defaultValue, isRequired, order, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'ID del campo es requerido' }, { status: 400 })
    }

    // Verificar que el campo pertenece al tenant del usuario
    const existingField = await prisma.legajoCustomField.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existingField) {
      return NextResponse.json({ error: 'Campo no encontrado' }, { status: 404 })
    }

    const customField = await prisma.legajoCustomField.update({
      where: { id },
      data: {
        fieldName: fieldName?.trim() || existingField.fieldName,
        fieldType: fieldType || existingField.fieldType,
        defaultValue: defaultValue?.trim() ?? existingField.defaultValue,
        isRequired: isRequired ?? existingField.isRequired,
        order: order ?? existingField.order,
        isActive: isActive ?? existingField.isActive
      }
    })

    return NextResponse.json({ customField })
  } catch (error) {
    console.error('Error updating custom field:', error)
    return NextResponse.json(
      { error: 'Error al actualizar campo personalizado' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un campo personalizado
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
      return NextResponse.json({ error: 'ID del campo es requerido' }, { status: 400 })
    }

    // Verificar que el campo pertenece al tenant del usuario
    const existingField = await prisma.legajoCustomField.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existingField) {
      return NextResponse.json({ error: 'Campo no encontrado' }, { status: 404 })
    }

    // Eliminar campo (y sus valores asociados por CASCADE)
    await prisma.legajoCustomField.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom field:', error)
    return NextResponse.json(
      { error: 'Error al eliminar campo personalizado' },
      { status: 500 }
    )
  }
}
