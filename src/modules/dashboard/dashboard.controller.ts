import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import * as DashboardService from './dashboard.service'

export const getSiswaDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'Token tidak valid' })
      return
    }

    const data = await DashboardService.getSiswaDashboard(userId)
    res.json({ data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const data = await DashboardService.getAdminDashboard()
    res.json({ data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}
