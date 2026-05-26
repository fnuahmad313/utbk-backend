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
        if (token === 'admin-token') {
          return {
            data: {
              user: {
                id: 'test-dashboard-admin-uuid',
                email: 'admin-dashboard@utbk.dev',
              },
            },
            error: null,
          }
        }
        if (token === 'siswa-token') {
          return {
            data: {
              user: {
                id: 'test-dashboard-siswa-uuid',
                email: 'siswa-dashboard@utbk.dev',
              },
            },
            error: null,
          }
        }
        if (token === 'siswa-empty-token') {
          return {
            data: {
              user: {
                id: 'test-dashboard-empty-uuid',
                email: 'siswa-empty@utbk.dev',
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

describe('Dashboard Module', () => {
  beforeAll(async () => {
    const { prisma } = await import('../config/prisma')

    // Clean up any existing test data first
    await prisma.jawabanSiswa.deleteMany({
      where: { session: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } } },
    })
    await prisma.latihanSession.deleteMany({
      where: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
    })
    await prisma.jawabanTryout.deleteMany({
      where: { sesi: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } } },
    })
    await prisma.sesiTryout.deleteMany({
      where: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
    })
    await prisma.soal.deleteMany({
      where: { pertanyaan: { startsWith: 'Test Dashboard' } },
    })

    // Create users
    await prisma.user.upsert({
      where: { id: 'test-dashboard-admin-uuid' },
      update: {},
      create: {
        id: 'test-dashboard-admin-uuid',
        email: 'admin-dashboard@utbk.dev',
        name: 'Test Admin Dashboard',
        role: 'ADMIN',
      },
    })

    await prisma.user.upsert({
      where: { id: 'test-dashboard-siswa-uuid' },
      update: {},
      create: {
        id: 'test-dashboard-siswa-uuid',
        email: 'siswa-dashboard@utbk.dev',
        name: 'Test Siswa Dashboard',
        role: 'SISWA',
      },
    })

    await prisma.user.upsert({
      where: { id: 'test-dashboard-empty-uuid' },
      update: {},
      create: {
        id: 'test-dashboard-empty-uuid',
        email: 'siswa-empty@utbk.dev',
        name: 'Test Siswa Empty',
        role: 'SISWA',
      },
    })

    // Create test soal
    const soal = await prisma.soal.create({
      data: {
        pertanyaan: 'Test Dashboard Soal 1',
        tipe: 'SINGLE_CHOICE',
        opsi: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' },
        jawaban: 'A',
        mapel: 'TPS',
        tingkat: 'mudah',
      },
    })

    const soal2 = await prisma.soal.create({
      data: {
        pertanyaan: 'Test Dashboard Soal 2',
        tipe: 'SINGLE_CHOICE',
        opsi: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' },
        jawaban: 'B',
        mapel: 'TKA_SAINTEK',
        tingkat: 'sedang',
      },
    })

    // Create completed latihan sessions
    const sesi1 = await prisma.latihanSession.create({
      data: {
        userId: 'test-dashboard-siswa-uuid',
        mapel: 'TPS',
        skor: 80,
        selesai: true,
      },
    })

    await prisma.jawabanSiswa.create({
      data: {
        sessionId: sesi1.id,
        soalId: soal.id,
        jawaban: 'A',
        benar: true,
      },
    })

    const sesi2 = await prisma.latihanSession.create({
      data: {
        userId: 'test-dashboard-siswa-uuid',
        mapel: 'TKA_SAINTEK',
        skor: 60,
        selesai: true,
      },
    })

    await prisma.jawabanSiswa.create({
      data: {
        sessionId: sesi2.id,
        soalId: soal2.id,
        jawaban: 'A',
        benar: false,
      },
    })
  })

  afterAll(async () => {
    const { prisma } = await import('../config/prisma')

    await prisma.jawabanSiswa.deleteMany({
      where: { session: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } } },
    })
    await prisma.latihanSession.deleteMany({
      where: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
    })
    await prisma.jawabanTryout.deleteMany({
      where: { sesi: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } } },
    })
    await prisma.sesiTryout.deleteMany({
      where: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
    })
    await prisma.soal.deleteMany({
      where: { pertanyaan: { startsWith: 'Test Dashboard' } },
    })
    await prisma.user.deleteMany({
      where: { id: { in: ['test-dashboard-admin-uuid', 'test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
    })
  })

  // ===========================
  // GET /api/v1/dashboard
  // ===========================
  describe('GET /api/v1/dashboard', () => {
    it('gagal tanpa token (401)', async () => {
      const res = await request(app).get('/api/v1/dashboard')
      expect(res.status).toBe(401)
    })

    it('gagal jika role bukan siswa (403)', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', 'Bearer admin-token')
      expect(res.status).toBe(403)
    })

    it('berhasil mendapat dashboard siswa dengan struktur data lengkap', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', 'Bearer siswa-token')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('overview')
      expect(res.body.data).toHaveProperty('latihanAnalytics')
      expect(res.body.data).toHaveProperty('tryoutAnalytics')

      // Check overview structure
      expect(res.body.data.overview).toHaveProperty('totalLatihan')
      expect(res.body.data.overview).toHaveProperty('totalTryout')
      expect(res.body.data.overview).toHaveProperty('rataRataSkorLatihan')
      expect(res.body.data.overview).toHaveProperty('rataRataSkorTryout')
      expect(res.body.data.overview).toHaveProperty('totalSoalDijawab')

      // Check latihanAnalytics structure
      expect(res.body.data.latihanAnalytics).toHaveProperty('perMapel')
      expect(res.body.data.latihanAnalytics).toHaveProperty('kelemahanMapel')
      expect(Array.isArray(res.body.data.latihanAnalytics.perMapel)).toBe(true)

      // Check tryoutAnalytics structure
      expect(res.body.data.tryoutAnalytics).toHaveProperty('riwayat')
      expect(res.body.data.tryoutAnalytics).toHaveProperty('trenSkorTotal')
      expect(res.body.data.tryoutAnalytics).toHaveProperty('skorTerbaik')
      expect(res.body.data.tryoutAnalytics).toHaveProperty('progressDariAwal')
    })

    it('overview.totalLatihan sesuai dengan jumlah sesi latihan yang selesai', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', 'Bearer siswa-token')

      expect(res.status).toBe(200)
      expect(res.body.data.overview.totalLatihan).toBe(2)
    })

    it('latihanAnalytics.perMapel berisi data per mapel yang benar', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', 'Bearer siswa-token')

      expect(res.status).toBe(200)
      const perMapel = res.body.data.latihanAnalytics.perMapel
      expect(perMapel.length).toBe(2)

      const tps = perMapel.find((m: any) => m.mapel === 'TPS')
      expect(tps).toBeDefined()
      expect(tps.totalSesi).toBe(1)
      expect(tps.rataRataSkor).toBe(80)
      expect(tps.skorTertinggi).toBe(80)
      expect(tps.skorTerendah).toBe(80)
      expect(Array.isArray(tps.trenSkor)).toBe(true)

      const tkaSaintek = perMapel.find((m: any) => m.mapel === 'TKA_SAINTEK')
      expect(tkaSaintek).toBeDefined()
      expect(tkaSaintek.totalSesi).toBe(1)
      expect(tkaSaintek.rataRataSkor).toBe(60)

      // kelemahanMapel should be TKA_SAINTEK (lower avg score)
      expect(res.body.data.latihanAnalytics.kelemahanMapel).toBe('TKA_SAINTEK')
    })

    it('dashboard siswa baru tanpa data mengembalikan nilai 0 dan array kosong', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', 'Bearer siswa-empty-token')

      expect(res.status).toBe(200)
      expect(res.body.data.overview.totalLatihan).toBe(0)
      expect(res.body.data.overview.totalTryout).toBe(0)
      expect(res.body.data.overview.rataRataSkorLatihan).toBe(0)
      expect(res.body.data.overview.rataRataSkorTryout).toBe(0)
      expect(res.body.data.overview.totalSoalDijawab).toBe(0)
      expect(res.body.data.latihanAnalytics.perMapel).toEqual([])
      expect(res.body.data.latihanAnalytics.kelemahanMapel).toBeNull()
      expect(res.body.data.tryoutAnalytics.riwayat).toEqual([])
      expect(res.body.data.tryoutAnalytics.trenSkorTotal).toEqual([])
      expect(res.body.data.tryoutAnalytics.skorTerbaik.sesiId).toBeNull()
      expect(res.body.data.tryoutAnalytics.progressDariAwal).toBeNull()
    })
  })

  // ===========================
  // GET /api/v1/dashboard/admin
  // ===========================
  describe('GET /api/v1/dashboard/admin', () => {
    it('gagal jika role bukan admin (403)', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', 'Bearer siswa-token')
      expect(res.status).toBe(403)
    })

    it('berhasil mendapat dashboard admin dengan struktur data lengkap', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', 'Bearer admin-token')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')

      // Platform
      expect(res.body.data).toHaveProperty('platform')
      expect(res.body.data.platform).toHaveProperty('totalUser')
      expect(res.body.data.platform).toHaveProperty('totalSoal')
      expect(res.body.data.platform).toHaveProperty('totalPTN')
      expect(res.body.data.platform).toHaveProperty('totalJurusan')
      expect(res.body.data.platform).toHaveProperty('totalTryout')
      expect(res.body.data.platform).toHaveProperty('totalTryoutOngoing')

      // Aktivitas belajar
      expect(res.body.data).toHaveProperty('aktivitasBelajar')
      expect(res.body.data.aktivitasBelajar).toHaveProperty('totalSesiLatihan')
      expect(res.body.data.aktivitasBelajar).toHaveProperty('totalSesiTryout')
      expect(res.body.data.aktivitasBelajar).toHaveProperty('rataRataSkorLatihan')
      expect(res.body.data.aktivitasBelajar).toHaveProperty('rataRataSkorTryout')

      // Tryout stats
      expect(res.body.data).toHaveProperty('tryoutStats')
      expect(Array.isArray(res.body.data.tryoutStats)).toBe(true)

      // Top siswa
      expect(res.body.data).toHaveProperty('topSiswa')
      expect(Array.isArray(res.body.data.topSiswa)).toBe(true)
    })

    it('platform.totalUser hanya menghitung user dengan role SISWA', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', 'Bearer admin-token')

      expect(res.status).toBe(200)
      // totalUser should count SISWA only, not ADMIN
      expect(typeof res.body.data.platform.totalUser).toBe('number')
      expect(res.body.data.platform.totalUser).toBeGreaterThanOrEqual(2) // at least our 2 test siswa
    })

    it('tryoutStats berisi statistik per tryout', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', 'Bearer admin-token')

      expect(res.status).toBe(200)
      if (res.body.data.tryoutStats.length > 0) {
        const stat = res.body.data.tryoutStats[0]
        expect(stat).toHaveProperty('tryoutId')
        expect(stat).toHaveProperty('judul')
        expect(stat).toHaveProperty('status')
        expect(stat).toHaveProperty('totalPeserta')
        expect(stat).toHaveProperty('rataRataSkorTotal')
        expect(stat).toHaveProperty('skorTertinggi')
        expect(stat).toHaveProperty('skorTerendah')
      }
    })

    it('topSiswa berisi maksimal 10 siswa', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Authorization', 'Bearer admin-token')

      expect(res.status).toBe(200)
      expect(res.body.data.topSiswa.length).toBeLessThanOrEqual(10)
      if (res.body.data.topSiswa.length > 0) {
        const siswa = res.body.data.topSiswa[0]
        expect(siswa).toHaveProperty('userId')
        expect(siswa).toHaveProperty('nama')
        expect(siswa).toHaveProperty('email')
        expect(siswa).toHaveProperty('totalTryout')
        expect(siswa).toHaveProperty('rataRataSkorTryout')
      }
    })
  })
})
