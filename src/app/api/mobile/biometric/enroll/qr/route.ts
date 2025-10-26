import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { generateQRCode } from '@/lib/biometric'

/**
 * GET /api/mobile/biometric/enroll/qr
 *
 * Genera un código QR único para el usuario
 * El QR puede usarse como método de backup para fichaje
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

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, email: true, firstName: true, lastName: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    console.log(`🔍 Generando código QR para usuario ${user.email}`)

    // Verificar si ya existe código QR
    const existing = await prisma.biometricData.findUnique({
      where: { userId: user.id },
      select: { qrCode: true }
    })

    let qrCode: string
    let qrImageBase64: string

    if (existing?.qrCode) {
      // Ya existe un QR, regenerar la imagen
      const result = await generateQRCode(user.id, user.tenantId)
      qrCode = existing.qrCode
      qrImageBase64 = result.imageBase64
      console.log(`✅ QR existente recuperado para usuario ${user.email}`)
    } else {
      // Generar nuevo código QR
      const result = await generateQRCode(user.id, user.tenantId)
      qrCode = result.code
      qrImageBase64 = result.imageBase64

      // Guardar en base de datos
      await prisma.biometricData.upsert({
        where: { userId: user.id },
        update: {
          qrCode: qrCode,
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          tenantId: user.tenantId,
          qrCode: qrCode,
          enrolledById: payload.userId,
          consentSigned: true, // QR no requiere consentimiento especial
          consentDate: new Date(),
          isActive: true
        }
      })

      console.log(`✅ Nuevo código QR generado para usuario ${user.email}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        qrCode: qrCode,
        qrImage: qrImageBase64 // Base64 image for display
      },
      message: 'Código QR generado exitosamente'
    })
  } catch (error: unknown) {
    console.error('Error en enroll/qr:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar código QR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mobile/biometric/enroll/qr
 *
 * Regenera el código QR del usuario (útil si fue comprometido)
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

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tenantId: true, email: true, firstName: true, lastName: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    console.log(`🔄 Regenerando código QR para usuario ${user.email}`)

    // Generar nuevo código QR (siempre genera uno nuevo)
    const { code, imageBase64 } = await generateQRCode(user.id, user.tenantId)

    // Actualizar en base de datos
    await prisma.biometricData.upsert({
      where: { userId: user.id },
      update: {
        qrCode: code,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        tenantId: user.tenantId,
        qrCode: code,
        enrolledById: payload.userId,
        consentSigned: true,
        consentDate: new Date(),
        isActive: true
      }
    })

    console.log(`✅ Código QR regenerado para usuario ${user.email}`)

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        qrCode: code,
        qrImage: imageBase64
      },
      message: 'Código QR regenerado exitosamente'
    })
  } catch (error: unknown) {
    console.error('Error en regenerate QR:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al regenerar código QR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
