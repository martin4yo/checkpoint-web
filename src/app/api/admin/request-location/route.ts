import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { journeyWebSocketServer } from '@/lib/websocket-server'

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación del admin
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, journeyId } = body

    if (!userId || !journeyId) {
      return NextResponse.json({
        error: 'userId y journeyId son requeridos'
      }, { status: 400 })
    }

    // Solicitar ubicación via WebSocket
    const sent = await journeyWebSocketServer.requestLocation(userId, journeyId)

    if (sent) {
      return NextResponse.json({
        success: true,
        message: 'Solicitud de ubicación enviada'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Cliente no conectado via WebSocket'
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Error solicitando ubicación:', error)
    return NextResponse.json({
      error: 'Error al solicitar ubicación'
    }, { status: 500 })
  }
}
