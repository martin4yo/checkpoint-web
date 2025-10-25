import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Obtener novedades del usuario
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener el usuario para conseguir su tenantId
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tenantId: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Obtener novedades del usuario
    const novelties = await prisma.novelty.findMany({
      where: {
        userId: decoded.userId,
        tenantId: user.tenantId,
      },
      include: {
        noveltyType: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: novelties,
    })
  } catch (error) {
    console.error('Error getting novelties:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva novedad
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener el usuario para conseguir su tenantId
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tenantId: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const { noveltyTypeId, amount, date, startDate, endDate, notes } = await req.json()

    if (!noveltyTypeId) {
      return NextResponse.json(
        { success: false, error: 'Tipo de novedad requerido' },
        { status: 400 }
      )
    }

    // Verificar que el tipo de novedad existe y pertenece al tenant
    const noveltyType = await prisma.noveltyType.findFirst({
      where: {
        id: noveltyTypeId,
        tenantId: user.tenantId,
        isActive: true,
      },
    })

    if (!noveltyType) {
      return NextResponse.json(
        { success: false, error: 'Tipo de novedad no encontrado' },
        { status: 404 }
      )
    }

    // Validar campos requeridos según configuración del tipo
    if (noveltyType.requiresAmount && !amount) {
      return NextResponse.json(
        { success: false, error: 'Este tipo de novedad requiere un importe' },
        { status: 400 }
      )
    }

    if (noveltyType.requiresDate && !date) {
      return NextResponse.json(
        { success: false, error: 'Este tipo de novedad requiere una fecha' },
        { status: 400 }
      )
    }

    if (noveltyType.requiresDateRange && (!startDate || !endDate)) {
      return NextResponse.json(
        { success: false, error: 'Este tipo de novedad requiere un rango de fechas' },
        { status: 400 }
      )
    }

    // Crear la novedad
    const novelty = await prisma.novelty.create({
      data: {
        userId: decoded.userId,
        noveltyTypeId,
        tenantId: user.tenantId,
        amount: amount ? parseFloat(amount) : null,
        date: date ? new Date(date) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        noveltyType: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: novelty,
    })
  } catch (error) {
    console.error('Error creating novelty:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
