import { Router } from 'express'
import authRoutes     from './auth.routes'
import productRoutes  from './product.routes'
import categoryRoutes from './category.routes'
import cartRoutes     from './cart.routes'
import orderRoutes    from './order.routes'
import profileRoutes  from './profile.routes'
import adminRoutes    from './admin.routes'
import reviewRoutes   from './review.routes'
import wishlistRoutes from './wishlist.routes'

const router = Router()

router.use('/auth',       authRoutes)
router.use('/products',   productRoutes)
router.use('/categories', categoryRoutes)
router.use('/cart',       cartRoutes)
router.use('/orders',     orderRoutes)
router.use('/profile',    profileRoutes)
router.use('/admin',      adminRoutes)
router.use('/wishlist',  wishlistRoutes)
router.use('',            reviewRoutes)

router.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    service:   'Elara API',
  })
})

export default router