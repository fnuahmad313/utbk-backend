import '../config/env';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import app from '../app';

let soalTpsId: string;
let soalTkaId: string;
let testTryoutId: string;
let testSesiId: string;

const adminToken = 'admin-token';
const siswaToken = 'siswa-token';

vi.mock('../config/supabase', () => ({
  supabase: { auth: { signUp: vi.fn(), signInWithPassword: vi.fn() } },
  supabaseAdmin: {
    auth: {
      getUser: vi.fn().mockImplementation(async (token: string) => {
        if (token === 'admin-token') {
          return {
            data: {
              user: { id: 'test-tryout-admin-uuid', email: 'admin@utbk.dev' },
            },
            error: null,
          };
        }
        if (token === 'siswa-token') {
          return {
            data: {
              user: { id: 'test-tryout-siswa-uuid', email: 'siswa@utbk.dev' },
            },
            error: null,
          };
        }
        return { data: { user: null }, error: new Error('Token tidak valid') };
      }),
    },
  },
}));

beforeAll(async () => {
  const { prisma } = await import('../config/prisma');

  // Pre-cleanup to ensure fresh start
  await prisma.jawabanTryout.deleteMany({
    where: { sesi: { userId: { in: ['test-tryout-siswa-uuid'] } } },
  });
  await prisma.sesiTryout.deleteMany({
    where: { userId: 'test-tryout-siswa-uuid' },
  });
  await prisma.subtesSoal.deleteMany({
    where: { soal: { pertanyaan: { startsWith: 'Test Tryout' } } },
  });
  await prisma.subtesTryout.deleteMany({
    where: { tryout: { judul: { startsWith: 'Test Tryout' } } },
  });
  await prisma.tryout.deleteMany({
    where: { judul: { startsWith: 'Test Tryout' } },
  });
  await prisma.soal.deleteMany({
    where: { pertanyaan: { startsWith: 'Test Tryout' } },
  });

  await prisma.user.upsert({
    where: { id: 'test-tryout-admin-uuid' },
    update: {},
    create: {
      id: 'test-tryout-admin-uuid',
      email: 'admin-tryout@utbk.dev',
      name: 'Test Admin',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { id: 'test-tryout-siswa-uuid' },
    update: {},
    create: {
      id: 'test-tryout-siswa-uuid',
      email: 'siswa-tryout@utbk.dev',
      name: 'Test Siswa',
      role: 'SISWA',
    },
  });

  // Buat soal test untuk TPS dan TKA
  const soalTps = await prisma.soal.create({
    data: {
      pertanyaan: 'Test Tryout Soal TPS 1',
      tipe: 'SINGLE_CHOICE',
      opsi: { A: 'Satu', B: 'Dua', C: 'Tiga', D: 'Empat', E: 'Lima' },
      jawaban: 'A',
      pembahasan: 'Pembahasan TPS 1',
      mapel: 'TPS',
      tingkat: 'mudah',
    },
  });

  const soalTka = await prisma.soal.create({
    data: {
      pertanyaan: 'Test Tryout Soal TKA 1',
      tipe: 'SINGLE_CHOICE',
      opsi: { A: 'Satu', B: 'Dua', C: 'Tiga', D: 'Empat', E: 'Lima' },
      jawaban: 'B',
      pembahasan: 'Pembahasan TKA 1',
      mapel: 'TKA_SAINTEK',
      tingkat: 'mudah',
    },
  });

  soalTpsId = soalTps.id;
  soalTkaId = soalTka.id;
});

afterAll(async () => {
  const { prisma } = await import('../config/prisma');

  // Urutan hapus wajib diikuti karena foreign key
  await prisma.jawabanTryout.deleteMany({
    where: { sesi: { userId: { in: ['test-tryout-siswa-uuid'] } } },
  });
  await prisma.sesiTryout.deleteMany({
    where: { userId: 'test-tryout-siswa-uuid' },
  });
  await prisma.subtesSoal.deleteMany({
    where: { soal: { pertanyaan: { startsWith: 'Test Tryout' } } },
  });
  await prisma.subtesTryout.deleteMany({
    where: { tryout: { judul: { startsWith: 'Test Tryout' } } },
  });
  await prisma.tryout.deleteMany({
    where: { judul: { startsWith: 'Test Tryout' } },
  });
  await prisma.soal.deleteMany({
    where: { pertanyaan: { startsWith: 'Test Tryout' } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: ['test-tryout-admin-uuid', 'test-tryout-siswa-uuid'] } },
  });
});

describe('POST /api/v1/tryout', () => {
  it('gagal jika bukan admin (403)', async () => {
    const res = await supertest(app)
      .post('/api/v1/tryout')
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({
        judul: 'Test Tryout 1',
        deskripsi: 'Deskripsi',
        mulaiAt: '2026-06-01T08:00:00.000Z',
        selesaiAt: '2026-06-01T14:00:00.000Z',
        durasiTps: 150,
        durasiTka: 90,
      });
    expect(res.status).toBe(403);
  });

  it('gagal jika body tidak valid (400)', async () => {
    const res = await supertest(app)
      .post('/api/v1/tryout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        judul: '',
        mulaiAt: '2026-06-01T08:00:00.000Z',
        selesaiAt: '2026-06-01T14:00:00.000Z',
        durasiTps: 150,
        durasiTka: 0,
      });
    expect(res.status).toBe(400);
  });

  it('gagal jika selesaiAt sebelum mulaiAt (400)', async () => {
    const res = await supertest(app)
      .post('/api/v1/tryout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        judul: 'Test Tryout 1',
        mulaiAt: '2026-06-01T14:00:00.000Z',
        selesaiAt: '2026-06-01T08:00:00.000Z',
        durasiTps: 150,
        durasiTka: 90,
      });
    expect(res.status).toBe(400);
  });

  it('berhasil membuat tryout baru (201)', async () => {
    const res = await supertest(app)
      .post('/api/v1/tryout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        judul: 'Test Tryout Utama',
        deskripsi: 'Tryout Utama Deskripsi',
        mulaiAt: '2026-06-01T08:00:00.000Z',
        selesaiAt: '2026-06-01T14:00:00.000Z',
        durasiTps: 150,
        durasiTka: 90,
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.judul).toBe('Test Tryout Utama');
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.subtes.length).toBe(2);

    testTryoutId = res.body.data.id;
  });
});

describe('POST /api/v1/tryout/:id/subtes', () => {
  it('berhasil menambahkan soal ke subtes TPS', async () => {
    const res = await supertest(app)
      .post(`/api/v1/tryout/${testTryoutId}/subtes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        mapel: 'TPS',
        soalIds: [soalTpsId],
      });
    expect(res.status).toBe(200);
  });

  it('berhasil menambahkan soal ke subtes TKA', async () => {
    const res = await supertest(app)
      .post(`/api/v1/tryout/${testTryoutId}/subtes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        mapel: 'TKA_SAINTEK',
        soalIds: [soalTkaId],
      });
    expect(res.status).toBe(200);
  });

  it('gagal jika mapel tidak valid (400)', async () => {
    const res = await supertest(app)
      .post(`/api/v1/tryout/${testTryoutId}/subtes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        mapel: 'TKA_CAMPURAN',
        soalIds: [soalTkaId],
      });
    expect(res.status).toBe(400);
  });

  it('gagal jika soalIds kosong (400)', async () => {
    const res = await supertest(app)
      .post(`/api/v1/tryout/${testTryoutId}/subtes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        mapel: 'TPS',
        soalIds: [],
      });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/tryout/:id/status', () => {
  it('gagal publish jika subtes belum punya soal (400)', async () => {
    // Buat tryout baru tanpa soal
    const newTryoutRes = await supertest(app)
      .post('/api/v1/tryout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        judul: 'Test Tryout Kosong',
        mulaiAt: '2026-06-01T08:00:00.000Z',
        selesaiAt: '2026-06-01T14:00:00.000Z',
        durasiTps: 150,
        durasiTka: 90,
      });
    const emptyId = newTryoutRes.body.data.id;

    const res = await supertest(app)
      .patch(`/api/v1/tryout/${emptyId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PUBLISHED' });
    expect(res.status).toBe(400);
  });

  it('berhasil update status DRAFT → PUBLISHED', async () => {
    const res = await supertest(app)
      .patch(`/api/v1/tryout/${testTryoutId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PUBLISHED' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('gagal transisi status yang tidak valid (400)', async () => {
    const res = await supertest(app)
      .patch(`/api/v1/tryout/${testTryoutId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ENDED' }); // PUBLISHED -> ENDED is invalid
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/tryout', () => {
  it('gagal jika bukan siswa (403)', async () => {
    const res = await supertest(app)
      .get('/api/v1/tryout')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('berhasil mendapatkan daftar tryout PUBLISHED/ONGOING', async () => {
    const res = await supertest(app)
      .get('/api/v1/tryout')
      .set('Authorization', `Bearer ${siswaToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const item = res.body.data.find((t: any) => t.id === testTryoutId);
    expect(item).toBeDefined();
    expect(item.totalSoalTps).toBe(1);
    expect(item.totalSoalTka).toBe(1);
  });

  it('tidak menampilkan tryout DRAFT', async () => {
    // Buat tryout DRAFT baru
    const draftRes = await supertest(app)
      .post('/api/v1/tryout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        judul: 'Test Tryout Draft Hidden',
        mulaiAt: '2026-06-01T08:00:00.000Z',
        selesaiAt: '2026-06-01T14:00:00.000Z',
        durasiTps: 150,
        durasiTka: 90,
      });
    const draftId = draftRes.body.data.id;

    const listRes = await supertest(app)
      .get('/api/v1/tryout')
      .set('Authorization', `Bearer ${siswaToken}`);
    const draftFound = listRes.body.data.find((t: any) => t.id === draftId);
    expect(draftFound).toBeUndefined();
  });
});

describe('POST /api/v1/tryout/:id/mulai', () => {
  it('gagal jika tryout belum ONGOING (400)', async () => {
    // testTryoutId berstatus PUBLISHED saat ini
    const res = await supertest(app)
      .post(`/api/v1/tryout/${testTryoutId}/mulai`)
      .set('Authorization', `Bearer ${siswaToken}`);
    expect(res.status).toBe(400);
  });

  it('berhasil mulai sesi tryout, return soal TPS', async () => {
    // Update tryout ke ONGOING dulu
    await supertest(app)
      .patch(`/api/v1/tryout/${testTryoutId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ONGOING' });

    const res = await supertest(app)
      .post(`/api/v1/tryout/${testTryoutId}/mulai`)
      .set('Authorization', `Bearer ${siswaToken}`);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('sesiId');
    expect(res.body.data.subtesAktif.mapel).toBe('TPS');
    expect(Array.isArray(res.body.data.soal)).toBe(true);
    expect(res.body.data.soal[0]).not.toHaveProperty('jawaban');

    testSesiId = res.body.data.sesiId;
  });

  it('gagal mulai jika sudah punya sesi IN_PROGRESS (400)', async () => {
    const res = await supertest(app)
      .post(`/api/v1/tryout/${testTryoutId}/mulai`)
      .set('Authorization', `Bearer ${siswaToken}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/tryout/sesi/:sesiId/submit-subtes', () => {
  it('gagal jika sesi bukan milik user (403)', async () => {
    // we use a mock token of admin, requireRole blocks admin from accessing siswa endpoints or vice versa
    const res = await supertest(app)
      .post(`/api/v1/tryout/sesi/${testSesiId}/submit-subtes`)
      .set('Authorization', `Bearer ${adminToken}`) // admin is not the siswa who started it
      .send({
        jawabans: [{ soalId: soalTpsId, jawaban: 'A' }],
      });
    expect(res.status).toBe(403);
  });

  it('berhasil submit TPS dan mendapat soal TKA', async () => {
    const res = await supertest(app)
      .post(`/api/v1/tryout/sesi/${testSesiId}/submit-subtes`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({
        jawabans: [{ soalId: soalTpsId, jawaban: 'A' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('skorSubtesTps');
    expect(res.body.data.subtesBerikutnya.mapel).toBe('TKA_SAINTEK');
    expect(Array.isArray(res.body.data.soal)).toBe(true);
    expect(res.body.data.soal[0]).not.toHaveProperty('jawaban');
  });
});

describe('POST /api/v1/tryout/sesi/:sesiId/selesai', () => {
  it('berhasil menyelesaikan tryout dan mendapat skor', async () => {
    const res = await supertest(app)
      .post(`/api/v1/tryout/sesi/${testSesiId}/selesai`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({
        jawabans: [{ soalId: soalTkaId, jawaban: 'B' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.skorTps).toBe(100);
    expect(res.body.data.skorTka).toBe(100);
    expect(res.body.data.skorTotal).toBe(100);
  });

  it('gagal jika sesi sudah SUBMITTED (400)', async () => {
    const res = await supertest(app)
      .post(`/api/v1/tryout/sesi/${testSesiId}/selesai`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({
        jawabans: [{ soalId: soalTkaId, jawaban: 'B' }],
      });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/tryout/sesi/:sesiId/hasil', () => {
  it('berhasil mendapat hasil tryout lengkap per subtes', async () => {
    const res = await supertest(app)
      .get(`/api/v1/tryout/sesi/${testSesiId}/hasil`)
      .set('Authorization', `Bearer ${siswaToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.skorTotal).toBe(100);
    expect(Array.isArray(res.body.data.detailSubtes)).toBe(true);
  });

  it('gagal lihat hasil jika sesi masih IN_PROGRESS (400)', async () => {
    // Buat tryout baru dan sesi baru yang masih IN_PROGRESS
    const draftRes = await supertest(app)
      .post('/api/v1/tryout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        judul: 'Test Tryout Progress',
        mulaiAt: '2026-06-01T08:00:00.000Z',
        selesaiAt: '2026-06-01T14:00:00.000Z',
        durasiTps: 150,
        durasiTka: 90,
      });
    const pTryoutId = draftRes.body.data.id;

    // Tambah soal
    await supertest(app)
      .post(`/api/v1/tryout/${pTryoutId}/subtes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mapel: 'TPS', soalIds: [soalTpsId] });
    await supertest(app)
      .post(`/api/v1/tryout/${pTryoutId}/subtes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mapel: 'TKA_SAINTEK', soalIds: [soalTkaId] });

    // Publish & Ongoing
    await supertest(app)
      .patch(`/api/v1/tryout/${pTryoutId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PUBLISHED' });
    await supertest(app)
      .patch(`/api/v1/tryout/${pTryoutId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ONGOING' });

    // Mulai
    const startRes = await supertest(app)
      .post(`/api/v1/tryout/${pTryoutId}/mulai`)
      .set('Authorization', `Bearer ${siswaToken}`);
    const pSesiId = startRes.body.data.sesiId;

    const res = await supertest(app)
      .get(`/api/v1/tryout/sesi/${pSesiId}/hasil`)
      .set('Authorization', `Bearer ${siswaToken}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/tryout/sesi/riwayat', () => {
  it('berhasil mendapat riwayat tryout siswa', async () => {
    const res = await supertest(app)
      .get('/api/v1/tryout/sesi/riwayat')
      .set('Authorization', `Bearer ${siswaToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('DELETE /api/v1/tryout/:id', () => {
  it('berhasil hapus tryout DRAFT', async () => {
    const draftRes = await supertest(app)
      .post('/api/v1/tryout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        judul: 'Test Tryout Del',
        mulaiAt: '2026-06-01T08:00:00.000Z',
        selesaiAt: '2026-06-01T14:00:00.000Z',
        durasiTps: 150,
        durasiTka: 90,
      });
    const delId = draftRes.body.data.id;

    const res = await supertest(app)
      .delete(`/api/v1/tryout/${delId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('gagal hapus tryout yang sudah PUBLISHED (400)', async () => {
    // testTryoutId saat ini statusnya ONGOING (sudah dipublish)
    const res = await supertest(app)
      .delete(`/api/v1/tryout/${testTryoutId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});
