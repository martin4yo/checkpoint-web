import admin from 'firebase-admin'

// Inicializar Firebase Admin SDK (solo una vez)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
    console.log('🔥 Firebase Admin SDK inicializado')
  } catch (error) {
    console.warn('⚠️ Firebase Admin SDK no pudo inicializarse:', error)
  }
}

export interface PushMessage {
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}

export interface PushTarget {
  token?: string
  tokens?: string[]
  topic?: string
}

export class PushNotificationService {

  // Enviar notificación a un token específico
  static async sendToToken(token: string, message: PushMessage): Promise<boolean> {
    try {
      const payload = {
        notification: {
          title: message.title,
          body: message.body,
          ...(message.imageUrl && { imageUrl: message.imageUrl })
        },
        data: message.data || {},
        token
      }

      const response = await admin.messaging().send(payload)
      console.log('✅ Notificación enviada exitosamente:', response)
      return true
    } catch (error) {
      console.error('❌ Error enviando notificación:', error)
      return false
    }
  }

  // Enviar notificación a múltiples tokens
  static async sendToTokens(tokens: string[], message: PushMessage): Promise<{
    successCount: number
    failureCount: number
    responses: admin.messaging.BatchResponse
  }> {
    try {
      // Enviar notificación a cada token individualmente
      let successCount = 0
      let failureCount = 0

      for (const token of tokens) {
        try {
          await admin.messaging().send({
            notification: {
              title: message.title,
              body: message.body,
              ...(message.imageUrl && { imageUrl: message.imageUrl })
            },
            data: message.data || {},
            token,
            android: { priority: 'high' },
            apns: { headers: { 'apns-priority': '10' } }
          })
          successCount++
        } catch (error) {
          failureCount++
          const firebaseError = error as { code?: string }
          console.warn(`❌ Token fallido: ${token} - ${firebaseError?.code}`)
        }
      }

      console.log(`📱 Notificaciones enviadas: ${successCount}/${tokens.length}`)

      // Crear un response mock compatible
      return {
        successCount,
        failureCount,
        responses: {} as admin.messaging.BatchResponse
      }
    } catch (error) {
      console.error('❌ Error enviando notificaciones múltiples:', error)
      return {
        successCount: 0,
        failureCount: tokens.length,
        responses: { responses: [], successCount: 0, failureCount: tokens.length }
      }
    }
  }

  // Enviar notificación a un topic
  static async sendToTopic(topic: string, message: PushMessage): Promise<boolean> {
    try {
      const payload = {
        notification: {
          title: message.title,
          body: message.body,
          ...(message.imageUrl && { imageUrl: message.imageUrl })
        },
        data: message.data || {},
        topic
      }

      const response = await admin.messaging().send(payload)
      console.log('✅ Notificación a topic enviada:', response)
      return true
    } catch (error) {
      console.error('❌ Error enviando notificación a topic:', error)
      return false
    }
  }

  // Validar token
  static async validateToken(token: string): Promise<boolean> {
    try {
      // Enviar un mensaje de prueba silencioso
      await admin.messaging().send({
        token,
        data: { type: 'token_validation' },
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } }
      })
      return true
    } catch (error: unknown) {
      // Tokens inválidos generan errores específicos
      const firebaseError = error as { code?: string }
      if (firebaseError?.code === 'messaging/invalid-registration-token' ||
          firebaseError?.code === 'messaging/registration-token-not-registered') {
        return false
      }
      console.warn('⚠️ Error validando token:', firebaseError?.code)
      return false
    }
  }

  // Limpiar tokens inválidos de una lista
  static async cleanInvalidTokens(tokens: string[]): Promise<string[]> {
    const validTokens: string[] = []

    for (const token of tokens) {
      const isValid = await this.validateToken(token)
      if (isValid) {
        validTokens.push(token)
      } else {
        console.log('🗑️ Token inválido removido:', token.slice(-10))
      }
    }

    return validTokens
  }
}

// Funciones helper para notificaciones específicas del sistema
export class JourneyNotifications {

  // Notificación de jornada inactiva
  static async sendJourneyInactiveAlert(
    adminTokens: string[],
    userInfo: { name: string; email: string },
    journeyInfo: { duration: string; lastSeen: string }
  ) {
    const message: PushMessage = {
      title: '⚠️ Jornada Inactiva Detectada',
      body: `${userInfo.name} no ha enviado ubicación en ${journeyInfo.lastSeen}. Jornada activa: ${journeyInfo.duration}`,
      data: {
        type: 'journey_inactive',
        userEmail: userInfo.email,
        duration: journeyInfo.duration,
        lastSeen: journeyInfo.lastSeen
      }
    }

    return await PushNotificationService.sendToTokens(adminTokens, message)
  }


  // Notificación de jornada recuperada
  static async sendJourneyRecoveredAlert(
    adminTokens: string[],
    userInfo: { name: string; email: string }
  ) {
    const message: PushMessage = {
      title: '✅ Jornada Recuperada',
      body: `${userInfo.name} ha reanudado el envío de ubicación`,
      data: {
        type: 'journey_recovered',
        userEmail: userInfo.email
      }
    }

    return await PushNotificationService.sendToTokens(adminTokens, message)
  }
}