import { Request, Response } from 'express'
import * as aiService from './ai.service'
import { ChatMessage } from './ai.service'
import { AuthRequest } from '../../middlewares/auth.middleware'

// GET /api/v1/ai/analisis
export const getAnalisis = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id

    const result = await aiService.analisisSiswa(userId)

    if (result.error === 'no_data') {
        return res.status(404).json({ success: false, message: result.message })
    }
    if (result.error === 'ai_error') {
        return res.status(503).json({ success: false, message: result.message })
    }

    return res.json({ success: true, data: result.data })
}

// GET /api/v1/ai/rekomendasi-ptn
export const getRekomendasiPTN = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id

    const result = await aiService.rekomendasiPTN(userId)

    if (result.error === 'no_data') {
        return res.status(404).json({ success: false, message: result.message })
    }
    if (result.error === 'no_match') {
        return res.status(404).json({ success: false, message: result.message })
    }
    if (result.error === 'ai_error') {
        return res.status(503).json({ success: false, message: result.message })
    }

    return res.json({ success: true, data: result.data })
}

// POST /api/v1/ai/chat
export const postChat = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id
    const { pesan, riwayat } = req.body as {
        pesan: string
        riwayat?: ChatMessage[]
    }

    // Validasi riwayat chat — maksimal 20 pesan terakhir untuk hemat token
    const riwayatValid: ChatMessage[] = Array.isArray(riwayat)
        ? riwayat
            .filter(
                (m) =>
                    (m.role === 'user' || m.role === 'model') &&
                    typeof m.content === 'string' &&
                    m.content.trim() !== ''
            )
            .slice(-20)
        : []

    const result = await aiService.chatTutor(userId, pesan, riwayatValid)

    if (result.error === 'validation_error') {
        return res.status(400).json({ success: false, message: result.message })
    }
    if (result.error === 'ai_error') {
        return res.status(503).json({ success: false, message: result.message })
    }

    return res.json({ success: true, data: result.data })
}
