import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, CheckpointType } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }
    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get user's tenantId
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { tenantId: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await request.json();
    const { journey_id, locations } = body;

    if (!journey_id) {
      return NextResponse.json(
        { error: 'journey_id es requerido' },
        { status: 400 }
      );
    }

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'locations debe ser un array no vacío' },
        { status: 400 }
      );
    }

    console.log(`📍 Batch de ${locations.length} ubicaciones recibidas para journey ${journey_id}`);

    // Verificar que el checkpoint/jornada existe y pertenece al usuario
    const checkpoint = await prisma.checkpoint.findFirst({
      where: {
        id: journey_id,
        userId: tokenData.userId,
        type: CheckpointType.JOURNEY_START
      }
    });

    if (!checkpoint) {
      return NextResponse.json(
        { error: 'Jornada no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Procesar y guardar cada ubicación
    const locationRecords = [];

    for (const location of locations) {
      // Crear registro de ubicación de jornada
      const locationRecord = await prisma.journeyLocation.create({
        data: {
          startCheckpointId: checkpoint.id,
          userId: tokenData.userId,
          latitude: location.latitude,
          longitude: location.longitude,
          recordedAt: new Date(location.timestamp),
          tenantId: user.tenantId,
          createdAt: new Date()
        }
      });

      locationRecords.push(locationRecord);
    }

    // Actualizar última ubicación conocida en el checkpoint
    const lastLocation = locations[locations.length - 1];
    await prisma.checkpoint.update({
      where: { id: checkpoint.id },
      data: {
        latitude: lastLocation.latitude,
        longitude: lastLocation.longitude,
        timestamp: new Date()
      }
    });

    console.log(`✅ ${locationRecords.length} ubicaciones guardadas para journey ${journey_id}`);

    return NextResponse.json({
      success: true,
      data: {
        journey_id: checkpoint.id,
        locations_saved: locationRecords.length,
        message: `${locationRecords.length} ubicaciones procesadas correctamente`
      }
    });

  } catch (error) {
    console.error('❌ Error procesando batch de ubicaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}