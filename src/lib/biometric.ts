/**
 * Sistema Biométrico de Fichaje
 *
 * Este servicio maneja el reconocimiento facial, validación de huella,
 * PIN y códigos QR para el sistema de fichaje.
 *
 * Cumple con Ley 25.326 - Ley de Protección de Datos Personales de Argentina
 */

import * as faceapi from '@vladmandic/face-api'
import * as tf from '@tensorflow/tfjs-node'
import * as bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

// ==================== CONSTANTES ====================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.BIOMETRIC_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const MIN_FACE_CONFIDENCE = 0.6 // Threshold mínimo para reconocimiento facial
const FACE_DESCRIPTOR_LENGTH = 128 // Longitud del descriptor facial de FaceNet

// ==================== TIPOS ====================

export interface FaceEmbedding {
  descriptor: number[]
  confidence: number
  timestamp: string
}

export interface BiometricEnrollmentData {
  userId: string
  tenantId: string
  enrolledById: string
  faceEmbeddings?: FaceEmbedding[]
  fingerprintHash?: string
  pinHash?: string
  qrCode?: string
  consentSigned: boolean
  consentDate?: Date
}

export interface FaceVerificationResult {
  isMatch: boolean
  confidence: number
  matchedIndex?: number
}

// ==================== INICIALIZACIÓN DE FACE-API ====================

let faceApiInitialized = false

/**
 * Inicializa los modelos de face-api.js
 * Se ejecuta una sola vez al inicio del servidor
 */
export async function initializeFaceApi() {
  if (faceApiInitialized) return

  try {
    // Configurar TensorFlow para limitar uso de memoria
    tf.env().set('WEBGL_CPU_FORWARD', false)
    tf.env().set('WEBGL_PACK', false)

    const MODEL_URL = process.cwd() + '/public/models'

    // Cargar modelos TINY (más livianos, menos memoria)
    await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_URL)
    await faceapi.nets.faceLandmark68TinyNet.loadFromDisk(MODEL_URL)
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL)

    faceApiInitialized = true
    console.log('✅ Face-API models loaded successfully (Tiny version)')
  } catch (error) {
    console.error('❌ Error loading Face-API models:', error)
    // En desarrollo, no fallar si no hay modelos
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}

// ==================== RECONOCIMIENTO FACIAL ====================

/**
 * Rota un tensor 3D en múltiplos de 90 grados
 * @param tensor - Tensor a rotar
 * @param k - Número de rotaciones de 90° en sentido antihorario (0-3)
 */
function rotateTensor(tensor: tf.Tensor3D, k: number): tf.Tensor3D {
  const rotation = k % 4

  switch (rotation) {
    case 0:
      return tensor
    case 1: // 90° antihorario
      return tf.tidy(() => {
        const transposed = tf.transpose(tensor, [1, 0, 2]) as tf.Tensor3D
        return tf.reverse(transposed, 1) as tf.Tensor3D
      })
    case 2: // 180°
      return tf.tidy(() => {
        return tf.reverse(tensor, [0, 1]) as tf.Tensor3D
      })
    case 3: // 270° antihorario (o 90° horario)
      return tf.tidy(() => {
        const transposed = tf.transpose(tensor, [1, 0, 2]) as tf.Tensor3D
        return tf.reverse(transposed, 0) as tf.Tensor3D
      })
    default:
      return tensor
  }
}

/**
 * Procesa una imagen facial y extrae el embedding (descriptor)
 *
 * @param imageBase64 - Imagen en base64
 * @returns Embedding facial con confianza
 */
export async function extractFaceEmbedding(imageBase64: string): Promise<FaceEmbedding> {
  if (!faceApiInitialized) {
    await initializeFaceApi()
  }

  let tensor: tf.Tensor3D | undefined
  let resizedTensor: tf.Tensor3D | undefined
  const rotatedTensors: tf.Tensor3D[] = []

  try {
    // Convertir base64 a buffer
    const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')

    // Convertir buffer a tensor usando TensorFlow.js Node
    tensor = tf.node.decodeImage(imageBuffer, 3) as tf.Tensor3D

    const [height, width] = tensor.shape
    console.log(`📸 Imagen original: ${height}x${width}`)

    // Redimensionar si la imagen es muy grande (mejora detección y reduce memoria)
    const maxSize = 640
    let processedTensor = tensor

    if (height > maxSize || width > maxSize) {
      const scale = maxSize / Math.max(height, width)
      const newHeight = Math.round(height * scale)
      const newWidth = Math.round(width * scale)

      console.log(`🔄 Redimensionando a: ${newHeight}x${newWidth}`)

      resizedTensor = tf.image.resizeBilinear(tensor, [newHeight, newWidth]) as tf.Tensor3D
      processedTensor = resizedTensor
    }

    // Intentar detectar rostro en múltiples orientaciones (0°, 90°, 180°, 270°)
    const rotations = [0, 1, 2, 3] // k rotaciones de 90° en sentido antihorario

    for (const k of rotations) {
      let tensorToTest = processedTensor

      if (k > 0) {
        console.log(`🔄 Intentando con rotación ${k * 90}°`)
        tensorToTest = rotateTensor(processedTensor, k)
        rotatedTensors.push(tensorToTest)
      }

      // Detectar rostro y extraer descriptor usando TinyFaceDetector
      // inputSize más alto (416) y scoreThreshold más bajo (0.3) para mejor detección
      const detection = await faceapi
        .detectSingleFace(
          tensorToTest as unknown as Parameters<typeof faceapi.detectSingleFace>[0],
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
        )
        .withFaceLandmarks(true) // true = usar tiny landmarks
        .withFaceDescriptor()

      if (detection) {
        console.log(`✅ Rostro detectado con rotación ${k * 90}° - confianza: ${detection.detection.score.toFixed(3)}`)

        return {
          descriptor: Array.from(detection.descriptor),
          confidence: detection.detection.score,
          timestamp: new Date().toISOString()
        }
      }
    }

    // Si no se detectó en ninguna orientación, guardar imagen para debug
    console.error('❌ No se detectó rostro en ninguna orientación')

    // Guardar imagen temporalmente para debug
    try {
      const fs = await import('fs')
      const path = await import('path')
      const debugPath = path.join('/tmp', `face-debug-${Date.now()}.jpg`)
      fs.writeFileSync(debugPath, imageBuffer)
      console.log(`💾 Imagen guardada para debug en: ${debugPath}`)
    } catch (debugError) {
      console.error('Error guardando imagen de debug:', debugError)
    }

    throw new Error('No se detectó ningún rostro en la imagen')
  } catch (error: unknown) {
    console.error('Error extracting face embedding:', error)
    throw new Error(`Error al procesar imagen facial: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    // Liberar memoria de los tensores
    if (tensor) {
      tensor.dispose()
    }
    if (resizedTensor) {
      resizedTensor.dispose()
    }
    rotatedTensors.forEach(t => t.dispose())
  }
}

/**
 * Compara un embedding facial contra múltiples embeddings almacenados
 *
 * @param newEmbedding - Nuevo embedding a comparar
 * @param storedEmbeddings - Embeddings almacenados del usuario
 * @param threshold - Umbral de similitud (default: 0.6)
 * @returns Resultado de la verificación
 */
export function verifyFaceEmbedding(
  newEmbedding: number[],
  storedEmbeddings: FaceEmbedding[],
  threshold: number = MIN_FACE_CONFIDENCE
): FaceVerificationResult {
  if (!storedEmbeddings || storedEmbeddings.length === 0) {
    return { isMatch: false, confidence: 0 }
  }

  // Comparar contra todos los embeddings almacenados
  let bestMatch = { distance: 1, confidence: 0, index: -1 }

  storedEmbeddings.forEach((stored, index) => {
    const distance = faceapi.euclideanDistance(newEmbedding, stored.descriptor)
    const confidence = 1 - distance

    if (confidence > bestMatch.confidence) {
      bestMatch = { distance, confidence, index }
    }
  })

  // Un threshold de 0.6 significa ~40% de diferencia permitida
  const isMatch = bestMatch.confidence >= threshold

  return {
    isMatch,
    confidence: bestMatch.confidence,
    matchedIndex: isMatch ? bestMatch.index : undefined
  }
}

/**
 * Encripta un array de embeddings faciales
 */
export function encryptFaceEmbeddings(embeddings: FaceEmbedding[]): string {
  try {
    const json = JSON.stringify(embeddings)
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex')
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
    let encrypted = cipher.update(json, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Retornar: iv + authTag + encrypted
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  } catch (error: unknown) {
    console.error('Error encrypting face embeddings:', error)
    throw new Error('Error al encriptar datos biométricos')
  }
}

/**
 * Desencripta embeddings faciales
 */
export function decryptFaceEmbeddings(encryptedData: string): FaceEmbedding[] {
  try {
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      throw new Error('Formato de datos encriptados inválido')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex')

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return JSON.parse(decrypted)
  } catch (error: unknown) {
    console.error('Error decrypting face embeddings:', error)
    throw new Error('Error al desencriptar datos biométricos')
  }
}

// ==================== HUELLA DIGITAL ====================

/**
 * Hashea un hash de huella digital
 * Nota: El hash real de la huella viene del dispositivo Android
 *
 * @param fingerprintHash - Hash de huella del dispositivo
 * @returns Hash bcrypt del hash de huella
 */
export async function hashFingerprint(fingerprintHash: string): Promise<string> {
  return bcrypt.hash(fingerprintHash, 10)
}

/**
 * Verifica un hash de huella digital
 *
 * @param fingerprintHash - Hash de huella del dispositivo
 * @param storedHash - Hash almacenado en BD
 * @returns true si coincide
 */
export async function verifyFingerprint(fingerprintHash: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(fingerprintHash, storedHash)
}

// ==================== PIN ====================

/**
 * Hashea un PIN de 6 dígitos
 *
 * @param pin - PIN de 6 dígitos
 * @returns Hash bcrypt del PIN
 */
export async function hashPin(pin: string): Promise<string> {
  // Validar formato de PIN
  if (!/^\d{6}$/.test(pin)) {
    throw new Error('El PIN debe ser de 6 dígitos numéricos')
  }

  return bcrypt.hash(pin, 10)
}

/**
 * Verifica un PIN
 *
 * @param pin - PIN ingresado
 * @param storedHash - Hash almacenado en BD
 * @returns true si coincide
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(pin, storedHash)
}

/**
 * Genera un PIN aleatorio de 6 dígitos
 */
export function generateRandomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ==================== CÓDIGO QR ====================

/**
 * Genera un código QR único para un usuario
 *
 * @param userId - ID del usuario
 * @param tenantId - ID del tenant
 * @returns Código QR único y su representación en imagen base64
 */
export async function generateQRCode(userId: string, tenantId: string): Promise<{
  code: string
  imageBase64: string
}> {
  // Generar código único
  const code = `BIOMETRIC:${tenantId}:${userId}:${uuidv4()}`

  // Generar imagen QR
  const imageBase64 = await QRCode.toDataURL(code, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2
  })

  return { code, imageBase64 }
}

/**
 * Valida un código QR
 *
 * @param scannedCode - Código escaneado
 * @returns Información extraída del código
 */
export function validateQRCode(scannedCode: string): {
  isValid: boolean
  tenantId?: string
  userId?: string
} {
  try {
    if (!scannedCode.startsWith('BIOMETRIC:')) {
      return { isValid: false }
    }

    const parts = scannedCode.split(':')
    if (parts.length !== 4) {
      return { isValid: false }
    }

    return {
      isValid: true,
      tenantId: parts[1],
      userId: parts[2]
    }
  } catch (error) {
    return { isValid: false }
  }
}

// ==================== UTILIDADES ====================

/**
 * Genera un hash de dispositivo basado en información del mismo
 */
export function generateDeviceHash(deviceInfo: {
  model?: string
  manufacturer?: string
  androidId?: string
}): string {
  const data = JSON.stringify(deviceInfo)
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Valida que el usuario haya firmado el consentimiento
 */
export function validateConsent(consentSigned: boolean, consentDate?: Date): boolean {
  if (!consentSigned) return false
  if (!consentDate) return false

  // Verificar que el consentimiento no sea demasiado antiguo (opcional)
  // Por ejemplo, máximo 1 año
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  return consentDate > oneYearAgo
}

/**
 * Calcula la confianza promedio de múltiples embeddings faciales
 */
export function calculateAverageConfidence(embeddings: FaceEmbedding[]): number {
  if (!embeddings || embeddings.length === 0) return 0

  const sum = embeddings.reduce((acc, emb) => acc + emb.confidence, 0)
  return sum / embeddings.length
}
