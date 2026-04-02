import { Router } from 'express'
import * as ctrl from '../controllers/order.controller'
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth'

const r: Router = Router()

r.post('/',             optionalAuth,               ctrl.create)
r.get('/my',            authenticate,               ctrl.myOrders)
r.get('/admin/all',     authenticate, requireAdmin, ctrl.adminList)
r.get('/:id',           optionalAuth,               ctrl.getOne)
r.put('/:id/status',    authenticate, requireAdmin, ctrl.updateStatus)

export default r