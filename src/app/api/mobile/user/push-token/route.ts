import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);

    if (!payload?.userId) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Get user's tenantId
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { pushToken } = await request.json();

    if (!pushToken) {
      return NextResponse.json(
        { error: 'Token de notificaciones requerido' },
        { status: 400 }
      );
    }

    // Generar un deviceId único basado en el usuario y el token
    const deviceId = `user_${payload.userId}_${Buffer.from(pushToken).toString('base64').substring(0, 10)}`;

    // Desactivar tokens anteriores del mismo usuario
    await prisma.pushToken.updateMany({
      where: {
        userId: payload.userId,
      },
      data: {
        isActive: false,
      },
    });

    // Crear o actualizar el token de notificaciones
    await prisma.pushToken.upsert({
      where: {
        deviceId: deviceId,
      },
      update: {
        token: pushToken,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        deviceId: deviceId,
        token: pushToken,
        userId: payload.userId,
        platform: pushToken.startsWith('ExponentPushToken') ? 'expo' : 'fcm',
        isActive: true,
        isAdminDevice: false, // Los dispositivos móviles rastreados NO son admin
        description: `Dispositivo móvil de ${payload.email}`,
        tenantId: user.tenantId,
      },
    });

    console.log(`✅ Token FCM actualizado para usuario ${payload.email}: ${pushToken}`);

    return NextResponse.json({
      success: true,
      message: 'Token de notificaciones actualizado correctamente',
      deviceId: deviceId,
    });

  } catch (error) {
    console.error('Error actualizando token de notificaciones:', error);

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}