import { Router } from 'express'
import { requireRole } from '../../middlewares/role.middleware'
import { authenticate } from '../../middlewares/auth.middleware'
import { Role } from '@prisma/client'
import * as PTNController from './ptn.controller'

const router = Router()

// Jurusan routes — statis di atas dinamis
router.get('/jurusan', authenticate, PTNController.getJurusanList)
router.get('/jurusan/:id', authenticate, PTNController.getJurusanById)
router.post('/jurusan', requireRole(Role.ADMIN), PTNController.createJurusan)
router.put('/jurusan/:id', requireRole(Role.ADMIN), PTNController.updateJurusan)
router.delete('/jurusan/:id', requireRole(Role.ADMIN), PTNController.deleteJurusan)

// PTN routes
router.get('/', authenticate, PTNController.getPTNList)
router.get('/:id', authenticate, PTNController.getPTNById)
router.get('/:ptnId/jurusan', authenticate, PTNController.getJurusanByPTN)
router.post('/', requireRole(Role.ADMIN), PTNController.createPTN)
router.put('/:id', requireRole(Role.ADMIN), PTNController.updatePTN)
router.delete('/:id', requireRole(Role.ADMIN), PTNController.deletePTN)

export default router
