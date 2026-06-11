import { Response } from 'express'
import * as NotifikasiService from './notifikasi.service'

import { AuthRequest } from '../../middlewares/auth.middleware'

export const getNotifikasiList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const result = await NotifikasiService.getNotifikasiList(userId)
    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const result = await NotifikasiService.getUnreadCount(userId)
    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const result = await NotifikasiService.markAsRead(id as string, userId)

    if (result.error === 'notifikasi_not_found') {
      res.status(404).json({ error: 'Notifikasi tidak ditemukan' })
      return
    }

    if (result.error === 'forbidden') {
      res.status(403).json({ error: 'Tidak memiliki akses' })
      return
    }

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const result = await NotifikasiService.markAllAsRead(userId)
    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export const deleteNotifikasi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const result = await NotifikasiService.deleteNotifikasi(id as string, userId)

    if (result.error === 'notifikasi_not_found') {
      res.status(404).json({ error: 'Notifikasi tidak ditemukan' })
      return
    }

    if (result.error === 'forbidden') {
      res.status(403).json({ error: 'Tidak memiliki akses' })
      return
    }

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
