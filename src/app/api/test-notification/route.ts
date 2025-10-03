import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { sendPushNotifications } from '@/lib/pushNotifications'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación (Bearer token o cookie)
    let token = request.headers.get('authorization')?.replace('Bearer ', '');

    // Si no hay Bearer token, intentar con cookie (web admin)
    if (!token) {
      token = request.cookies.get('token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload?.userId) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar todos los tokens activos
    const pushTokens = await prisma.pushToken.findMany({
      where: {
        isActive: true
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    if (pushTokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay dispositivos registrados para notificaciones'
      }, { status: 404 })
    }

    // Preparar notificación de prueba
    const notification = {
      title: '🔔 Prueba de Notificación',
      body: `Esta es una notificación de prueba enviada el ${new Date().toLocaleString('es-CO')}`,
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    }

    // Enviar notificaciones
    const results = await sendPushNotifications(
      pushTokens.map(pt => pt.token),
      notification
    )

    // Contar éxitos
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`📱 Notificación de prueba enviada: ${successCount} éxitos, ${failureCount} fallos`)

    return NextResponse.json({
      success: true,
      data: {
        tokensFound: pushTokens.length,
        successCount,
        failureCount,
        results: results.map((r, i) => ({
          ...r,
          deviceInfo: {
            platform: pushTokens[i].platform,
            description: pushTokens[i].description,
            user: pushTokens[i].user?.email || 'Administrador'
          }
        }))
      }
    })

  } catch (error) {
    console.error('Error enviando notificación de prueba:', error)

    return NextResponse.json(
      {
        error: 'Error al enviar notificación de prueba',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}