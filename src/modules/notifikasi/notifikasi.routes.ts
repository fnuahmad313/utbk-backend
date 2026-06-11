import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import * as NotifikasiController from './notifikasi.controller'

const router = Router()

// PENTING: route statis harus di atas route dinamis
router.get('/unread-count', authenticate, NotifikasiController.getUnreadCount)
router.patch('/read-all', authenticate, NotifikasiController.markAllAsRead)
router.get('/', authenticate, NotifikasiController.getNotifikasiList)
router.patch('/:id/read', authenticate, NotifikasiController.markAsRead)
router.delete('/:id', authenticate, NotifikasiController.deleteNotifikasi)

export default router
