import { Router } from 'express'
import * as ctrl from '../controllers/cart.controller'
import { authenticate } from '../middleware/auth'

const r = Router()

r.use(authenticate)

r.get('/',              ctrl.getCart)
r.post('/items',        ctrl.addItem)
r.put('/items/:sku',    ctrl.updateItem)
r.delete('/items/:sku', ctrl.removeItem)
r.delete('/',           ctrl.clearCart)

export default r