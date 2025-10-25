import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    // Obtener tipos de novedades activos del tenant
    const noveltyTypes = await prisma.noveltyType.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        requiresAmount: true,
        requiresDate: true,
        requiresDateRange: true,
        allowsAttachments: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: noveltyTypes,
    })
  } catch (error) {
    console.error('Error getting novelty types:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
