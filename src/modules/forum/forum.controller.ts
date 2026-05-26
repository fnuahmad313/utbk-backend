import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import * as ForumService from './forum.service'

const handleError = (res: Response, error: string) => {
  switch (error) {
    case 'nama_required':
      return res.status(400).json({ message: 'Nama kategori wajib diisi' })
    case 'kategori_already_exists':
      return res.status(400).json({ message: 'Kategori sudah ada atau slug duplikat' })
    case 'kategori_not_found':
      return res.status(404).json({ message: 'Kategori tidak ditemukan' })
    case 'kategori_has_posts':
      return res.status(400).json({ message: 'Kategori masih memiliki post dan tidak bisa dihapus' })
    case 'post_not_found':
      return res.status(404).json({ message: 'Post tidak ditemukan' })
    case 'forbidden':
      return res.status(403).json({ message: 'Akses ditolak. Anda bukan pemilik resource ini' })
    case 'judul_invalid':
      return res.status(400).json({ message: 'Judul tidak boleh kosong dan minimal 5 karakter' })
    case 'konten_invalid':
      return res.status(400).json({ message: 'Konten tidak boleh kosong dan minimal 10 karakter' })
    case 'kategori_invalid':
      return res.status(400).json({ message: 'KategoriId harus valid' })
    case 'post_locked':
      return res.status(400).json({ message: 'Post ini sudah dikunci dan tidak bisa dikomentari' })
    case 'parent_komentar_not_found':
      return res.status(400).json({ message: 'Komentar parent tidak ditemukan' })
    case 'cannot_reply_to_reply':
      return res.status(400).json({ message: 'Tidak boleh reply di level komentar ini (maksimal 2 level)' })
    case 'komentar_not_found':
      return res.status(404).json({ message: 'Komentar tidak ditemukan' })
    default:
      return res.status(500).json({ message: 'Internal server error' })
  }
}

// ==========================================
// ===== KATEGORI =====
// ==========================================

export const getKategoriList = async (req: AuthRequest, res: Response) => {
  try {
    const data = await ForumService.getKategoriList()
    res.json({ data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const createKategori = async (req: AuthRequest, res: Response) => {
  try {
    const { nama, deskripsi } = req.body
    const result = await ForumService.createKategori(nama, deskripsi)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.status(201).json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const updateKategori = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { nama, deskripsi } = req.body
    const result = await ForumService.updateKategori(id, { nama, deskripsi })
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteKategori = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const result = await ForumService.deleteKategori(id)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ message: result.message })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ==========================================
// ===== POST =====
// ==========================================

export const getPostList = async (req: AuthRequest, res: Response) => {
  try {
    const { kategoriId, kategoriSlug, userId, search, isPinned, page, limit } = req.query

    const filter = {
      kategoriId: kategoriId as string,
      kategoriSlug: kategoriSlug as string,
      userId: userId as string,
      search: search as string,
      isPinned: isPinned !== undefined ? isPinned === 'true' : undefined
    }

    const pagination = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    }

    const result = await ForumService.getPostList(filter, pagination)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getPostById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const result = await ForumService.getPostById(id, userId)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const { kategoriId, judul, konten } = req.body
    const result = await ForumService.createPost(userId, { kategoriId, judul, konten })
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.status(201).json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const { judul, konten } = req.body
    const result = await ForumService.updatePost(id, userId, { judul, konten })
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.user?.id
    const role = req.user?.role

    if (!userId || !role) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const result = await ForumService.deletePost(id, userId, role)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ message: result.message })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const toggleLikePost = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const result = await ForumService.toggleLikePost(id, userId)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const togglePinPost = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const result = await ForumService.togglePinPost(id)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const toggleLockPost = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const result = await ForumService.toggleLockPost(id)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

// ==========================================
// ===== KOMENTAR =====
// ==========================================

export const createKomentar = async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.postId as string
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const { konten, parentId } = req.body
    const result = await ForumService.createKomentar(postId, userId, { konten, parentId })
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.status(201).json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const updateKomentar = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const { konten } = req.body
    const result = await ForumService.updateKomentar(id, userId, konten)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteKomentar = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.user?.id
    const role = req.user?.role

    if (!userId || !role) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const result = await ForumService.deleteKomentar(id, userId, role)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ message: result.message })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const toggleLikeKomentar = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const result = await ForumService.toggleLikeKomentar(id, userId)
    if ('error' in result) {
      handleError(res, result.error as string)
      return
    }
    res.json({ data: result.data })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}
