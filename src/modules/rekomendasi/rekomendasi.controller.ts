import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import * as RekomendasiService from './rekomendasi.service'

export const getRekomendasiJurusan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'Token tidak valid' })
      return
    }

    const kelompok = req.query.kelompok as string | undefined
    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 10

    const result = await RekomendasiService.getRekomendasiJurusan(userId, kelompok, limitParam)

    if ('error' in result) {
      if (result.error === 'no_tryout_data') {
        res.status(400).json({
          message: 'Belum ada data tryout yang selesai untuk dijadikan referensi skor',
        })
        return
      }
      if (result.error === 'invalid_kelompok') {
        res.status(400).json({
          message: 'Kelompok tidak valid. Gunakan SAINTEK, SOSHUM, atau CAMPURAN',
        })
        return
      }
      res.status(400).json({ message: result.error })
      return
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}
