import '../config/env'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import app from '../app'

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: { auth: { signUp: vi.fn(), signInWithPassword: vi.fn() } },
  supabaseAdmin: {
    auth: {
      getUser: vi.fn().mockImplementation(async (token: string) => {
        if (token === 'admin-token') {
          return { data: { user: { id: 'test-forum-admin-uuid', email: 'admin-forum@utbk.dev' } }, error: null }
        }
        if (token === 'siswa-token') {
          return { data: { user: { id: 'test-forum-siswa-uuid', email: 'siswa-forum@utbk.dev' } }, error: null }
        }
        if (token === 'siswa2-token') {
          return { data: { user: { id: 'test-forum-siswa2-uuid', email: 'siswa2-forum@utbk.dev' } }, error: null }
        }
        return { data: { user: null }, error: new Error('Token tidak valid') }
      })
    }
  }
}))

describe('Forum & Komunitas Module', () => {
  let adminToken = 'admin-token'
  let siswaToken = 'siswa-token'
  let siswa2Token = 'siswa2-token'

  let testKategoriId: string
  let testKategori2Id: string
  let testPostId: string
  let testPost2Id: string
  let testKomentarId: string
  let testReplyId: string

  beforeAll(async () => {
    const { prisma } = await import('../config/prisma')

    // Clean up first — use userId filter to catch ALL test posts (including 'Test Post Temp')
    const testUserIds = ['test-forum-admin-uuid', 'test-forum-siswa-uuid', 'test-forum-siswa2-uuid']
    await prisma.forumKomentarLike.deleteMany({ where: { komentar: { post: { userId: { in: testUserIds } } } } })
    await prisma.forumPostLike.deleteMany({ where: { post: { userId: { in: testUserIds } } } })
    await prisma.forumKomentar.deleteMany({ where: { post: { userId: { in: testUserIds } } } })
    await prisma.forumPost.deleteMany({ where: { userId: { in: testUserIds } } })
    await prisma.kategoriForumPost.deleteMany({ where: { nama: { startsWith: 'Test Kategori' } } })
    await prisma.user.deleteMany({
      where: { id: { in: ['test-forum-admin-uuid', 'test-forum-siswa-uuid', 'test-forum-siswa2-uuid'] } }
    })

    // Create users
    await prisma.user.upsert({
      where: { id: 'test-forum-admin-uuid' },
      update: {},
      create: { id: 'test-forum-admin-uuid', email: 'admin-forum@utbk.dev', name: 'Test Admin Forum', role: 'ADMIN' }
    })
    await prisma.user.upsert({
      where: { id: 'test-forum-siswa-uuid' },
      update: {},
      create: { id: 'test-forum-siswa-uuid', email: 'siswa-forum@utbk.dev', name: 'Test Siswa Forum', role: 'SISWA' }
    })
    await prisma.user.upsert({
      where: { id: 'test-forum-siswa2-uuid' },
      update: {},
      create: { id: 'test-forum-siswa2-uuid', email: 'siswa2-forum@utbk.dev', name: 'Test Siswa Forum 2', role: 'SISWA' }
    })
  })

  afterAll(async () => {
    const { prisma } = await import('../config/prisma')

    const testUserIds = ['test-forum-admin-uuid', 'test-forum-siswa-uuid', 'test-forum-siswa2-uuid']
    await prisma.forumKomentarLike.deleteMany({ where: { komentar: { post: { userId: { in: testUserIds } } } } })
    await prisma.forumPostLike.deleteMany({ where: { post: { userId: { in: testUserIds } } } })
    await prisma.forumKomentar.deleteMany({ where: { post: { userId: { in: testUserIds } } } })
    await prisma.forumPost.deleteMany({ where: { userId: { in: testUserIds } } })
    await prisma.kategoriForumPost.deleteMany({ where: { nama: { startsWith: 'Test Kategori' } } })
    await prisma.user.deleteMany({
      where: { id: { in: ['test-forum-admin-uuid', 'test-forum-siswa-uuid', 'test-forum-siswa2-uuid'] } }
    })
  })

  // ===== KATEGORI =====

  describe('POST /api/v1/forum/kategori', () => {
    it('gagal jika bukan admin (403)', async () => {
      const res = await request(app)
        .post('/api/v1/forum/kategori')
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ nama: 'Test Kategori Satu' })
      expect(res.status).toBe(403)
    })

    it('berhasil membuat kategori baru dan generate slug otomatis', async () => {
      const res = await request(app)
        .post('/api/v1/forum/kategori')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama: 'Test Kategori Satu', deskripsi: 'Kategori untuk testing' })
      
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.nama).toBe('Test Kategori Satu')
      expect(res.body.data.slug).toBe('test-kategori-satu')
      testKategoriId = res.body.data.id

      // Create a second one for later tests
      const res2 = await request(app)
        .post('/api/v1/forum/kategori')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama: 'Test Kategori Dua', deskripsi: 'Kategori kedua untuk testing' })
      expect(res2.status).toBe(201)
      testKategori2Id = res2.body.data.id
    })

    it('gagal jika nama kategori duplikat (400)', async () => {
      const res = await request(app)
        .post('/api/v1/forum/kategori')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama: 'Test Kategori Satu' })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/forum/kategori', () => {
    it('berhasil mendapat daftar kategori beserta jumlah post', async () => {
      const res = await request(app)
        .get('/api/v1/forum/kategori')
        .set('Authorization', `Bearer ${siswaToken}`)
      
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      const found = res.body.data.find((k: any) => k.id === testKategoriId)
      expect(found).toBeDefined()
      expect(found).toHaveProperty('_count')
      expect(found._count).toHaveProperty('posts')
    })
  })

  // ===== POST =====

  describe('POST /api/v1/forum/posts', () => {
    it('gagal jika bukan siswa (403)', async () => {
      const res = await request(app)
        .post('/api/v1/forum/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ kategoriId: testKategoriId, judul: 'Test Forum Post 1', konten: 'Konten post forum 1 yang panjang' })
      expect(res.status).toBe(403)
    })

    it('gagal jika judul terlalu pendek (400)', async () => {
      const res = await request(app)
        .post('/api/v1/forum/posts')
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ kategoriId: testKategoriId, judul: 'Abc', konten: 'Konten post forum 1 yang panjang' })
      expect(res.status).toBe(400)
    })

    it('gagal jika konten terlalu pendek (400)', async () => {
      const res = await request(app)
        .post('/api/v1/forum/posts')
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ kategoriId: testKategoriId, judul: 'Test Forum Post 1', konten: 'Short' })
      expect(res.status).toBe(400)
    })

    it('gagal jika kategoriId tidak valid (400)', async () => {
      const res = await request(app)
        .post('/api/v1/forum/posts')
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ kategoriId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', judul: 'Test Forum Post 1', konten: 'Konten post forum 1 yang panjang' })
      expect(res.status).toBe(400)
    })

    it('berhasil membuat post baru', async () => {
      const res = await request(app)
        .post('/api/v1/forum/posts')
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ kategoriId: testKategoriId, judul: 'Test Forum Post Satu', konten: 'Konten post forum 1 yang panjang sekali ini' })
      
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.judul).toBe('Test Forum Post Satu')
      testPostId = res.body.data.id

      // Create a second post by siswa2 for testing ordering/pins
      const res2 = await request(app)
        .post('/api/v1/forum/posts')
        .set('Authorization', `Bearer ${siswa2Token}`)
        .send({ kategoriId: testKategoriId, judul: 'Test Forum Post Dua', konten: 'Konten post forum 2 yang panjang sekali ini' })
      expect(res2.status).toBe(201)
      testPost2Id = res2.body.data.id
    })
  })

  describe('GET /api/v1/forum/posts', () => {
    it('berhasil mendapat daftar post dengan pagination', async () => {
      const res = await request(app)
        .get('/api/v1/forum/posts?page=1&limit=5')
        .set('Authorization', `Bearer ${siswaToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('meta')
      expect(res.body.meta.page).toBe(1)
      expect(res.body.meta.limit).toBe(5)
    })

    it('berhasil filter by kategoriId', async () => {
      const res = await request(app)
        .get(`/api/v1/forum/posts?kategoriId=${testKategoriId}`)
        .set('Authorization', `Bearer ${siswaToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body.data.every((p: any) => p.kategori.id === testKategoriId)).toBe(true)
    })

    it('berhasil search by judul', async () => {
      const res = await request(app)
        .get('/api/v1/forum/posts?search=Post Satu')
        .set('Authorization', `Bearer ${siswaToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body.data.some((p: any) => p.judul.includes('Satu'))).toBe(true)
    })

    it('pinned post muncul di atas', async () => {
      // First, pin post 2 (which was created after post 1)
      await request(app)
        .patch(`/api/v1/forum/posts/${testPost2Id}/pin`)
        .set('Authorization', `Bearer ${adminToken}`)

      const res = await request(app)
        .get('/api/v1/forum/posts')
        .set('Authorization', `Bearer ${siswaToken}`)
      
      expect(res.status).toBe(200)
      // The first post in the list should be post 2 because it is pinned
      expect(res.body.data[0].id).toBe(testPost2Id)
      expect(res.body.data[0].isPinned).toBe(true)

      // Unpin post 2 to restore clean state
      await request(app)
        .patch(`/api/v1/forum/posts/${testPost2Id}/pin`)
        .set('Authorization', `Bearer ${adminToken}`)
    })
  })

  describe('GET /api/v1/forum/posts/:id', () => {
    it('berhasil mendapat detail post beserta komentar', async () => {
      const res = await request(app)
        .get(`/api/v1/forum/posts/${testPostId}`)
        .set('Authorization', `Bearer ${siswaToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(testPostId)
      expect(res.body.data).toHaveProperty('komentar')
      expect(res.body.data).toHaveProperty('isLikedByUser')
      expect(res.body.data.isLikedByUser).toBe(false)
    })

    it('viewCount bertambah setiap kali diakses', async () => {
      const resBefore = await request(app)
        .get(`/api/v1/forum/posts/${testPostId}`)
        .set('Authorization', `Bearer ${siswaToken}`)
      const countBefore = resBefore.body.data.viewCount

      const resAfter = await request(app)
        .get(`/api/v1/forum/posts/${testPostId}`)
        .set('Authorization', `Bearer ${siswaToken}`)
      const countAfter = resAfter.body.data.viewCount

      expect(countAfter).toBe(countBefore + 1)
    })

    it('kembalikan 404 jika post tidak ditemukan', async () => {
      const res = await request(app)
        .get('/api/v1/forum/posts/a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .set('Authorization', `Bearer ${siswaToken}`)
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/v1/forum/posts/:id', () => {
    it('berhasil update post milik sendiri', async () => {
      const res = await request(app)
        .put(`/api/v1/forum/posts/${testPostId}`)
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ judul: 'Test Forum Post Satu Updated', konten: 'Konten post forum 1 yang sudah di-update sekarang' })
      
      expect(res.status).toBe(200)
      expect(res.body.data.judul).toBe('Test Forum Post Satu Updated')
    })

    it('gagal update post milik orang lain (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/forum/posts/${testPostId}`)
        .set('Authorization', `Bearer ${siswa2Token}`)
        .send({ judul: 'Hack Post Orang Lain' })
      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/v1/forum/posts/:id/like', () => {
    it('berhasil like post dan likeCount bertambah', async () => {
      const res = await request(app)
        .post(`/api/v1/forum/posts/${testPostId}/like`)
        .set('Authorization', `Bearer ${siswaToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body.data.liked).toBe(true)
      expect(res.body.data.likeCount).toBe(1)
    })

    it('berhasil unlike post dan likeCount berkurang', async () => {
      const res = await request(app)
        .post(`/api/v1/forum/posts/${testPostId}/like`)
        .set('Authorization', `Bearer ${siswaToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body.data.liked).toBe(false)
      expect(res.body.data.likeCount).toBe(0)
    })
  })

  describe('PATCH /api/v1/forum/posts/:id/pin', () => {
    it('admin berhasil toggle pin post', async () => {
      const res = await request(app)
        .patch(`/api/v1/forum/posts/${testPostId}/pin`)
        .set('Authorization', `Bearer ${adminToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body.data.isPinned).toBe(true)
    })

    it('gagal jika bukan admin (403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/forum/posts/${testPostId}/pin`)
        .set('Authorization', `Bearer ${siswaToken}`)
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /api/v1/forum/posts/:id/lock', () => {
    it('admin berhasil toggle lock post', async () => {
      const res = await request(app)
        .patch(`/api/v1/forum/posts/${testPostId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
      
      expect(res.status).toBe(200)
      expect(res.body.data.isLocked).toBe(true)
    })
  })

  // ===== KOMENTAR =====

  describe('POST /api/v1/forum/posts/:postId/komentar', () => {
    it('gagal komentar di post yang terkunci (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/forum/posts/${testPostId}/komentar`)
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ konten: 'Komentar di post locked' })
      expect(res.status).toBe(400)
      expect(res.body.message).toContain('dikunci')
    })

    it('berhasil membuat komentar baru setelah post diunlock', async () => {
      // Unlock post first
      await request(app)
        .patch(`/api/v1/forum/posts/${testPostId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)

      const res = await request(app)
        .post(`/api/v1/forum/posts/${testPostId}/komentar`)
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ konten: 'Ini komentar level satu' })
      
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.konten).toBe('Ini komentar level satu')
      testKomentarId = res.body.data.id
    })

    it('berhasil membuat reply ke komentar (level 2)', async () => {
      const res = await request(app)
        .post(`/api/v1/forum/posts/${testPostId}/komentar`)
        .set('Authorization', `Bearer ${siswa2Token}`)
        .send({ parentId: testKomentarId, konten: 'Ini reply ke komentar (level 2)' })
      
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.parentId).toBe(testKomentarId)
      testReplyId = res.body.data.id
    })

    it('gagal reply ke reply (level 3 tidak diizinkan)', async () => {
      const res = await request(app)
        .post(`/api/v1/forum/posts/${testPostId}/komentar`)
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ parentId: testReplyId, konten: 'Reply level tiga' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/forum/komentar/:id/like', () => {
    it('berhasil like komentar dan likeCount bertambah', async () => {
      const res = await request(app)
        .post(`/api/v1/forum/komentar/${testKomentarId}/like`)
        .set('Authorization', `Bearer ${siswa2Token}`)
      
      expect(res.status).toBe(200)
      expect(res.body.data.liked).toBe(true)
      expect(res.body.data.likeCount).toBe(1)
    })

    it('berhasil unlike komentar dan likeCount berkurang', async () => {
      const res = await request(app)
        .post(`/api/v1/forum/komentar/${testKomentarId}/like`)
        .set('Authorization', `Bearer ${siswa2Token}`)
      
      expect(res.status).toBe(200)
      expect(res.body.data.liked).toBe(false)
      expect(res.body.data.likeCount).toBe(0)
    })
  })

  describe('PUT /api/v1/forum/komentar/:id', () => {
    it('berhasil update komentar milik sendiri', async () => {
      const res = await request(app)
        .put(`/api/v1/forum/komentar/${testKomentarId}`)
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ konten: 'Komentar level satu terupdate' })
      
      expect(res.status).toBe(200)
      expect(res.body.data.konten).toBe('Komentar level satu terupdate')
    })

    it('gagal update komentar orang lain (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/forum/komentar/${testKomentarId}`)
        .set('Authorization', `Bearer ${siswa2Token}`)
        .send({ konten: 'Mencoba hack komentar' })
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/v1/forum/komentar/:id', () => {
    it('gagal hapus komentar milik orang lain (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/forum/komentar/${testKomentarId}`)
        .set('Authorization', `Bearer ${siswa2Token}`)
      expect(res.status).toBe(403)
    })

    it('siswa berhasil hapus komentar miliknya', async () => {
      const res = await request(app)
        .delete(`/api/v1/forum/komentar/${testReplyId}`)
        .set('Authorization', `Bearer ${siswa2Token}`)
      expect(res.status).toBe(200)
    })

    it('admin berhasil hapus komentar siapapun', async () => {
      const res = await request(app)
        .delete(`/api/v1/forum/komentar/${testKomentarId}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
    })
  })

  describe('DELETE /api/v1/forum/posts/:id', () => {
    it('gagal hapus post milik orang lain (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/forum/posts/${testPost2Id}`)
        .set('Authorization', `Bearer ${siswaToken}`)
      expect(res.status).toBe(403)
    })

    it('siswa berhasil hapus post miliknya', async () => {
      const res = await request(app)
        .delete(`/api/v1/forum/posts/${testPostId}`)
        .set('Authorization', `Bearer ${siswaToken}`)
      expect(res.status).toBe(200)
    })

    it('admin berhasil hapus post siapapun', async () => {
      const res = await request(app)
        .delete(`/api/v1/forum/posts/${testPost2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
    })
  })

  // ===== KATEGORI MUTASI LAINNYA =====

  describe('PUT /api/v1/forum/kategori/:id', () => {
    it('admin berhasil update kategori', async () => {
      const res = await request(app)
        .put(`/api/v1/forum/kategori/${testKategoriId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama: 'Test Kategori Satu Terubah', deskripsi: 'Deskripsi update' })
      
      expect(res.status).toBe(200)
      expect(res.body.data.nama).toBe('Test Kategori Satu Terubah')
      expect(res.body.data.slug).toBe('test-kategori-satu-terubah')
    })

    it('kembalikan 404 jika kategori tidak ditemukan', async () => {
      const res = await request(app)
        .put('/api/v1/forum/kategori/a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama: 'Random Name' })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/forum/kategori/:id', () => {
    it('gagal hapus kategori yang masih punya post (400)', async () => {
      // Create a temporary post inside testKategori2Id
      const postRes = await request(app)
        .post('/api/v1/forum/posts')
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ kategoriId: testKategori2Id, judul: 'Test Post Temp', konten: 'Panjang konten post temp' })
      expect(postRes.status).toBe(201)
      const tempPostId = postRes.body.data.id

      // Attempt to delete the category
      const res = await request(app)
        .delete(`/api/v1/forum/kategori/${testKategori2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(400)

      // Clean up the post
      await request(app)
        .delete(`/api/v1/forum/posts/${tempPostId}`)
        .set('Authorization', `Bearer ${adminToken}`)
    })

    it('admin berhasil hapus kategori kosong', async () => {
      const res = await request(app)
        .delete(`/api/v1/forum/kategori/${testKategori2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
    })
  })
})
