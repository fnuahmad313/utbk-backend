import { Response, NextFunction } from 'express'
import { Role } from '@prisma/client'
import { AuthRequest } from './auth.middleware'
import { prisma } from '../config/prisma'
import { supabaseAdmin } from '../config/supabase'

export const requireRole = (...roles: Role[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      res.status(401).json({ message: 'Token tidak ditemukan' })
      return
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      res.status(401).json({ message: 'Token tidak valid atau sudah expired' })
      return
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: data.user.id }
    })

    if (!dbUser) {
      res.status(403).json({ message: 'User tidak ditemukan di database' })
      return
    }

    if (!roles.includes(dbUser.role)) {
      res.status(403).json({
        message: `Akses ditolak. Diperlukan role: ${roles.join(' atau ')}`
      })
      return
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role
    }

    next()
  }
}
