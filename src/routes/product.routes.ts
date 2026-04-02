import { Router } from 'express'
import * as ctrl from '../controllers/product.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { upload } from '../middleware/upload'

const r: Router = Router()

r.get('/',                ctrl.list)
r.get('/featured',        ctrl.getFeatured)
r.get('/new-arrivals',    ctrl.getNewArrivals)
r.get('/id/:id',          ctrl.getById)
r.get('/id/:id/related',  ctrl.getRelated)
r.get('/:slug',           ctrl.getOne)

r.post('/',
  authenticate, requireAdmin, ctrl.create)

r.put('/:id',
  authenticate, requireAdmin, ctrl.update)

r.delete('/:id',
  authenticate, requireAdmin, ctrl.remove)

r.post('/upload/images',
  authenticate, requireAdmin,
  upload.array('images', 10),
  ctrl.uploadImages)

export default r