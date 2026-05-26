import { Router } from 'express'
import { requireRole } from '../../middlewares/role.middleware'
import { Role } from '@prisma/client'
import * as DashboardController from './dashboard.controller'

const router = Router()

// PENTING: route statis '/admin' harus di atas route dinamis
router.get('/admin', requireRole(Role.ADMIN) as any, DashboardController.getAdminDashboard as any)
router.get('/', requireRole(Role.SISWA) as any, DashboardController.getSiswaDashboard as any)

export default router
