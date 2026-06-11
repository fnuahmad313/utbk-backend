import { Router } from 'express'
import { requireRole } from '../../middlewares/role.middleware'
import { Role } from '@prisma/client'
import * as aiController from './ai.controller'

const router = Router()

// Semua endpoint AI butuh auth (SISWA)
router.use(requireRole(Role.SISWA))

/**
 * GET /api/v1/ai/analisis
 * Analisis kelemahan siswa berdasarkan semua history jawaban (latihan + tryout)
 */
router.get('/analisis', aiController.getAnalisis)

/**
 * GET /api/v1/ai/rekomendasi-ptn
 * Rekomendasi PTN & jurusan berdasarkan skor tryout terakhir
 */
router.get('/rekomendasi-ptn', aiController.getRekomendasiPTN)

/**
 * POST /api/v1/ai/chat
 * Chat dengan AI tutor Tuto
 *
 * Body:
 * {
 *   "pesan": "Jelaskan cara menghitung integral substitusi",
 *   "riwayat": [                        // opsional, kirim untuk lanjutkan percakapan
 *     { "role": "user",  "content": "..." },
 *     { "role": "model", "content": "..." }
 *   ]
 * }
 */
router.post('/chat', aiController.postChat)

export default router
