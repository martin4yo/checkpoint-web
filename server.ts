import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

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

  server.listen(port, (err?: Error) => {
    if (err) throw err
    console.log(`✅ Servidor Next.js listo en http://${hostname}:${port}`)
  })

  // Manejo de cierre graceful
  process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...')
    server.close(() => {
      console.log('Servidor HTTP cerrado')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('SIGINT recibido, cerrando servidor...')
    server.close(() => {
      console.log('Servidor HTTP cerrado')
      process.exit(0)
    })
  })
})
