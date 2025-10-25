import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractFaceEmbedding,
  decryptFaceEmbeddings,
  verifyFaceEmbedding,
  verifyFingerprint,
  verifyPin,
  validateQRCode
} from '@/lib/biometric'

/**
 * POST /api/mobile/biometric/verify
 *
 * Endpoint unificado de verificación biométrica
 * Soporta: FACE, FINGERPRINT, PIN, QR
 *
 * Body:
 * {
 *   method: 'FACE' | 'FINGERPRINT' | 'PIN' | 'QR',
 *   data: <datos específicos del método>,
 *   userId?: string // Opcional, solo para QR o admin
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { method, data, userId, tenantId } = await req.json()

    // Validar método
    if (!['FACE', 'FINGERPRINT', 'PIN', 'QR'].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Método biométrico inválido' },
        { status: 400 }
      )
    }

    let verificationResult: {
      isValid: boolean
      userId?: string
      confidence?: number
      method: string
    }

    switch (method) {
      case 'FACE':
        verificationResult = await verifyFaceMethod(data, userId)
        break
      case 'FINGERPRINT':
        verificationResult = await verifyFingerprintMethod(data, userId)
        break
      case 'PIN':
        verificationResult = await verifyPinMethod(data, userId, tenantId)
        break
      case 'QR':
        verificationResult = await verifyQRMethod(data)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Método no implementado' },
          { status: 400 }
        )
    }

    if (verificationResult.isValid) {
      // Actualizar lastUsedAt
      if (verificationResult.userId) {
        await prisma.biometricData.update({
          where: { userId: verificationResult.userId },
          data: { lastUsedAt: new Date() }
        })
      }

      return NextResponse.json({
        success: true,
        data: verificationResult
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Verificación biométrica fallida',
          method: method
        },
        { status: 401 }
      )
    }
  } catch (error: unknown) {
    console.error('Error en biometric/verify:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al verificar datos biométricos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ==================== MÉTODOS DE VERIFICACIÓN ====================

async function verifyFaceMethod(imageBase64: string, userId?: string) {
  try {
    console.log('🔍 Verificando rostro...')

    // Extraer embedding de la imagen capturada
    const newEmbedding = await extractFaceEmbedding(imageBase64)

    // Si se proporciona userId, buscar solo ese usuario
    if (userId) {
      const biometricData = await prisma.biometricData.findUnique({
        where: { userId, isActive: true },
        select: { userId: true, faceEmbeddings: true, tenantId: true }
      })

      if (!biometricData?.faceEmbeddings) {
        return { isValid: false, method: 'FACE' }
      }

      const storedEmbeddings = decryptFaceEmbeddings(biometricData.faceEmbeddings)
      const result = verifyFaceEmbedding(newEmbedding.descriptor, storedEmbeddings)

      console.log(`✅ Verificación facial: ${result.isMatch} (confidence: ${result.confidence.toFixed(2)})`)

      return {
        isValid: result.isMatch,
        userId: biometricData.userId,
        confidence: result.confidence,
        method: 'FACE'
      }
    }

    // Si no se proporciona userId, buscar en todos los usuarios (para terminal de fichaje)
    // Esto es más lento pero permite fichaje sin identificación previa
    const allBiometricData = await prisma.biometricData.findMany({
      where: {
        isActive: true,
        faceEmbeddings: { not: null }
      },
      select: { userId: true, faceEmbeddings: true }
    })

    for (const data of allBiometricData) {
      if (!data.faceEmbeddings) continue

      try {
        const storedEmbeddings = decryptFaceEmbeddings(data.faceEmbeddings)
        const result = verifyFaceEmbedding(newEmbedding.descriptor, storedEmbeddings)

        if (result.isMatch) {
          console.log(`✅ Usuario identificado por rostro: ${data.userId} (confidence: ${result.confidence.toFixed(2)})`)
          return {
            isValid: true,
            userId: data.userId,
            confidence: result.confidence,
            method: 'FACE'
          }
        }
      } catch (error) {
        console.error(`Error verificando usuario ${data.userId}:`, error)
        continue
      }
    }

    console.log('❌ Rostro no reconocido')
    return { isValid: false, method: 'FACE' }
  } catch (error: unknown) {
    console.error('Error en verifyFaceMethod:', error)
    throw error
  }
}

async function verifyFingerprintMethod(fingerprintHash: string, userId?: string) {
  try {
    console.log('🔍 Verificando huella digital...')

    if (!userId) {
      // Huella requiere userId porque el hash del dispositivo no se puede comparar globalmente
      return { isValid: false, method: 'FINGERPRINT' }
    }

    const biometricData = await prisma.biometricData.findUnique({
      where: { userId, isActive: true },
      select: { userId: true, fingerprintHash: true }
    })

    if (!biometricData?.fingerprintHash) {
      return { isValid: false, method: 'FINGERPRINT' }
    }

    const isValid = await verifyFingerprint(fingerprintHash, biometricData.fingerprintHash)

    console.log(`${isValid ? '✅' : '❌'} Verificación de huella digital`)

    return {
      isValid,
      userId: biometricData.userId,
      confidence: isValid ? 1.0 : 0.0,
      method: 'FINGERPRINT'
    }
  } catch (error: unknown) {
    console.error('Error en verifyFingerprintMethod:', error)
    throw error
  }
}

async function verifyPinMethod(pin: string, userId?: string, tenantId?: string) {
  try {
    console.log('🔍 Verificando PIN...')

    if (!userId && !tenantId) {
      return { isValid: false, method: 'PIN' }
    }

    // Si hay userId, buscar ese usuario específico
    if (userId) {
      const biometricData = await prisma.biometricData.findUnique({
        where: { userId, isActive: true },
        select: { userId: true, pinHash: true }
      })

      if (!biometricData?.pinHash) {
        return { isValid: false, method: 'PIN' }
      }

      const isValid = await verifyPin(pin, biometricData.pinHash)

      console.log(`${isValid ? '✅' : '❌'} Verificación de PIN para usuario ${userId}`)

      return {
        isValid,
        userId: biometricData.userId,
        confidence: isValid ? 1.0 : 0.0,
        method: 'PIN'
      }
    }

    // Si solo hay tenantId, buscar en todos los usuarios del tenant
    const allBiometricData = await prisma.biometricData.findMany({
      where: {
        tenantId,
        isActive: true,
        pinHash: { not: null }
      },
      select: { userId: true, pinHash: true }
    })

    for (const data of allBiometricData) {
      if (!data.pinHash) continue

      const isValid = await verifyPin(pin, data.pinHash)

      if (isValid) {
        console.log(`✅ Usuario identificado por PIN: ${data.userId}`)
        return {
          isValid: true,
          userId: data.userId,
          confidence: 1.0,
          method: 'PIN'
        }
      }
    }

    console.log('❌ PIN no reconocido')
    return { isValid: false, method: 'PIN' }
  } catch (error: unknown) {
    console.error('Error en verifyPinMethod:', error)
    throw error
  }
}

async function verifyQRMethod(qrCode: string) {
  try {
    console.log('🔍 Verificando código QR...')

    const validation = validateQRCode(qrCode)

    if (!validation.isValid || !validation.userId) {
      return { isValid: false, method: 'QR' }
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
      return { isValid: false, method: 'QR' }
    }

    console.log(`✅ Usuario identificado por QR: ${biometricData.userId}`)

    return {
      isValid: true,
      userId: biometricData.userId,
      confidence: 1.0,
      method: 'QR'
    }
  } catch (error: unknown) {
    console.error('Error en verifyQRMethod:', error)
    throw error
  }
}
