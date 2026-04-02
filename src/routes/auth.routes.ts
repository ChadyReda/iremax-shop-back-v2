import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'

const r: Router = Router()

r.post('/register', ctrl.register)
r.post('/login',    ctrl.login)
r.post('/logout',   ctrl.logout)
r.post('/refresh',  ctrl.refresh)
r.get('/me',        authenticate, ctrl.me)

export default r