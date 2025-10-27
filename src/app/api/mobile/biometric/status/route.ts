import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * GET /api/mobile/biometric/status
 *
 * Obtiene el estado de enrollment biométrico del usuario
 * Indica qué métodos tiene registrados
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

    // Obtener datos biométricos del usuario
    const biometricData = await prisma.biometricData.findUnique({
      where: { userId: payload.userId },
      select: {
        id: true,
        faceEmbeddings: true,
        fingerprintHash: true,
        pinHash: true,
        qrCode: true,
        consentSigned: true,
        consentDate: true,
        enrolledAt: true,
        lastUsedAt: true,
        isActive: true
      }
    })

    // Obtener datos del usuario y configuración del tenant
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true
      }
    })

    const config = user ? await prisma.biometricConfig.findUnique({
      where: { tenantId: user.tenantId }
    }) : null

    const response = {
      success: true,
      data: {
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          fullName: user ? `${user.firstName} ${user.lastName}` : ''
        },
        enrolled: !!biometricData,
        isActive: biometricData?.isActive ?? false,
        methods: {
          face: {
            enrolled: !!biometricData?.faceEmbeddings,
            enabled: config?.faceEnabled ?? true
          },
          fingerprint: {
            enrolled: !!biometricData?.fingerprintHash,
            enabled: config?.fingerprintEnabled ?? true
          },
          pin: {
            enrolled: !!biometricData?.pinHash,
            enabled: config?.pinEnabled ?? true
          },
          qr: {
            enrolled: !!biometricData?.qrCode,
            enabled: config?.qrEnabled ?? true
          }
        },
        consent: {
          signed: biometricData?.consentSigned ?? false,
          date: biometricData?.consentDate
        },
        enrolledAt: biometricData?.enrolledAt,
        lastUsedAt: biometricData?.lastUsedAt
      }
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('Error en biometric/status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estado biométrico',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
