import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage, Server } from 'http'
import { verifyToken } from './auth'
import { prisma } from './prisma'

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  journeyId?: string
  isAlive?: boolean
}

interface WebSocketMessage {
  type: string
  [key: string]: unknown
}

class JourneyWebSocketServer {
  private wss: WebSocketServer | null = null
  private clients: Map<string, AuthenticatedWebSocket> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null

  initialize(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/journey'
    })

    console.log('🔌 WebSocket Server inicializado en /ws/journey')

    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      await this.handleConnection(ws, req)
    })

    // Heartbeat para detectar conexiones muertas
    this.startHeartbeat()
  }

  private async handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage) {
    try {
      // Extraer token y journeyId de la URL
      const url = new URL(req.url!, `http://${req.headers.host}`)
      const token = url.searchParams.get('token')
      const journeyId = url.pathname.split('/').pop()

      if (!token) {
        ws.close(1008, 'Token requerido')
        return
      }

      // Verificar token
      const payload = await verifyToken(token)
      if (!payload) {
        ws.close(1008, 'Token inválido')
        return
      }

      // Autenticar WebSocket
      ws.userId = payload.userId
      ws.journeyId = journeyId
      ws.isAlive = true

      // Guardar cliente
      const clientKey = `${payload.userId}-${journeyId}`
      this.clients.set(clientKey, ws)

      console.log(`✅ Cliente WebSocket conectado: User ${payload.userId}, Journey ${journeyId}`)

      // Enviar confirmación de conexión
      this.sendToClient(ws, {
        type: 'connection_established',
        message: 'WebSocket conectado exitosamente'
      })

      // Manejar mensajes
      ws.on('message', async (data: Buffer) => {
        await this.handleMessage(ws, data)
      })

      // Manejar desconexión
      ws.on('close', () => {
        this.clients.delete(clientKey)
        console.log(`❌ Cliente WebSocket desconectado: ${clientKey}`)
      })

      // Responder a pings
      ws.on('pong', () => {
        ws.isAlive = true
      })

    } catch (error) {
      console.error('Error en conexión WebSocket:', error)
      ws.close(1011, 'Error interno del servidor')
    }
  }

  private async handleMessage(ws: AuthenticatedWebSocket, data: Buffer) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString())

      console.log(`📨 Mensaje WebSocket recibido:`, message.type)

      switch (message.type) {
        case 'ping':
          await this.handlePing(ws, message)
          break

        case 'app_state_change':
          await this.handleAppStateChange(ws, message)
          break

        case 'location_update':
          await this.handleLocationUpdate(ws, message)
          break

        case 'connection_established':
          // Ya manejado en la conexión inicial
          break

        default:
          console.warn(`⚠️ Tipo de mensaje no manejado: ${message.type}`)
      }

    } catch (error) {
      console.error('Error procesando mensaje WebSocket:', error)
    }
  }

  private async handlePing(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { app_state, timestamp } = message

    // Actualizar estado en base de datos
    if (ws.userId && ws.journeyId) {
      try {
        await prisma.journeyMonitor.update({
          where: {
            userId_journeyId: {
              userId: ws.userId,
              journeyId: ws.journeyId
            }
          },
          data: {
            lastHeartbeat: new Date(),
            appState: (app_state as string) || 'unknown'
          }
        })

        console.log(`💓 Ping recibido - User: ${ws.userId}, Estado: ${app_state}`)
      } catch (error) {
        console.error('Error actualizando ping en BD:', error)
      }
    }

    // Responder con pong
    this.sendToClient(ws, {
      type: 'pong',
      timestamp: new Date().toISOString()
    })
  }

  private async handleAppStateChange(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { app_state, timestamp } = message

    if (ws.userId && ws.journeyId) {
      try {
        await prisma.journeyMonitor.update({
          where: {
            userId_journeyId: {
              userId: ws.userId,
              journeyId: ws.journeyId
            }
          },
          data: {
            appState: (app_state as string) || 'unknown',
            lastHeartbeat: new Date()
          }
        })

        console.log(`📱 Cambio de estado - User: ${ws.userId}, Nuevo estado: ${app_state}`)
      } catch (error) {
        console.error('Error actualizando estado de app:', error)
      }
    }
  }

  private async handleLocationUpdate(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { latitude, longitude, timestamp } = message

    if (ws.userId && ws.journeyId) {
      try {
        // Guardar ubicación
        await prisma.journeyLocation.create({
          data: {
            userId: ws.userId,
            startCheckpointId: ws.journeyId,
            latitude: latitude as number,
            longitude: longitude as number,
            recordedAt: new Date((timestamp as string) || Date.now())
          }
        })

        // Actualizar monitor
        await prisma.journeyMonitor.update({
          where: {
            userId_journeyId: {
              userId: ws.userId,
              journeyId: ws.journeyId
            }
          },
          data: {
            lastLocation: { latitude: latitude as number, longitude: longitude as number },
            lastHeartbeat: new Date()
          }
        })

        console.log(`📍 Ubicación actualizada via WebSocket - User: ${ws.userId}`)
      } catch (error) {
        console.error('Error guardando ubicación:', error)
      }
    }
  }

  // Solicitar ubicación a un cliente específico
  async requestLocation(userId: string, journeyId: string) {
    const clientKey = `${userId}-${journeyId}`
    const ws = this.clients.get(clientKey)

    if (ws && ws.readyState === WebSocket.OPEN) {
      this.sendToClient(ws, {
        type: 'request_location',
        timestamp: new Date().toISOString()
      })
      console.log(`📍 Ubicación solicitada a User: ${userId}`)
      return true
    }

    return false
  }

  // Enviar actualización de configuración
  async sendConfigUpdate(userId: string, journeyId: string, config: Record<string, unknown>) {
    const clientKey = `${userId}-${journeyId}`
    const ws = this.clients.get(clientKey)

    if (ws && ws.readyState === WebSocket.OPEN) {
      this.sendToClient(ws, {
        type: 'update_config',
        data: config
      })
      return true
    }

    return false
  }

  // Enviar notificación a un cliente
  async sendNotification(userId: string, journeyId: string, message: string) {
    const clientKey = `${userId}-${journeyId}`
    const ws = this.clients.get(clientKey)

    if (ws && ws.readyState === WebSocket.OPEN) {
      this.sendToClient(ws, {
        type: 'notification',
        message
      })
      return true
    }

    return false
  }

  // Broadcast a todos los clientes conectados
  broadcast(message: WebSocketMessage) {
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToClient(ws, message)
      }
    })
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    try {
      ws.send(JSON.stringify(message))
    } catch (error) {
      console.error('Error enviando mensaje a cliente:', error)
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws, key) => {
        if (ws.isAlive === false) {
          console.log(`💔 Cliente sin respuesta, cerrando: ${key}`)
          this.clients.delete(key)
          return ws.terminate()
        }

        ws.isAlive = false
        ws.ping()
      })
    }, 30000) // 30 segundos
  }

  getConnectedClients() {
    const clients: Array<{userId: string, journeyId: string, isAlive: boolean}> = []

    this.clients.forEach((ws, key) => {
      if (ws.userId && ws.journeyId) {
        clients.push({
          userId: ws.userId,
          journeyId: ws.journeyId,
          isAlive: ws.isAlive || false
        })
      }
    })

    return clients
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.clients.forEach((ws) => {
      ws.close(1000, 'Servidor cerrando')
    })

    if (this.wss) {
      this.wss.close()
    }

    console.log('🔌 WebSocket Server cerrado')
  }
}

// Singleton
export const journeyWebSocketServer = new JourneyWebSocketServer()
