import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { journeyWebSocketServer } from '@/lib/websocket-server'

export async function GET(req: NextRequest) {
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

    // Obtener clientes conectados via WebSocket
    const connectedClients = journeyWebSocketServer.getConnectedClients()
    const connectedUserIds = new Set(connectedClients.map(c => c.userId))

    // Obtener jornadas activas con su estado
    const activeJourneys = await prisma.checkpoint.findMany({
      where: {
        type: 'JOURNEY_START',
        endTimestamp: null // Jornadas no finalizadas
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        journeyLocations: {
          orderBy: {
            recordedAt: 'desc'
          },
          take: 1 // Última ubicación
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Obtener estado de monitoreo para cada jornada
    const activeDevices = await Promise.all(activeJourneys.map(async (journey) => {
      const monitor = await prisma.journeyMonitor.findUnique({
        where: {
          userId_journeyId: {
            userId: journey.userId,
            journeyId: journey.id
          }
        }
      })

      const lastLocation = journey.journeyLocations[0] || null
      const isConnectedViaWS = connectedUserIds.has(journey.userId)

      // Determinar estado
      let status = 'unknown'
      if (isConnectedViaWS) {
        status = monitor?.appState || 'active'
      } else if (monitor?.lastHeartbeat) {
        const lastHeartbeatTime = new Date(monitor.lastHeartbeat).getTime()
        const now = Date.now()
        const minutesSinceHeartbeat = (now - lastHeartbeatTime) / 1000 / 60

        if (minutesSinceHeartbeat < 5) {
          status = monitor.appState || 'active'
        } else if (minutesSinceHeartbeat < 15) {
          status = 'inactive'
        } else {
          status = 'disconnected'
        }
      }

      return {
        userId: journey.userId,
        userName: journey.user.name,
        userEmail: journey.user.email,
        journeyId: journey.id,
        journeyStartTime: journey.timestamp,
        lastHeartbeat: monitor?.lastHeartbeat || null,
        appState: status,
        isConnectedViaWS,
        lastLocation: lastLocation ? {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          recordedAt: lastLocation.recordedAt
        } : (monitor?.lastLocation as any || null),
        placeName: journey.placeName
      }
    }))

    // Ordenar por estado (activos primero)
    const sorted = activeDevices.sort((a, b) => {
      const statusOrder: Record<string, number> = {
        'active': 1,
        'background': 2,
        'inactive': 3,
        'disconnected': 4,
        'unknown': 5
      }
      return statusOrder[a.appState] - statusOrder[b.appState]
    })

    return NextResponse.json({
      success: true,
      devices: sorted,
      summary: {
        total: sorted.length,
        connected: sorted.filter(d => d.isConnectedViaWS).length,
        active: sorted.filter(d => d.appState === 'active').length,
        background: sorted.filter(d => d.appState === 'background').length,
        inactive: sorted.filter(d => d.appState === 'inactive').length,
        disconnected: sorted.filter(d => d.appState === 'disconnected').length
      }
    })

  } catch (error) {
    console.error('Error obteniendo dispositivos activos:', error)
    return NextResponse.json({
      error: 'Error al obtener dispositivos activos'
    }, { status: 500 })
  }
}
