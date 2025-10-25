import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * GET /api/mobile/biometric/config
 *
 * Obtiene la configuración biométrica del tenant del usuario autenticado
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token no proporcionado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload?.userId) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener usuario para sacar el tenantId
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener configuración del tenant
    let config = await prisma.biometricConfig.findUnique({
      where: { tenantId: user.tenantId }
    })

    // Si no existe configuración, crear una con valores por defecto
    if (!config) {
      config = await prisma.biometricConfig.create({
        data: {
          tenantId: user.tenantId,
          faceEnabled: true,
          fingerprintEnabled: true,
          pinEnabled: true,
          qrEnabled: true,
          faceThreshold: 0.6,
          faceMinPhotos: 3,
          pinLength: 6,
          qrExpirationDays: null,
          requirePhotoOnClock: true,
          maxRetries: 3
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        faceEnabled: config.faceEnabled,
        fingerprintEnabled: config.fingerprintEnabled,
        pinEnabled: config.pinEnabled,
        qrEnabled: config.qrEnabled,
        faceThreshold: config.faceThreshold,
        faceMinPhotos: config.faceMinPhotos,
        pinLength: config.pinLength,
        requirePhotoOnClock: config.requirePhotoOnClock,
        maxRetries: config.maxRetries
      }
    })
  } catch (error: any) {
    console.error('Error en biometric/config:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener configuración biométrica',
        details: error.message
      },
      { status: 500 }
    )
  }
}
