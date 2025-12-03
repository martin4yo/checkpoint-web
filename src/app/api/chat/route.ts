import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import AIAssistantService from '@/lib/aiAssistant';
import ActionExecutorService from '@/lib/actionExecutor';

// Inicializar servicios
let aiAssistant: AIAssistantService | null = null;
const actionExecutor = new ActionExecutorService();

// Inicializar AI Assistant (puede fallar si no hay API key)
try {
  aiAssistant = new AIAssistantService();
} catch (error) {
  console.warn('⚠️  AI Assistant no disponible:', (error as Error).message);
}

/**
 * POST /api/chat
 * Procesa un comando de lenguaje natural
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que AI Assistant esté disponible
    if (!aiAssistant) {
      return NextResponse.json({
        success: false,
        message: 'AI Assistant no está configurado. Verifica ANTHROPIC_API_KEY en .env'
      }, { status: 503 });
    }

    const body = await req.json();
    const { message, tenantId } = body;

    if (!message || !tenantId) {
      return NextResponse.json({
        success: false,
        message: 'Faltan parámetros requeridos'
      }, { status: 400 });
    }

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        tenantId: true,
        superuser: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario pertenece al tenant (superusers tienen acceso a todos)
    if (!user.superuser && user.tenantId !== tenantId) {
      return NextResponse.json({
        error: 'No tienes acceso a este tenant'
      }, { status: 403 });
    }

    console.log('\n🎯 ===== NUEVA SOLICITUD AL CHATBOT =====');
    console.log(`Usuario: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Tenant: ${tenantId}`);
    console.log(`Mensaje: "${message}"`);

    // Paso 1: Procesar comando con IA
    const aiResponse = await aiAssistant.processCommand(message, {
      userId: user.id,
      tenantId,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      isSuperuser: user.superuser
    });

    if (!aiResponse.success) {
      return NextResponse.json({
        success: false,
        message: 'No pude entender el comando',
        error: aiResponse.error
      }, { status: 400 });
    }

    // Paso 2: Validar acción
    const validation = aiAssistant.validateAction(aiResponse.action);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: `Faltan datos: ${validation.errors.join(', ')}`,
        errors: validation.errors
      }, { status: 400 });
    }

    // Paso 3: Ejecutar acción
    const executionResult = await actionExecutor.executeAction(
      aiResponse.action,
      user.id,
      tenantId,
      message // Guardar el prompt original
    );

    const responsePayload = {
      success: executionResult.success,
      message: executionResult.message,
      data: executionResult.data,
      error: executionResult.error,
      debug: process.env.NODE_ENV === 'development' ? {
        action: aiResponse.action,
        rawAIResponse: aiResponse.rawResponse
      } : undefined
    };

    console.log('📨 [API Response] Enviando al frontend:', JSON.stringify(responsePayload, null, 2));
    console.log('✅ ===== SOLICITUD COMPLETADA =====\n');

    return NextResponse.json(responsePayload, { status: executionResult.success ? 200 : 400 });

  } catch (error) {
    console.error('❌ Chat endpoint error:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * GET /api/chat
 * Verifica si el servicio de AI está disponible (health check)
 * Este endpoint NO requiere autenticación
 */
export async function GET() {
  console.log('🔍 Health check - AI Assistant disponible:', aiAssistant !== null);

  return NextResponse.json({
    available: aiAssistant !== null,
    service: 'AI Chat Assistant',
    model: aiAssistant ? 'claude-sonnet-4-20250514' : null,
    status: aiAssistant ? 'ready' : 'not_configured'
  });
}
