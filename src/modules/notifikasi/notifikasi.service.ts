import { prisma } from '../../config/prisma'

export const createNotifikasi = async (input: {
  userId: string
  judul: string
  pesan: string
  tipe: string
  data?: Record<string, any>
}) => {
  return prisma.notifikasi.create({
    data: {
      userId: input.userId,
      judul: input.judul,
      pesan: input.pesan,
      tipe: input.tipe,
      data: input.data,
      isRead: false,
    }
  })
}

export const createNotifikasiBulk = async (inputs: {
  userId: string
  judul: string
  pesan: string
  tipe: string
  data?: Record<string, any>
}[]) => {
  return prisma.notifikasi.createMany({
    data: inputs.map(input => ({
      userId: input.userId,
      judul: input.judul,
      pesan: input.pesan,
      tipe: input.tipe,
      data: input.data,
      isRead: false,
    }))
  })
}

export const getNotifikasiList = async (userId: string) => {
  const [total, unreadCount, notifikasi] = await Promise.all([
    prisma.notifikasi.count({ where: { userId } }),
    prisma.notifikasi.count({ where: { userId, isRead: false } }),
    prisma.notifikasi.findMany({
      where: { userId },
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' }
      ]
    })
  ])

  return {
    data: {
      total,
      unreadCount,
      notifikasi
    }
  }
}

export const getUnreadCount = async (userId: string) => {
  const unreadCount = await prisma.notifikasi.count({
    where: {
      userId,
      isRead: false
    }
  })

  return {
    data: {
      unreadCount
    }
  }
}

export const markAsRead = async (id: string, userId: string) => {
  const notifikasi = await prisma.notifikasi.findUnique({
    where: { id }
  })

  if (!notifikasi) {
    return { error: 'notifikasi_not_found' }
  }

  if (notifikasi.userId !== userId) {
    return { error: 'forbidden' }
  }

  const updated = await prisma.notifikasi.update({
    where: { id },
    data: { isRead: true }
  })

  return {
    data: {
      id: updated.id,
      isRead: updated.isRead
    }
  }
}

export const markAllAsRead = async (userId: string) => {
  const result = await prisma.notifikasi.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  })

  return {
    data: {
      updatedCount: result.count,
      message: `${result.count} notifikasi telah ditandai sebagai dibaca`
    }
  }
}

export const deleteNotifikasi = async (id: string, userId: string) => {
  const notifikasi = await prisma.notifikasi.findUnique({
    where: { id }
  })

  if (!notifikasi) {
    return { error: 'notifikasi_not_found' }
  }

  if (notifikasi.userId !== userId) {
    return { error: 'forbidden' }
  }

  await prisma.notifikasi.delete({
    where: { id }
  })

  return { message: 'Notifikasi berhasil dihapus' }
}
