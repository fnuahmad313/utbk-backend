import { Router } from 'express'
import { requireRole } from '../../middlewares/role.middleware'
import { authenticate } from '../../middlewares/auth.middleware'
import { Role } from '@prisma/client'
import * as ForumController from './forum.controller'

const router = Router()

// ===== KATEGORI =====
router.get('/kategori', authenticate, ForumController.getKategoriList)
router.post('/kategori', requireRole(Role.ADMIN), ForumController.createKategori)
router.put('/kategori/:id', requireRole(Role.ADMIN), ForumController.updateKategori)
router.delete('/kategori/:id', requireRole(Role.ADMIN), ForumController.deleteKategori)

// ===== KOMENTAR (statis sebelum /:id) =====
router.put('/komentar/:id', authenticate, ForumController.updateKomentar)
router.delete('/komentar/:id', requireRole(Role.ADMIN, Role.SISWA), ForumController.deleteKomentar)
router.post('/komentar/:id/like', requireRole(Role.SISWA), ForumController.toggleLikeKomentar)

// ===== POST =====
router.get('/posts', authenticate, ForumController.getPostList)
router.post('/posts', requireRole(Role.SISWA), ForumController.createPost)
router.get('/posts/:id', authenticate, ForumController.getPostById)
router.put('/posts/:id', authenticate, ForumController.updatePost)
router.delete('/posts/:id', requireRole(Role.ADMIN, Role.SISWA), ForumController.deletePost)
router.post('/posts/:id/like', requireRole(Role.SISWA), ForumController.toggleLikePost)
router.patch('/posts/:id/pin', requireRole(Role.ADMIN), ForumController.togglePinPost)
router.patch('/posts/:id/lock', requireRole(Role.ADMIN), ForumController.toggleLockPost)
router.post('/posts/:postId/komentar', requireRole(Role.SISWA), ForumController.createKomentar)

export default router
