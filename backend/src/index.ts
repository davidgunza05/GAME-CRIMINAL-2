import app from './app'
import { env } from './config/env'
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

  app.listen(env.PORT, () => {
    console.log(`\n🔍 Crime Game API`)
    console.log(`   Mode:        ${env.NODE_ENV}`)
    console.log(`   Port:        ${env.PORT}`)
    console.log(`   Client URL:  ${env.CLIENT_URL}`)
    console.log(`   API Base:    http://localhost:${env.PORT}/api\n`)
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
