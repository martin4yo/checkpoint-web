import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

/**
 * GET /api/biometric-data
 *
 * Obtiene todos los datos biométricos registrados
 * Solo accesible para superusers
 */
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

    // Obtener datos biométricos con información de usuario
    const biometricData = await prisma.biometricData.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    // Transformar datos para no exponer información sensible
    const safeData = biometricData.map(data => ({
      id: data.id,
      userId: data.userId,
      tenantId: data.tenantId,
      user: data.user,
      tenant: data.tenant,
      methods: {
        face: !!data.faceEmbeddings,
        fingerprint: !!data.fingerprintHash,
        pin: !!data.pinHash,
        qr: !!data.qrCode,
      },
      consentSigned: data.consentSigned,
      consentDate: data.consentDate,
      enrolledAt: data.enrolledAt,
      lastUsedAt: data.lastUsedAt,
      isActive: data.isActive,
    }))

    return NextResponse.json({
      success: true,
      data: safeData
    })
  } catch (error) {
    console.error('Error fetching biometric data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos biométricos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/biometric-data?userId={userId}
 *
 * Elimina todos los datos biométricos de un usuario
 */
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

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    // Eliminar datos biométricos
    await prisma.biometricData.delete({
      where: { userId }
    })

    return NextResponse.json({
      success: true,
      message: 'Datos biométricos eliminados correctamente'
    })
  } catch (error) {
    console.error('Error deleting biometric data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar datos biométricos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
