import { Router } from 'express'
import * as ctrl from '../controllers/profile.controller'
import { authenticate } from '../middleware/auth'

const r = Router()

r.use(authenticate)

r.get('/',                       ctrl.getProfile)
r.put('/',                       ctrl.updateProfile)
r.put('/password',               ctrl.changePassword)
r.post('/addresses',             ctrl.addAddress)
r.delete('/addresses/:addressId',ctrl.removeAddress)

export default r