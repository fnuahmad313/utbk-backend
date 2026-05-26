import { Router } from 'express'
import { requireRole } from '../../middlewares/role.middleware'
import { Role } from '@prisma/client'
import * as RekomendasiController from './rekomendasi.controller'

const router = Router()

router.get('/', requireRole(Role.SISWA) as any, RekomendasiController.getRekomendasiJurusan as any)

export default router
