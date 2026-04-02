import fs from 'fs'
import path from 'path'
import app from './app'
import { config } from './config'
import { prisma } from './utils/prisma'

// Ensure upload directory exists - skip on Vercel as it is read-only
if (!process.env.VERCEL) {
  const uploadPath = path.join(process.cwd(), config.uploadDir)
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true })
    console.log(`📁 Created upload directory: ${uploadPath}`)
  }
}

async function bootstrap() {
  // Test database connection
  try {
    await prisma.$connect()
    console.log('✅ Database connected')
  } catch (err) {
    console.error('❌ Database connection failed:', err)
  }

  // Only listen if we are NOT on Vercel
  if (!process.env.VERCEL) {
    const server = app.listen(config.port, () => {
      console.log(`\n🚀 Elara API running`)
      console.log(`   Port:   ${config.port}`)
      console.log(`   Env:    ${config.env}`)
      console.log(`   Client: ${config.clientOrigin}\n`)
    })

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received. Shutting down...')
      await prisma.$disconnect()
      server.close(() => process.exit(0))
    })
  }
}

bootstrap().catch(async (err) => {
  console.error('❌ Startup failed:', err)
  if (!process.env.VERCEL) {
    await prisma.$disconnect()
    process.exit(1)
  }
})

export default app