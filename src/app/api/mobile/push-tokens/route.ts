import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { PushNotificationService } from '@/lib/push-notifications'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await req.json()
    const { deviceId, pushToken, platform, description } = body

    if (!deviceId || !pushToken || !platform) {
      return NextResponse.json({
        error: 'deviceId, pushToken y platform son requeridos'
      }, { status: 400 })
    }

    // Validar token con Firebase antes de guardarlo
    const isValidToken = await PushNotificationService.validateToken(pushToken)
    if (!isValidToken) {
      return NextResponse.json({
        error: 'Token de push inválido'
      }, { status: 400 })
    }

    // Actualizar o crear token
    const pushTokenRecord = await prisma.pushToken.upsert({
      where: { deviceId },
      update: {
        token: pushToken,
        platform,
        description,
        isActive: true,
        userId: payload.userId,
        updatedAt: new Date()
      },
      create: {
        deviceId,
        token: pushToken,
        platform,
        description,
        userId: payload.userId,
        isActive: true
      }
    })

    console.log('📱 Token de push registrado:', {
      deviceId,
      platform,
      userId: payload.userId
    })

    return NextResponse.json({
      success: true,
      message: 'Token de push registrado exitosamente',
      data: {
        id: pushTokenRecord.id,
        deviceId: pushTokenRecord.deviceId,
        platform: pushTokenRecord.platform
      }
    })

  } catch (error) {
    console.error('Error registrando token de push:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al registrar token de push'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener tokens del usuario
    const userTokens = await prisma.pushToken.findMany({
      where: {
        userId: payload.userId,
        isActive: true
      },
      select: {
        id: true,
        deviceId: true,
        platform: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: userTokens
    })

  } catch (error) {
    console.error('Error obteniendo tokens de push:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener tokens de push'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await req.json()
    const { deviceId } = body

    if (!deviceId) {
      return NextResponse.json({
        error: 'deviceId es requerido'
      }, { status: 400 })
    }

    // Marcar token como inactivo (no eliminar físicamente)
    await prisma.pushToken.updateMany({
      where: {
        deviceId,
        userId: payload.userId
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    console.log('📱 Token de push desactivado:', { deviceId, userId: payload.userId })

    return NextResponse.json({
      success: true,
      message: 'Token de push desactivado'
    })

  } catch (error) {
    console.error('Error desactivando token de push:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al desactivar token de push'
    }, { status: 500 })
  }
}