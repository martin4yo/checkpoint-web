import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { hashFingerprint } from '@/lib/biometric'

/**
 * POST /api/mobile/biometric/enroll/fingerprint
 *
 * Registra el hash de huella digital de un usuario
 * El hash viene del sensor biométrico del dispositivo Android
 */
export async function POST(req: NextRequest) {
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

    const { fingerprintHash, consentSigned, replaceExisting } = await req.json()

    // Validaciones
    if (!fingerprintHash || typeof fingerprintHash !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Hash de huella digital requerido' },
        { status: 400 }
      )
    }

    if (!consentSigned) {
      return NextResponse.json(
        { success: false, error: 'Debe aceptar el consentimiento para datos biométricos' },
        { status: 400 }
      )
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    console.log(`🔍 Registrando huella digital para usuario ${user.email}`)

    // Hashear el hash de huella (doble hash para seguridad)
    const hashedFingerprint = await hashFingerprint(fingerprintHash)

    // Verificar si ya existe registro biométrico
    const existing = await prisma.biometricData.findUnique({
      where: { userId: user.id }
    })

    if (existing?.fingerprintHash && !replaceExisting) {
      return NextResponse.json(
        {
          success: false,
          error: 'El usuario ya tiene huella digital registrada. Use replaceExisting=true para reemplazar.'
        },
        { status: 409 }
      )
    }

    // Guardar o actualizar datos biométricos
    const biometricData = await prisma.biometricData.upsert({
      where: { userId: user.id },
      update: {
        fingerprintHash: hashedFingerprint,
        consentSigned: consentSigned,
        consentDate: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        tenantId: user.tenantId,
        fingerprintHash: hashedFingerprint,
        enrolledById: payload.userId,
        consentSigned: consentSigned,
        consentDate: new Date(),
        isActive: true
      }
    })

    console.log(`✅ Huella digital guardada para usuario ${user.email}`)

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        enrolledAt: biometricData.enrolledAt
      },
      message: 'Huella digital registrada exitosamente'
    })
  } catch (error: any) {
    console.error('Error en enroll/fingerprint:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al registrar huella digital',
        details: error.message
      },
      { status: 500 }
    )
  }
}
