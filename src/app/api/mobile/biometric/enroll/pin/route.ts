import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { hashPin } from '@/lib/biometric'

/**
 * POST /api/mobile/biometric/enroll/pin
 *
 * Registra un PIN de 6 dígitos como método de backup
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

    const { pin, replaceExisting } = await req.json()

    // Validaciones
    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'El PIN debe ser de 6 dígitos numéricos' },
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

    console.log(`🔍 Registrando PIN para usuario ${user.email}`)

    // Hashear PIN
    const hashedPin = await hashPin(pin)

    // Verificar si ya existe registro biométrico
    const existing = await prisma.biometricData.findUnique({
      where: { userId: user.id }
    })

    if (existing?.pinHash && !replaceExisting) {
      return NextResponse.json(
        {
          success: false,
          error: 'El usuario ya tiene PIN registrado. Use replaceExisting=true para reemplazar.'
        },
        { status: 409 }
      )
    }

    // Guardar o actualizar datos biométricos
    const biometricData = await prisma.biometricData.upsert({
      where: { userId: user.id },
      update: {
        pinHash: hashedPin,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        tenantId: user.tenantId,
        pinHash: hashedPin,
        enrolledById: payload.userId,
        consentSigned: true, // PIN no requiere consentimiento especial
        consentDate: new Date(),
        isActive: true
      }
    })

    console.log(`✅ PIN guardado para usuario ${user.email}`)

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        enrolledAt: biometricData.enrolledAt
      },
      message: 'PIN registrado exitosamente'
    })
  } catch (error: any) {
    console.error('Error en enroll/pin:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al registrar PIN',
        details: error.message
      },
      { status: 500 }
    )
  }
}
