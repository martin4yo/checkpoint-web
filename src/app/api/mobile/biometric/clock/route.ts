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
 * POST /api/mobile/biometric/clock
 *
 * Registra un fichaje (entrada/salida) usando biometría
 *
 * Body:
 * {
 *   method: 'FACE' | 'FINGERPRINT' | 'PIN' | 'QR',
 *   clockType: 'IN' | 'OUT',
 *   data: <datos biométricos>,
 *   latitude: number,
 *   longitude: number,
 *   placeId?: string,
 *   userId?: string, // Opcional para algunos métodos
 *   photo?: string, // Foto del fichaje (base64)
 *   deviceInfo?: object
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { method, clockType, data, latitude, longitude, placeId, userId, photo, deviceInfo } = body

    // Validaciones básicas
    if (!['FACE', 'FINGERPRINT', 'PIN', 'QR'].includes(method)) {
      return NextResponse.json(
        { success: false, error: 'Método biométrico inválido' },
        { status: 400 }
      )
    }

    if (!['IN', 'OUT'].includes(clockType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de fichaje inválido (debe ser IN o OUT)' },
        { status: 400 }
      )
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Ubicación requerida' },
        { status: 400 }
      )
    }

    console.log(`⏰ Fichaje ${clockType} con método ${method}`)

    // PASO 1: Verificar identidad biométrica
    let verifiedUserId: string | null = null
    let confidence: number = 0

    switch (method) {
      case 'FACE':
        const faceResult = await verifyFace(data, userId)
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
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId requerido para huella digital' },
            { status: 400 }
          )
        }
        const fingerprintResult = await verifyFingerprintData(data, userId)
        if (!fingerprintResult.isValid) {
          return NextResponse.json(
            { success: false, error: 'Huella digital no reconocida' },
            { status: 401 }
          )
        }
        verifiedUserId = userId
        confidence = 1.0
        break

      case 'PIN':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId requerido para PIN' },
            { status: 400 }
          )
        }
        const pinResult = await verifyPinData(data, userId)
        if (!pinResult.isValid) {
          return NextResponse.json(
            { success: false, error: 'PIN incorrecto' },
            { status: 401 }
          )
        }
        verifiedUserId = userId
        confidence = 1.0
        break

      case 'QR':
        const qrResult = await verifyQRData(data)
        if (!qrResult.isValid) {
          return NextResponse.json(
            { success: false, error: 'Código QR inválido' },
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

    // PASO 2: Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: verifiedUserId },
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // PASO 3: Validar lugar (si se proporciona)
    let place = null
    if (placeId) {
      place = await prisma.place.findFirst({
        where: {
          id: placeId,
          tenantId: user.tenantId,
          isActive: true
        },
        select: { id: true, name: true }
      })

      if (!place) {
        return NextResponse.json(
          { success: false, error: 'Lugar no encontrado' },
          { status: 404 }
        )
      }
    }

    // PASO 4: Verificar último fichaje (evitar duplicados)
    const lastClock = await prisma.biometricClock.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { clockType: true, createdAt: true }
    })

    // Evitar fichajes duplicados en menos de 1 minuto
    if (lastClock) {
      const timeDiff = Date.now() - lastClock.createdAt.getTime()
      if (timeDiff < 60000 && lastClock.clockType === clockType) {
        return NextResponse.json(
          {
            success: false,
            error: `Ya fichó ${clockType === 'IN' ? 'entrada' : 'salida'} hace ${Math.floor(timeDiff / 1000)} segundos`
          },
          { status: 409 }
        )
      }
    }

    // PASO 5: Procesar foto si existe
    let photoUrl: string | null = null
    if (photo) {
      // TODO: Subir a storage (Google Cloud Storage, S3, etc.)
      // Por ahora dejamos null, se puede implementar después
      photoUrl = null
    }

    // PASO 6: Registrar el fichaje
    const biometricClock = await prisma.biometricClock.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        placeId: place?.id || null,
        clockType: clockType as 'IN' | 'OUT',
        method: method as 'FACE' | 'FINGERPRINT' | 'PIN' | 'QR',
        confidence: confidence,
        latitude: latitude,
        longitude: longitude,
        photoUrl: photoUrl,
        deviceInfo: deviceInfo || null,
        failedAttempts: 0
      }
    })

    // PASO 7: Actualizar lastUsedAt en biometric_data
    await prisma.biometricData.update({
      where: { userId: user.id },
      data: { lastUsedAt: new Date() }
    })

    console.log(`✅ Fichaje registrado: ${user.name} - ${clockType} - ${method}`)

    // PASO 8: Si es modo estático, también crear un checkpoint tradicional
    // Esto mantiene compatibilidad con el sistema existente
    try {
      await prisma.checkpoint.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
          placeId: place?.id || null,
          placeName: place?.name || 'Fichaje Biométrico',
          latitude: latitude,
          longitude: longitude,
          timestamp: new Date(),
          notes: `Fichaje ${clockType} - Método: ${method}`,
          type: 'MANUAL',
          imageUrl: photoUrl
        }
      })
    } catch (checkpointError) {
      console.error('Error creando checkpoint compatible:', checkpointError)
      // No fallar si no se puede crear el checkpoint
    }

    return NextResponse.json({
      success: true,
      data: {
        clockId: biometricClock.id,
        userId: user.id,
        userName: user.name,
        clockType: clockType,
        method: method,
        confidence: confidence,
        place: place?.name || null,
        timestamp: biometricClock.createdAt
      },
      message: `Fichaje de ${clockType === 'IN' ? 'entrada' : 'salida'} registrado exitosamente`
    })
  } catch (error: any) {
    console.error('Error en biometric/clock:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al registrar fichaje',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// ==================== FUNCIONES DE VERIFICACIÓN ====================

async function verifyFace(imageBase64: string, userId?: string) {
  const newEmbedding = await extractFaceEmbedding(imageBase64)

  if (userId) {
    const biometricData = await prisma.biometricData.findUnique({
      where: { userId, isActive: true },
      select: { userId: true, faceEmbeddings: true }
    })

    if (!biometricData?.faceEmbeddings) {
      return { isValid: false }
    }

    const storedEmbeddings = decryptFaceEmbeddings(biometricData.faceEmbeddings)
    const result = verifyFaceEmbedding(newEmbedding.descriptor, storedEmbeddings)

    return {
      isValid: result.isMatch,
      userId: biometricData.userId,
      confidence: result.confidence
    }
  }

  // Búsqueda en todos los usuarios
  const allBiometricData = await prisma.biometricData.findMany({
    where: { isActive: true, faceEmbeddings: { not: null } },
    select: { userId: true, faceEmbeddings: true }
  })

  for (const data of allBiometricData) {
    if (!data.faceEmbeddings) continue

    try {
      const storedEmbeddings = decryptFaceEmbeddings(data.faceEmbeddings)
      const result = verifyFaceEmbedding(newEmbedding.descriptor, storedEmbeddings)

      if (result.isMatch) {
        return {
          isValid: true,
          userId: data.userId,
          confidence: result.confidence
        }
      }
    } catch (error) {
      continue
    }
  }

  return { isValid: false }
}

async function verifyFingerprintData(fingerprintHash: string, userId: string) {
  const biometricData = await prisma.biometricData.findUnique({
    where: { userId, isActive: true },
    select: { userId: true, fingerprintHash: true }
  })

  if (!biometricData?.fingerprintHash) {
    return { isValid: false }
  }

  const isValid = await verifyFingerprint(fingerprintHash, biometricData.fingerprintHash)

  return { isValid, userId: biometricData.userId }
}

async function verifyPinData(pin: string, userId: string) {
  const biometricData = await prisma.biometricData.findUnique({
    where: { userId, isActive: true },
    select: { userId: true, pinHash: true }
  })

  if (!biometricData?.pinHash) {
    return { isValid: false }
  }

  const isValid = await verifyPin(pin, biometricData.pinHash)

  return { isValid, userId: biometricData.userId }
}

async function verifyQRData(qrCode: string) {
  const validation = validateQRCode(qrCode)

  if (!validation.isValid || !validation.userId) {
    return { isValid: false }
  }

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
    return { isValid: false }
  }

  return {
    isValid: true,
    userId: biometricData.userId
  }
}

/**
 * GET /api/mobile/biometric/clock
 *
 * Obtiene el historial de fichajes del usuario autenticado
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
    const { verifyToken } = await import('@/lib/auth')
    const payload = await verifyToken(token)

    if (!payload?.userId) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Obtener parámetros de consulta
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Obtener fichajes
    const clocks = await prisma.biometricClock.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        place: {
          select: { id: true, name: true, address: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: clocks
    })
  } catch (error: any) {
    console.error('Error en GET biometric/clock:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener fichajes',
        details: error.message
      },
      { status: 500 }
    )
  }
}
