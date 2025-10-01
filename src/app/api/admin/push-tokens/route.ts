import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceId, pushToken, platform, description, adminSecret } = body

    // Verificar clave de administrador (opcional: para mayor seguridad)
    if (process.env.ADMIN_SECRET && adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({
        error: 'Clave de administrador inválida'
      }, { status: 401 })
    }

    if (!deviceId || !pushToken || !platform) {
      return NextResponse.json({
        error: 'deviceId, pushToken y platform son requeridos'
      }, { status: 400 })
    }

    // Registrar token administrativo
    const pushTokenRecord = await prisma.pushToken.upsert({
      where: { deviceId },
      update: {
        token: pushToken,
        platform,
        description: description || 'Dispositivo Administrativo',
        isActive: true,
        isAdminDevice: true,
        userId: null, // Los tokens admin no están asociados a un usuario específico
        updatedAt: new Date()
      },
      create: {
        deviceId,
        token: pushToken,
        platform,
        description: description || 'Dispositivo Administrativo',
        isActive: true,
        isAdminDevice: true,
        userId: null
      }
    })

    console.log('👨‍💼 Token administrativo registrado:', {
      deviceId,
      platform,
      description
    })

    return NextResponse.json({
      success: true,
      message: 'Token administrativo registrado',
      data: {
        id: pushTokenRecord.id,
        deviceId: pushTokenRecord.deviceId,
        platform: pushTokenRecord.platform,
        description: pushTokenRecord.description
      }
    })

  } catch (error) {
    console.error('Error registrando token administrativo:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al registrar token administrativo'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Obtener todos los tokens administrativos activos
    const adminTokens = await prisma.pushToken.findMany({
      where: {
        isAdminDevice: true,
        isActive: true
      },
      select: {
        id: true,
        deviceId: true,
        platform: true,
        description: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: adminTokens
    })

  } catch (error) {
    console.error('Error obteniendo tokens administrativos:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener tokens administrativos'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceId, adminSecret } = body

    // Verificar clave de administrador
    if (process.env.ADMIN_SECRET && adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({
        error: 'Clave de administrador inválida'
      }, { status: 401 })
    }

    if (!deviceId) {
      return NextResponse.json({
        error: 'deviceId es requerido'
      }, { status: 400 })
    }

    // Desactivar token administrativo
    await prisma.pushToken.updateMany({
      where: {
        deviceId,
        isAdminDevice: true
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    console.log('👨‍💼 Token administrativo desactivado:', { deviceId })

    return NextResponse.json({
      success: true,
      message: 'Token administrativo desactivado'
    })

  } catch (error) {
    console.error('Error desactivando token administrativo:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al desactivar token administrativo'
    }, { status: 500 })
  }
}