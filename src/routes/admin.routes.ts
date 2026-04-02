import { Router } from 'express'
import * as ctrl from '../controllers/admin.controller'
import { authenticate, requireAdmin } from '../middleware/auth'

const r = Router()

r.use(authenticate, requireAdmin)

r.get('/stats',              ctrl.getDashboardStats)
r.get('/users',              ctrl.listUsers)
r.put('/users/:id/role',     ctrl.updateUserRole)
r.put('/users/:id/status',   ctrl.updateUserStatus)

export default r