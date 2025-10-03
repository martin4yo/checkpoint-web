interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
}

interface PushResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export async function sendPushNotifications(
  tokens: string[],
  notification: PushNotification
): Promise<PushResult[]> {
  const results: PushResult[] = [];

  for (const token of tokens) {
    try {
      // Determinar si es un token de Expo o FCM nativo
      if (token.startsWith('ExponentPushToken')) {
        // Enviar usando Expo Push API
        const result = await sendExpoNotification(token, notification);
        results.push(result);
      } else {
        // Enviar usando Firebase FCM (si está configurado)
        const result = await sendFCMNotification(token, notification);
        results.push(result);
      }
    } catch (error) {
      console.error(`Error enviando notificación a token ${token}:`, error);
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  return results;
}

async function sendExpoNotification(
  token: string,
  notification: PushNotification
): Promise<PushResult> {
  try {
    const message = {
      to: token,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    };

    console.log('📱 Enviando notificación Expo:', message);

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (response.ok && result.data) {
      return {
        success: true,
        messageId: result.data.id
      };
    } else {
      return {
        success: false,
        error: result.errors?.[0]?.message || 'Error enviando notificación Expo'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión Expo'
    };
  }
}

async function sendFCMNotification(
  token: string,
  notification: PushNotification
): Promise<PushResult> {
  try {
    // Verificar si Firebase Admin SDK está configurado
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
      console.warn('🚨 Firebase Admin SDK no configurado, saltando FCM');
      return {
        success: false,
        error: 'Firebase Admin SDK no configurado'
      };
    }

    // Importar dinámicamente Firebase Admin (solo si está configurado)
    const admin = await import('firebase-admin');

    // Inicializar Firebase Admin si no está inicializado
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    }

    // Convertir data a formato string (requerido por FCM)
    const stringData: Record<string, string> = {};
    if (notification.data) {
      Object.entries(notification.data).forEach(([key, value]) => {
        stringData[key] = String(value);
      });
    }

    const message = {
      token: token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: stringData,
    };

    console.log('🔥 Enviando notificación FCM:', message);

    const response = await admin.messaging().send(message);

    return {
      success: true,
      messageId: response
    };

  } catch (error) {
    console.error('Error FCM:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error enviando notificación FCM'
    };
  }
}