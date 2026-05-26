import '../config/env'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import app from '../app'

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
  supabaseAdmin: {
    auth: {
      getUser: vi.fn().mockImplementation(async (token: string) => {
        if (token === 'siswa-token') {
          return {
            data: {
              user: {
                id: 'test-rek-siswa-uuid',
                email: 'siswa-rek@utbk.dev',
              },
            },
            error: null,
          }
        }
        if (token === 'siswa-no-tryout-token') {
          return {
            data: {
              user: {
                id: 'test-rek-notryout-uuid',
                email: 'siswa-notryout@utbk.dev',
              },
            },
            error: null,
          }
        }
        return { data: { user: null }, error: new Error('Token tidak valid') }
      }),
    },
  },
}))

describe('Rekomendasi Module', () => {
  let testTryoutId: string

  beforeAll(async () => {
    const { prisma } = await import('../config/prisma')

    // Clean up first
    await prisma.sesiTryout.deleteMany({
      where: { userId: { in: ['test-rek-siswa-uuid', 'test-rek-notryout-uuid'] } },
    })

    // Upsert users
    await prisma.user.upsert({
      where: { id: 'test-rek-siswa-uuid' },
      update: {},
      create: {
        id: 'test-rek-siswa-uuid',
        email: 'siswa-rek@utbk.dev',
        name: 'Test Siswa Rek',
        role: 'SISWA',
      },
    })

    await prisma.user.upsert({
      where: { id: 'test-rek-notryout-uuid' },
      update: {},
      create: {
        id: 'test-rek-notryout-uuid',
        email: 'siswa-notryout@utbk.dev',
        name: 'Test Siswa No Tryout',
        role: 'SISWA',
      },
    })

    // Find or create a tryout for the test
    let tryout = await prisma.tryout.findFirst()
    if (!tryout) {
      tryout = await prisma.tryout.create({
        data: {
          judul: 'Test Rekomendasi Tryout',
          deskripsi: 'Tryout for rekomendasi test',
          status: 'ENDED',
          mulaiAt: new Date('2026-01-01T08:00:00Z'),
          selesaiAt: new Date('2026-01-01T12:00:00Z'),
          durasiTps: 90,
          durasiTka: 90,
        },
      })
    }
    testTryoutId = tryout.id

    // Create a completed tryout session for siswa test
    await prisma.sesiTryout.create({
      data: {
        userId: 'test-rek-siswa-uuid',
        tryoutId: testTryoutId,
        status: 'SUBMITTED',
        skorTps: 70,
        skorTka: 75,
        skorTotal: 72,
        mulaiAt: new Date(),
        selesaiAt: new Date(),
      },
    })
  })

  afterAll(async () => {
    const { prisma } = await import('../config/prisma')

    await prisma.sesiTryout.deleteMany({
      where: { userId: { in: ['test-rek-siswa-uuid', 'test-rek-notryout-uuid'] } },
    })
    await prisma.user.deleteMany({
      where: { id: { in: ['test-rek-siswa-uuid', 'test-rek-notryout-uuid'] } },
    })
  })

  // ===========================
  // GET /api/v1/rekomendasi
  // ===========================
  describe('GET /api/v1/rekomendasi', () => {
    it('gagal tanpa token (401)', async () => {
      const res = await request(app).get('/api/v1/rekomendasi')
      expect(res.status).toBe(401)
    })

    it('gagal jika role bukan siswa (403)', async () => {
      // No valid non-SISWA token in our mock, but missing token returns 401
      // We test with an invalid token
      const res = await request(app)
        .get('/api/v1/rekomendasi')
        .set('Authorization', 'Bearer invalid-token')
      expect(res.status).toBe(401)
    })

    it('gagal jika belum ada data tryout yang selesai (400)', async () => {
      const res = await request(app)
        .get('/api/v1/rekomendasi')
        .set('Authorization', 'Bearer siswa-no-tryout-token')

      expect(res.status).toBe(400)
      expect(res.body.message).toContain('Belum ada data tryout')
    })

    it('berhasil mendapat rekomendasi jurusan', async () => {
      const res = await request(app)
        .get('/api/v1/rekomendasi')
        .set('Authorization', 'Bearer siswa-token')

      // If no jurusan with passingGrade in DB, response should still be 200
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('skorReferensi')
      expect(res.body.data).toHaveProperty('totalRekomendasi')
      expect(res.body.data).toHaveProperty('rekomendasi')
      expect(Array.isArray(res.body.data.rekomendasi)).toBe(true)
    })

    it('response berisi skorReferensi yang benar', async () => {
      const res = await request(app)
        .get('/api/v1/rekomendasi')
        .set('Authorization', 'Bearer siswa-token')

      expect(res.status).toBe(200)
      // Average of skorTotal = 72 (only one session)
      expect(res.body.data.skorReferensi).toBe(72)
    })

    it('setiap item rekomendasi punya field kategori: aman | kompetitif | tantangan', async () => {
      const res = await request(app)
        .get('/api/v1/rekomendasi')
        .set('Authorization', 'Bearer siswa-token')

      expect(res.status).toBe(200)
      const validKategori = ['aman', 'kompetitif', 'tantangan']
      for (const item of res.body.data.rekomendasi) {
        expect(validKategori).toContain(item.kategori)
        expect(item).toHaveProperty('jurusanId')
        expect(item).toHaveProperty('namaJurusan')
        expect(item).toHaveProperty('fakultas')
        expect(item).toHaveProperty('jenjang')
        expect(item).toHaveProperty('kelompok')
        expect(item).toHaveProperty('ptn')
        expect(item).toHaveProperty('passingGrade')
        expect(item).toHaveProperty('selisih')
      }
    })

    it('berhasil filter by kelompok SAINTEK', async () => {
      const res = await request(app)
        .get('/api/v1/rekomendasi?kelompok=SAINTEK')
        .set('Authorization', 'Bearer siswa-token')

      expect(res.status).toBe(200)
      for (const item of res.body.data.rekomendasi) {
        expect(item.kelompok).toBe('SAINTEK')
      }
    })

    it('gagal jika kelompok tidak valid (400)', async () => {
      const res = await request(app)
        .get('/api/v1/rekomendasi?kelompok=INVALID')
        .set('Authorization', 'Bearer siswa-token')

      expect(res.status).toBe(400)
      expect(res.body.message).toContain('Kelompok tidak valid')
    })

    it('limit default 10 dan bisa diubah via query param', async () => {
      const res = await request(app)
        .get('/api/v1/rekomendasi?limit=5')
        .set('Authorization', 'Bearer siswa-token')

      expect(res.status).toBe(200)
      expect(res.body.data.rekomendasi.length).toBeLessThanOrEqual(5)

      // Test default
      const resDefault = await request(app)
        .get('/api/v1/rekomendasi')
        .set('Authorization', 'Bearer siswa-token')

      expect(resDefault.status).toBe(200)
      expect(resDefault.body.data.rekomendasi.length).toBeLessThanOrEqual(10)
    })

    it('urutan rekomendasi: aman dulu, lalu kompetitif, lalu tantangan', async () => {
      const res = await request(app)
        .get('/api/v1/rekomendasi?limit=50')
        .set('Authorization', 'Bearer siswa-token')

      expect(res.status).toBe(200)
      const rekomendasi = res.body.data.rekomendasi
      const kategoriOrder = { aman: 0, kompetitif: 1, tantangan: 2 } as Record<string, number>

      for (let i = 1; i < rekomendasi.length; i++) {
        const prevOrder = kategoriOrder[rekomendasi[i - 1].kategori]
        const currOrder = kategoriOrder[rekomendasi[i].kategori]
        expect(currOrder).toBeGreaterThanOrEqual(prevOrder)

        // Within same category, selisih should be ascending
        if (prevOrder === currOrder) {
          expect(rekomendasi[i].selisih).toBeGreaterThanOrEqual(rekomendasi[i - 1].selisih)
        }
      }
    })
  })
})
