import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Obtener todos los perfiles de exportación del tenant
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener tenantId del usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true, superuser: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener tenantId de query params si es superuser
    const { searchParams } = new URL(req.url)
    const tenantId = user.superuser && searchParams.get('tenantId')
      ? searchParams.get('tenantId')!
      : user.tenantId

    // Obtener perfiles del tenant
    const profiles = await prisma.legajoExportProfile.findMany({
      where: { tenantId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error fetching export profiles:', error)
    return NextResponse.json(
      { error: 'Error al obtener perfiles de exportación' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo perfil de exportación
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener tenantId del usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { name, description, selectedFields, includeJourneyData, journeyDateRange, isDefault } = body

    // Validaciones
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    if (!selectedFields || typeof selectedFields !== 'object') {
      return NextResponse.json({ error: 'Los campos seleccionados son requeridos' }, { status: 400 })
    }

    // Si se marca como default, desmarcar el default anterior
    if (isDefault) {
      await prisma.legajoExportProfile.updateMany({
        where: {
          tenantId: user.tenantId,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    // Crear perfil
    const profile = await prisma.legajoExportProfile.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        selectedFields,
        includeJourneyData: includeJourneyData ?? true,
        journeyDateRange: journeyDateRange || 'month',
        isDefault: isDefault ?? false
      }
    })

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Error creating export profile:', error)
    return NextResponse.json(
      { error: 'Error al crear perfil de exportación' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un perfil de exportación
export async function PUT(req: NextRequest) {
  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener tenantId del usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { id, name, description, selectedFields, includeJourneyData, journeyDateRange, isDefault } = body

    // Validaciones
    if (!id) {
      return NextResponse.json({ error: 'ID del perfil es requerido' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    // Verificar que el perfil pertenece al tenant del usuario
    const existingProfile = await prisma.legajoExportProfile.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    // Si se marca como default, desmarcar el default anterior
    if (isDefault && !existingProfile.isDefault) {
      await prisma.legajoExportProfile.updateMany({
        where: {
          tenantId: user.tenantId,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    // Actualizar perfil
    const profile = await prisma.legajoExportProfile.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        selectedFields,
        includeJourneyData: includeJourneyData ?? true,
        journeyDateRange: journeyDateRange || 'month',
        isDefault: isDefault ?? false
      }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error updating export profile:', error)
    return NextResponse.json(
      { error: 'Error al actualizar perfil de exportación' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un perfil de exportación
export async function DELETE(req: NextRequest) {
  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener tenantId del usuario
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
      return NextResponse.json({ error: 'ID del perfil es requerido' }, { status: 400 })
    }

    // Verificar que el perfil pertenece al tenant del usuario
    const existingProfile = await prisma.legajoExportProfile.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    // Eliminar perfil
    await prisma.legajoExportProfile.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting export profile:', error)
    return NextResponse.json(
      { error: 'Error al eliminar perfil de exportación' },
      { status: 500 }
    )
  }
}
