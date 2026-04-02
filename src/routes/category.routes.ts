import { Router } from 'express'
import * as ctrl from '../controllers/category.controller'
import { authenticate, requireAdmin } from '../middleware/auth'

const r = Router()

r.get('/',      ctrl.list)
r.get('/all',   authenticate, requireAdmin, ctrl.listAll)
r.get('/:slug', ctrl.getBySlug)

r.post('/',     authenticate, requireAdmin, ctrl.create)
r.put('/:id',   authenticate, requireAdmin, ctrl.update)
r.delete('/:id',authenticate, requireAdmin, ctrl.remove)

export default r