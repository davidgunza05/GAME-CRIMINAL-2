import http from 'http'
import app from './app'
import { env } from './config/env'
import { setupSocketIO, setIO } from './sockets/game.socket'
import { prisma } from './config/prisma'

const start = async () => {
  // Test DB connection
  try {
    await prisma.$connect()
    console.log('✅ PostgreSQL connected')
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err)
    process.exit(1)
  }

  const httpServer = http.createServer(app)
  const io = setupSocketIO(httpServer)
  setIO(io)

  httpServer.listen(env.PORT, () => {
    console.log(`🔍 Crime Game API — ${env.NODE_ENV} — http://localhost:${env.PORT}/api`)
  })
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received. Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received. Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

start()
