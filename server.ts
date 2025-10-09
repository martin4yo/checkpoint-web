import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { journeyWebSocketServer } from './src/lib/websocket-server'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Inicializar WebSocket Server después de que el servidor HTTP esté listo
  server.on('listening', () => {
    try {
      journeyWebSocketServer.initialize(server)
      console.log(`✅ Servidor Next.js con WebSocket listo en http://${hostname}:${port}`)
    } catch (error) {
      console.error('Error inicializando WebSocket:', error)
    }
  })

  server.listen(port, (err?: Error) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })

  // Manejo de cierre graceful
  process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...')
    journeyWebSocketServer.shutdown()
    server.close(() => {
      console.log('Servidor HTTP cerrado')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('SIGINT recibido, cerrando servidor...')
    journeyWebSocketServer.shutdown()
    server.close(() => {
      console.log('Servidor HTTP cerrado')
      process.exit(0)
    })
  })
})
