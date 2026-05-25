import '../config/env';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock Supabase — tidak butuh koneksi internet atau akun real
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
        if (token === 'valid-token-user1') {
          return {
            data: {
              user: {
                id: 'test-latihan-user1-uuid',
                email: 'latihan1@utbk.dev',
              },
            },
            error: null,
          };
        }
        if (token === 'valid-token-user2') {
          return {
            data: {
              user: {
                id: 'test-latihan-user2-uuid',
                email: 'latihan2@utbk.dev',
              },
            },
            error: null,
          };
        }
        return { data: { user: null }, error: new Error('Token tidak valid') };
      }),
    },
  },
}));

describe('Latihan Module', () => {
  const tokenUser1 = 'valid-token-user1';
  const tokenUser2 = 'valid-token-user2';
  let createdSoalIds: string[] = [];
  let user1SessionId: string;

  // Setup: buat soal test langsung via Prisma (tidak butuh Supabase Auth)
  beforeAll(async () => {
    const { prisma } = await import('../config/prisma');
    await prisma.user.upsert({
      where: { id: 'test-latihan-user1-uuid' },
      update: {},
      create: {
        id: 'test-latihan-user1-uuid',
        email: 'latihan1@utbk.dev',
        name: 'Test Siswa 1',
        role: 'SISWA',
      },
    });

    await prisma.user.upsert({
      where: { id: 'test-latihan-user2-uuid' },
      update: {},
      create: {
        id: 'test-latihan-user2-uuid',
        email: 'latihan2@utbk.dev',
        name: 'Test Siswa 2',
        role: 'SISWA',
      },
    });
    await prisma.jawabanSiswa.deleteMany({
      where: {
        session: {
          userId: {
            in: ['test-latihan-user1-uuid', 'test-latihan-user2-uuid'],
          },
        },
      },
    });
    await prisma.latihanSession.deleteMany({
      where: {
        userId: { in: ['test-latihan-user1-uuid', 'test-latihan-user2-uuid'] },
      },
    });
    await prisma.soal.deleteMany({
      where: { pertanyaan: { startsWith: 'Test Latihan Pertanyaan' } },
    });

    // Buat soal test
    const soal1 = await prisma.soal.create({
      data: {
        pertanyaan: 'Test Latihan Pertanyaan 1?',
        opsi: { A: 'Satu', B: 'Dua', C: 'Tiga', D: 'Empat', E: 'Lima' },
        jawaban: 'A',
        pembahasan: 'Pembahasan Soal 1',
        mapel: 'TPS',
        tingkat: 'mudah',
      },
    });

    const soal2 = await prisma.soal.create({
      data: {
        pertanyaan: 'Test Latihan Pertanyaan 2?',
        opsi: { A: 'Satu', B: 'Dua', C: 'Tiga', D: 'Empat', E: 'Lima' },
        jawaban: 'C',
        pembahasan: 'Pembahasan Soal 2',
        mapel: 'TPS',
        tingkat: 'sedang',
      },
    });

    const soal3 = await prisma.soal.create({
      data: {
        pertanyaan: 'Test Latihan Pertanyaan 3?',
        opsi: { A: 'Satu', B: 'Dua', C: 'Tiga', D: 'Empat', E: 'Lima' },
        jawaban: 'E',
        pembahasan: 'Pembahasan Soal 3',
        mapel: 'TKA_SAINTEK',
        tingkat: 'sulit',
      },
    });

    createdSoalIds = [soal1.id, soal2.id, soal3.id];
  });

  afterAll(async () => {
    const { prisma } = await import('../config/prisma');

    await prisma.jawabanSiswa.deleteMany({
      where: {
        session: {
          userId: {
            in: ['test-latihan-user1-uuid', 'test-latihan-user2-uuid'],
          },
        },
      },
    });

    await prisma.latihanSession.deleteMany({
      where: {
        userId: { in: ['test-latihan-user1-uuid', 'test-latihan-user2-uuid'] },
      },
    });

    await prisma.soal.deleteMany({
      where: { pertanyaan: { startsWith: 'Test Latihan Pertanyaan' } },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: ['test-latihan-user1-uuid', 'test-latihan-user2-uuid'] },
      },
    });
  });

  // ===========================
  // POST /api/v1/latihan/mulai
  // ===========================
  describe('POST /api/v1/latihan/mulai', () => {
    it('gagal mulai latihan jika jumlah di luar 1-40', async () => {
      const res1 = await request(app)
        .post('/api/v1/latihan/mulai')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ mapel: 'TPS', jumlah: 0 });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/v1/latihan/mulai')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ mapel: 'TPS', jumlah: 41 });
      expect(res2.status).toBe(400);
    });

    it('gagal mulai latihan jika mapel tidak valid', async () => {
      const res = await request(app)
        .post('/api/v1/latihan/mulai')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ mapel: 'IPS', jumlah: 5 });
      expect(res.status).toBe(400);
    });

    it('berhasil mulai latihan TPS, mengembalikan soal acak (jumlah <= DB size)', async () => {
      const res = await request(app)
        .post('/api/v1/latihan/mulai')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ mapel: 'TPS', jumlah: 10 }); // DB hanya punya 2 soal TPS, return 2

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.mapel).toBe('TPS');
      expect(res.body.data.selesai).toBe(false);
      expect(Array.isArray(res.body.data.soal)).toBe(true);
      expect(res.body.data.soal.length).toBeGreaterThanOrEqual(1);
      res.body.data.soal.forEach((s: any) => {
        expect(s).not.toHaveProperty('jawaban');
        expect(s).toHaveProperty('pertanyaan');
      });

      user1SessionId = res.body.data.id;
    });
  });

  // ===========================
  // POST /api/v1/latihan/:sessionId/submit
  // ===========================
  describe('POST /api/v1/latihan/:sessionId/submit', () => {
    it('gagal submit jika session ID tidak valid / tidak ada', async () => {
      const res = await request(app)
        .post('/api/v1/latihan/00000000-0000-0000-0000-000000000000/submit')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ jawabans: [{ soalId: createdSoalIds[0], jawaban: 'A' }] });
      expect(res.status).toBe(404);
    });

    it('gagal submit jika mengakses session milik user lain (403)', async () => {
      const res = await request(app)
        .post(`/api/v1/latihan/${user1SessionId}/submit`)
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({ jawabans: [{ soalId: createdSoalIds[0], jawaban: 'A' }] });
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('message');
    });

    it('berhasil submit jawaban dengan data valid dan hitung skor dengan benar', async () => {
      const res = await request(app)
        .post(`/api/v1/latihan/${user1SessionId}/submit`)
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          jawabans: [
            { soalId: createdSoalIds[0], jawaban: 'A' },
            { soalId: createdSoalIds[1], jawaban: 'A' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.skor).toBe(50);
      expect(res.body.data.jumlahBenar).toBe(1);
      expect(res.body.data.jumlahSalah).toBe(1);
      expect(res.body.data.totalSoal).toBe(2);
    });

    it('gagal submit jika session sudah diselesaikan sebelumnya (selesai: true)', async () => {
      const res = await request(app)
        .post(`/api/v1/latihan/${user1SessionId}/submit`)
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ jawabans: [{ soalId: createdSoalIds[0], jawaban: 'A' }] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('selesai');
    });
  });

  // ===========================
  // GET /api/v1/latihan/riwayat
  // ===========================
  describe('GET /api/v1/latihan/riwayat', () => {
    it('berhasil mengambil daftar riwayat sesi user', async () => {
      const res = await request(app)
        .get('/api/v1/latihan/riwayat')
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(user1SessionId);
      expect(res.body.data[0].skor).toBe(50);
      expect(res.body.data[0].selesai).toBe(true);
    });
  });

  // ===========================
  // GET /api/v1/latihan/:sessionId
  // ===========================
  describe('GET /api/v1/latihan/:sessionId', () => {
    it('gagal mengakses detail session milik user lain (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/latihan/${user1SessionId}`)
        .set('Authorization', `Bearer ${tokenUser2}`);
      expect(res.status).toBe(403);
    });

    it('berhasil mengambil detail session lengkap (jawaban, status benar/salah, kunci jawaban, dan pembahasan)', async () => {
      const res = await request(app)
        .get(`/api/v1/latihan/${user1SessionId}`)
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(user1SessionId);
      expect(res.body.data.skor).toBe(50);
      expect(res.body.data.selesai).toBe(true);
      expect(Array.isArray(res.body.data.jawabans)).toBe(true);
      expect(res.body.data.jawabans.length).toBe(2);

      const j1 = res.body.data.jawabans.find(
        (j: any) => j.soalId === createdSoalIds[0]
      );
      expect(j1.jawabanUser).toBe('A');
      expect(j1.kunciJawaban).toBe('A');
      expect(j1.benar).toBe(true);
      expect(j1.soal.pembahasan).toBe('Pembahasan Soal 1');

      const j2 = res.body.data.jawabans.find(
        (j: any) => j.soalId === createdSoalIds[1]
      );
      expect(j2.jawabanUser).toBe('A');
      expect(j2.kunciJawaban).toBe('C');
      expect(j2.benar).toBe(false);
      expect(j2.soal.pembahasan).toBe('Pembahasan Soal 2');
    });
  });
});
