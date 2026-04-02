import app from '../src/app'
import { prisma } from '../src/utils/prisma'

// This file is used specifically for Vercel's serverless environment.
// Vercel automatically treats any file in the /api directory as a serverless function.
// We export the Express app to be used as the handler.

let isConnected = false

export default async (req: any, res: any) => {
  // Ensure Prisma is connected on the first request in this serverless instance
  if (!isConnected) {
    try {
      await prisma.$connect()
      isConnected = true
      console.log('✅ Prisma connected inside serverless handler')
    } catch (err) {
      console.error('❌ Database connection failed in serverless:', err)
    }
  }

  // Pass the request to the Express app
  return app(req, res)
}
