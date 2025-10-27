import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import {
  extractFaceEmbedding,
  decryptFaceEmbeddings,
  verifyFaceEmbedding,
  verifyFingerprint,
  verifyPin,
  validateQRCode
} from '@/lib/biometric'

/**
 * POST /api/mobile/biometric/login
 *
 * Login utilizando biometría (rostro, huella, PIN o QR)
 *
 * Body:
 * {
 *   method: 'FACE' | 'FINGERPRINT' | 'PIN' | 'QR',
 *   data: <datos biométricos>,
 *   email?: string // Opcional para FINGERPRINT o PIN
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { method, data, email } = await req.json()

    // Validar método
    if (!['FACE', 'FINGERPRINT', 'PIN', 'QR'].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Método biométrico inválido' },
        { status: 400 }
      )
    }

    console.log(`🔐 Intento de login biométrico con método: ${method}`)

    let verifiedUserId: string | null = null
    let confidence: number = 0

    // Verificar identidad según el método
    switch (method) {
      case 'FACE':
        const faceResult = await verifyFaceLogin(data)
        if (!faceResult.isValid) {
          return NextResponse.json(
            { success: false, error: 'Rostro no reconocido' },
            { status: 401 }
          )
        }
        verifiedUserId = faceResult.userId!
        confidence = faceResult.confidence!
        break

      case 'FINGERPRINT':
        if (!email) {
          return NextResponse.json(
            { success: false, error: 'Email requerido para login con huella digital' },
            { status: 400 }
          )
        }
        const fingerprintResult = await verifyFingerprintLogin(data, email)
        if (!fingerprintResult.isValid) {
          return NextResponse.json(
            { success: false, error: 'Huella digital no reconocida' },
            { status: 401 }
          )
        }
        verifiedUserId = fingerprintResult.userId!
        confidence = 1.0
        break

      case 'PIN':
        if (!email) {
          return NextResponse.json(
            { success: false, error: 'Email requerido para login con PIN' },
            { status: 400 }
          )
        }
        const pinResult = await verifyPinLogin(data, email)
        if (!pinResult.isValid) {
          return NextResponse.json(
            { success: false, error: 'PIN incorrecto' },
            { status: 401 }
          )
        }
        verifiedUserId = pinResult.userId!
        confidence = 1.0
        break

      case 'QR':
        const qrResult = await verifyQRLogin(data)
        if (!qrResult.isValid) {
          return NextResponse.json(
            { success: false, error: 'Código QR inválido o expirado' },
            { status: 401 }
          )
        }
        verifiedUserId = qrResult.userId!
        confidence = 1.0
        break
    }

    if (!verifiedUserId) {
      return NextResponse.json(
        { success: false, error: 'No se pudo verificar la identidad' },
        { status: 401 }
      )
    }

    // Obtener usuario completo
    const user = await prisma.user.findUnique({
      where: { id: verifiedUserId },
      include: {
        assignments: {
          include: {
            place: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Generar token JWT
    const token = await generateToken({ userId: user.id, email: user.email })

    // Actualizar lastUsedAt en biometric_data
    await prisma.biometricData.update({
      where: { userId: user.id },
      data: { lastUsedAt: new Date() }
    })

    console.log(`✅ Login biométrico exitoso: ${user.firstName} ${user.lastName} - ${method}`)

    // Retornar respuesta en el mismo formato que /api/mobile/auth/login
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          tenantId: user.tenantId,
        },
        token,
        places: user.assignments.map(a => ({
          id: a.place.id,
          name: a.place.name,
          address: a.place.address,
          latitude: a.place.latitude,
          longitude: a.place.longitude,
        })),
        biometricLogin: true,
        method: method,
        confidence: confidence
      },
    })
  } catch (error: unknown) {
    console.error('Error en biometric/login:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al iniciar sesión con biometría',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ==================== FUNCIONES DE VERIFICACIÓN PARA LOGIN ====================

async function verifyFaceLogin(imageBase64: string) {
  try {
    console.log('🔍 Verificando rostro para login...')

    // Extraer embedding de la imagen capturada
    const newEmbedding = await extractFaceEmbedding(imageBase64)

    // Buscar en todos los usuarios activos
    const allBiometricData = await prisma.biometricData.findMany({
      where: {
        isActive: true,
        faceEmbeddings: { not: null }
      },
      select: { userId: true, faceEmbeddings: true }
    })

    let bestMatch: { userId: string; confidence: number } | null = null

    for (const data of allBiometricData) {
      if (!data.faceEmbeddings) continue

      try {
        const storedEmbeddings = decryptFaceEmbeddings(data.faceEmbeddings)
        const result = verifyFaceEmbedding(newEmbedding.descriptor, storedEmbeddings)

        if (result.isMatch) {
          // Guardar el mejor match
          if (!bestMatch || result.confidence > bestMatch.confidence) {
            bestMatch = {
              userId: data.userId,
              confidence: result.confidence
            }
          }
        }
      } catch (error) {
        console.error(`Error verificando usuario ${data.userId}:`, error)
        continue
      }
    }

    if (bestMatch) {
      console.log(`✅ Usuario identificado por rostro: ${bestMatch.userId} (confidence: ${bestMatch.confidence.toFixed(2)})`)
      return {
        isValid: true,
        userId: bestMatch.userId,
        confidence: bestMatch.confidence
      }
    }

    console.log('❌ Rostro no reconocido')
    return { isValid: false }
  } catch (error: unknown) {
    console.error('Error en verifyFaceLogin:', error)
    throw error
  }
}

async function verifyFingerprintLogin(fingerprintHash: string, email: string) {
  try {
    console.log('🔍 Verificando huella digital para login...')

    // Obtener usuario por email
    const user = await prisma.user.findUnique({
      where: { email, isActive: true },
      select: { id: true }
    })

    if (!user) {
      return { isValid: false }
    }

    // Verificar huella
    const biometricData = await prisma.biometricData.findUnique({
      where: { userId: user.id, isActive: true },
      select: { userId: true, fingerprintHash: true }
    })

    if (!biometricData?.fingerprintHash) {
      return { isValid: false }
    }

    const isValid = await verifyFingerprint(fingerprintHash, biometricData.fingerprintHash)

    console.log(`${isValid ? '✅' : '❌'} Verificación de huella digital para login`)

    return {
      isValid,
      userId: biometricData.userId
    }
  } catch (error: unknown) {
    console.error('Error en verifyFingerprintLogin:', error)
    throw error
  }
}

async function verifyPinLogin(pin: string, email: string) {
  try {
    console.log('🔍 Verificando PIN para login...')

    // Obtener usuario por email
    const user = await prisma.user.findUnique({
      where: { email, isActive: true },
      select: { id: true }
    })

    if (!user) {
      return { isValid: false }
    }

    // Verificar PIN
    const biometricData = await prisma.biometricData.findUnique({
      where: { userId: user.id, isActive: true },
      select: { userId: true, pinHash: true }
    })

    if (!biometricData?.pinHash) {
      return { isValid: false }
    }

    const isValid = await verifyPin(pin, biometricData.pinHash)

    console.log(`${isValid ? '✅' : '❌'} Verificación de PIN para login`)

    return {
      isValid,
      userId: biometricData.userId
    }
  } catch (error: unknown) {
    console.error('Error en verifyPinLogin:', error)
    throw error
  }
}

async function verifyQRLogin(qrCode: string) {
  try {
    console.log('🔍 Verificando código QR para login...')

    const validation = validateQRCode(qrCode)

    if (!validation.isValid || !validation.userId) {
      return { isValid: false }
    }

    // Verificar que el código existe en la base de datos
    const biometricData = await prisma.biometricData.findFirst({
      where: {
        userId: validation.userId,
        tenantId: validation.tenantId,
        qrCode: qrCode,
        isActive: true
      },
      select: { userId: true }
    })

    if (!biometricData) {
      console.log('❌ Código QR no encontrado en base de datos')
      return { isValid: false }
    }

    console.log(`✅ Usuario identificado por QR: ${biometricData.userId}`)

    return {
      isValid: true,
      userId: biometricData.userId
    }
  } catch (error: unknown) {
    console.error('Error en verifyQRLogin:', error)
    throw error
  }
}
