import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../utils/prisma'

const r = Router()

r.use(authenticate)

// Get wishlist
r.get('/', async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.user.userId },
      include: { wishlist: true },
    })
    res.json({ success: true, data: user?.wishlist || [] })
  } catch (error) {
    console.error('Failed to get wishlist:', error)
    res.status(500).json({ success: false, message: 'Failed to retrieve wishlist.' })
  }
})

// Add to wishlist
r.post('/:productId', async (req: any, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data:  { wishlist: { connect: { id: req.params.productId } } },
    })
    res.json({ success: true, message: 'Added to wishlist' })
  } catch (error) {
    console.error('Failed to add to wishlist:', error)
    res.status(500).json({ success: false, message: 'Failed to add item to wishlist.' })
  }
})

// Remove from wishlist
r.delete('/:productId', async (req: any, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data:  { wishlist: { disconnect: { id: req.params.productId } } },
    })
    res.json({ success: true, message: 'Removed from wishlist' })
  } catch (error) {
    console.error('Failed to remove from wishlist:', error)
    res.status(500).json({ success: false, message: 'Failed to remove item from wishlist.' })
  }
})

export default r