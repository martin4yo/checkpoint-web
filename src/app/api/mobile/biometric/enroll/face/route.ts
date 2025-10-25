import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import {
  extractFaceEmbedding,
  encryptFaceEmbeddings,
  decryptFaceEmbeddings,
  FaceEmbedding
} from '@/lib/biometric'

/**
 * POST /api/mobile/biometric/enroll/face
 *
 * Registra embeddings faciales para un usuario
 * Permite múltiples fotos (3-5 recomendado)
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

    const { images, consentSigned, replaceExisting } = await req.json()

    // Validaciones
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe proporcionar al menos una imagen facial' },
        { status: 400 }
      )
    }

    if (images.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Se requieren al menos 3 fotos desde diferentes ángulos' },
        { status: 400 }
      )
    }

    if (images.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Máximo 5 fotos permitidas' },
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
      select: { id: true, tenantId: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Procesar imágenes y extraer embeddings
    console.log(`🔍 Procesando ${images.length} imágenes faciales para usuario ${user.email}`)

    const embeddings: FaceEmbedding[] = []
    const errors: string[] = []

    for (let i = 0; i < images.length; i++) {
      try {
        const embedding = await extractFaceEmbedding(images[i])
        embeddings.push(embedding)
        console.log(`✅ Imagen ${i + 1}/${images.length} procesada (confidence: ${embedding.confidence.toFixed(2)})`)
      } catch (error: any) {
        console.error(`❌ Error procesando imagen ${i + 1}:`, error.message)
        errors.push(`Imagen ${i + 1}: ${error.message}`)
      }
    }

    // Verificar que se hayan procesado suficientes imágenes
    if (embeddings.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudieron procesar suficientes imágenes faciales',
          details: errors
        },
        { status: 400 }
      )
    }

    // Encriptar embeddings
    const encryptedEmbeddings = encryptFaceEmbeddings(embeddings)

    // Verificar si ya existe registro biométrico
    const existing = await prisma.biometricData.findUnique({
      where: { userId: user.id }
    })

    if (existing && !replaceExisting) {
      return NextResponse.json(
        {
          success: false,
          error: 'El usuario ya tiene datos faciales registrados. Use replaceExisting=true para reemplazar.'
        },
        { status: 409 }
      )
    }

    // Guardar o actualizar datos biométricos
    const biometricData = await prisma.biometricData.upsert({
      where: { userId: user.id },
      update: {
        faceEmbeddings: encryptedEmbeddings,
        consentSigned: consentSigned,
        consentDate: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        tenantId: user.tenantId,
        faceEmbeddings: encryptedEmbeddings,
        enrolledById: payload.userId, // El usuario se auto-registra
        consentSigned: consentSigned,
        consentDate: new Date(),
        isActive: true
      }
    })

    console.log(`✅ Datos faciales guardados para usuario ${user.email}`)

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        enrolledAt: biometricData.enrolledAt,
        faceCount: embeddings.length,
        averageConfidence: embeddings.reduce((sum, e) => sum + e.confidence, 0) / embeddings.length
      },
      message: `${embeddings.length} imágenes faciales registradas exitosamente`
    })
  } catch (error: any) {
    console.error('Error en enroll/face:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al registrar datos faciales',
        details: error.message
      },
      { status: 500 }
    )
  }
}
