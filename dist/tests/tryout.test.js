"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../config/env");
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
let soalTpsId;
let soalTkaId;
let testTryoutId;
let testSesiId;
const adminToken = 'admin-token';
const siswaToken = 'siswa-token';
vitest_1.vi.mock('../config/supabase', () => ({
    supabase: { auth: { signUp: vitest_1.vi.fn(), signInWithPassword: vitest_1.vi.fn() } },
    supabaseAdmin: {
        auth: {
            getUser: vitest_1.vi.fn().mockImplementation(async (token) => {
                if (token === 'admin-token') {
                    return {
                        data: {
                            user: {
                                id: 'test-tryout-admin-uuid',
                                email: 'admin-tryout@utbk.dev',
                            },
                        },
                        error: null,
                    };
                }
                if (token === 'siswa-token') {
                    return {
                        data: {
                            user: {
                                id: 'test-tryout-siswa-uuid',
                                email: 'siswa-tryout@utbk.dev',
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
(0, vitest_1.beforeAll)(async () => {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
    // Pre-cleanup to ensure fresh start
    await prisma.jawabanTryout.deleteMany({
        where: { sesi: { userId: { in: ['test-tryout-siswa-uuid'] } } },
    });
    await prisma.sesiTryout.deleteMany({
        where: { userId: 'test-tryout-siswa-uuid' },
    });
    await prisma.sesiTryout.deleteMany({
        where: { tryout: { judul: { startsWith: 'Test Tryout' } } },
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
(0, vitest_1.afterAll)(async () => {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
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
(0, vitest_1.describe)('POST /api/v1/tryout', () => {
    (0, vitest_1.it)('gagal jika bukan admin (403)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        (0, vitest_1.expect)(res.status).toBe(403);
    });
    (0, vitest_1.it)('gagal jika body tidak valid (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/tryout')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            judul: '',
            mulaiAt: '2026-06-01T08:00:00.000Z',
            selesaiAt: '2026-06-01T14:00:00.000Z',
            durasiTps: 150,
            durasiTka: 0,
        });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('gagal jika selesaiAt sebelum mulaiAt (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/tryout')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            judul: 'Test Tryout 1',
            mulaiAt: '2026-06-01T14:00:00.000Z',
            selesaiAt: '2026-06-01T08:00:00.000Z',
            durasiTps: 150,
            durasiTka: 90,
        });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('berhasil membuat tryout baru (201)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body).toHaveProperty('data');
        (0, vitest_1.expect)(res.body.data.judul).toBe('Test Tryout Utama');
        (0, vitest_1.expect)(res.body.data.status).toBe('DRAFT');
        (0, vitest_1.expect)(res.body.data.subtes.length).toBe(2);
        testTryoutId = res.body.data.id;
    });
});
(0, vitest_1.describe)('POST /api/v1/tryout/:id/subtes', () => {
    (0, vitest_1.it)('berhasil menambahkan soal ke subtes TPS', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${testTryoutId}/subtes`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            mapel: 'TPS',
            soalIds: [soalTpsId],
        });
        (0, vitest_1.expect)(res.status).toBe(200);
    });
    (0, vitest_1.it)('berhasil menambahkan soal ke subtes TKA', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${testTryoutId}/subtes`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            mapel: 'TKA_SAINTEK',
            soalIds: [soalTkaId],
        });
        (0, vitest_1.expect)(res.status).toBe(200);
    });
    (0, vitest_1.it)('gagal jika mapel tidak valid (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${testTryoutId}/subtes`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            mapel: 'TKA_CAMPURAN',
            soalIds: [soalTkaId],
        });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('gagal jika soalIds kosong (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${testTryoutId}/subtes`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            mapel: 'TPS',
            soalIds: [],
        });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
(0, vitest_1.describe)('PATCH /api/v1/tryout/:id/status', () => {
    (0, vitest_1.it)('gagal publish jika subtes belum punya soal (400)', async () => {
        // Buat tryout baru tanpa soal
        const newTryoutRes = await (0, supertest_1.default)(app_1.default)
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
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/tryout/${emptyId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'PUBLISHED' });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('berhasil update status DRAFT → PUBLISHED', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/tryout/${testTryoutId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'PUBLISHED' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.status).toBe('PUBLISHED');
    });
    (0, vitest_1.it)('gagal transisi status yang tidak valid (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/tryout/${testTryoutId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'ENDED' }); // PUBLISHED -> ENDED is invalid
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
(0, vitest_1.describe)('GET /api/v1/tryout', () => {
    (0, vitest_1.it)('gagal jika bukan siswa (403)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/tryout')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(res.status).toBe(403);
    });
    (0, vitest_1.it)('berhasil mendapatkan daftar tryout PUBLISHED/ONGOING', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/tryout')
            .set('Authorization', `Bearer ${siswaToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
        (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
        const item = res.body.data.find((t) => t.id === testTryoutId);
        (0, vitest_1.expect)(item).toBeDefined();
        (0, vitest_1.expect)(item.totalSoalTps).toBe(1);
        (0, vitest_1.expect)(item.totalSoalTka).toBe(1);
    });
    (0, vitest_1.it)('tidak menampilkan tryout DRAFT', async () => {
        // Buat tryout DRAFT baru
        const draftRes = await (0, supertest_1.default)(app_1.default)
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
        const listRes = await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/tryout')
            .set('Authorization', `Bearer ${siswaToken}`);
        const draftFound = listRes.body.data.find((t) => t.id === draftId);
        (0, vitest_1.expect)(draftFound).toBeUndefined();
    });
});
(0, vitest_1.describe)('POST /api/v1/tryout/:id/mulai', () => {
    (0, vitest_1.it)('gagal jika tryout belum ONGOING (400)', async () => {
        // testTryoutId berstatus PUBLISHED saat ini
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${testTryoutId}/mulai`)
            .set('Authorization', `Bearer ${siswaToken}`);
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('berhasil mulai sesi tryout, return soal TPS', async () => {
        // Update tryout ke ONGOING dulu
        await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/tryout/${testTryoutId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'ONGOING' });
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${testTryoutId}/mulai`)
            .set('Authorization', `Bearer ${siswaToken}`);
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.data).toHaveProperty('sesiId');
        (0, vitest_1.expect)(res.body.data.subtesAktif.mapel).toBe('TPS');
        (0, vitest_1.expect)(Array.isArray(res.body.data.soal)).toBe(true);
        (0, vitest_1.expect)(res.body.data.soal[0]).not.toHaveProperty('jawaban');
        testSesiId = res.body.data.sesiId;
    });
    (0, vitest_1.it)('gagal mulai jika sudah punya sesi IN_PROGRESS (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${testTryoutId}/mulai`)
            .set('Authorization', `Bearer ${siswaToken}`);
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
(0, vitest_1.describe)('POST /api/v1/tryout/sesi/:sesiId/submit-subtes', () => {
    (0, vitest_1.it)('gagal jika sesi bukan milik user (403)', async () => {
        // we use a mock token of admin, requireRole blocks admin from accessing siswa endpoints or vice versa
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/sesi/${testSesiId}/submit-subtes`)
            .set('Authorization', `Bearer ${adminToken}`) // admin is not the siswa who started it
            .send({
            jawabans: [{ soalId: soalTpsId, jawaban: 'A' }],
        });
        (0, vitest_1.expect)(res.status).toBe(403);
    });
    (0, vitest_1.it)('berhasil submit TPS dan mendapat soal TKA', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/sesi/${testSesiId}/submit-subtes`)
            .set('Authorization', `Bearer ${siswaToken}`)
            .send({
            jawabans: [{ soalId: soalTpsId, jawaban: 'A' }],
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data).toHaveProperty('skorSubtesTps');
        (0, vitest_1.expect)(res.body.data.subtesBerikutnya.mapel).toBe('TKA_SAINTEK');
        (0, vitest_1.expect)(Array.isArray(res.body.data.soal)).toBe(true);
        (0, vitest_1.expect)(res.body.data.soal[0]).not.toHaveProperty('jawaban');
    });
});
(0, vitest_1.describe)('POST /api/v1/tryout/sesi/:sesiId/selesai', () => {
    (0, vitest_1.it)('berhasil menyelesaikan tryout dan mendapat skor', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/sesi/${testSesiId}/selesai`)
            .set('Authorization', `Bearer ${siswaToken}`)
            .send({
            jawabans: [{ soalId: soalTkaId, jawaban: 'B' }],
        });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.skorTps).toBe(100);
        (0, vitest_1.expect)(res.body.data.skorTka).toBe(100);
        (0, vitest_1.expect)(res.body.data.skorTotal).toBe(100);
    });
    (0, vitest_1.it)('gagal jika sesi sudah SUBMITTED (400)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/sesi/${testSesiId}/selesai`)
            .set('Authorization', `Bearer ${siswaToken}`)
            .send({
            jawabans: [{ soalId: soalTkaId, jawaban: 'B' }],
        });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
(0, vitest_1.describe)('GET /api/v1/tryout/sesi/:sesiId/hasil', () => {
    (0, vitest_1.it)('berhasil mendapat hasil tryout lengkap per subtes', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/v1/tryout/sesi/${testSesiId}/hasil`)
            .set('Authorization', `Bearer ${siswaToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.skorTotal).toBe(100);
        (0, vitest_1.expect)(Array.isArray(res.body.data.detailSubtes)).toBe(true);
    });
    (0, vitest_1.it)('gagal lihat hasil jika sesi masih IN_PROGRESS (400)', async () => {
        // Buat tryout baru dan sesi baru yang masih IN_PROGRESS
        const draftRes = await (0, supertest_1.default)(app_1.default)
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
        await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${pTryoutId}/subtes`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ mapel: 'TPS', soalIds: [soalTpsId] });
        await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${pTryoutId}/subtes`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ mapel: 'TKA_SAINTEK', soalIds: [soalTkaId] });
        // Publish & Ongoing
        await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/tryout/${pTryoutId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'PUBLISHED' });
        await (0, supertest_1.default)(app_1.default)
            .patch(`/api/v1/tryout/${pTryoutId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'ONGOING' });
        // Mulai
        const startRes = await (0, supertest_1.default)(app_1.default)
            .post(`/api/v1/tryout/${pTryoutId}/mulai`)
            .set('Authorization', `Bearer ${siswaToken}`);
        const pSesiId = startRes.body.data.sesiId;
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/v1/tryout/sesi/${pSesiId}/hasil`)
            .set('Authorization', `Bearer ${siswaToken}`);
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
(0, vitest_1.describe)('GET /api/v1/tryout/sesi/riwayat', () => {
    (0, vitest_1.it)('berhasil mendapat riwayat tryout siswa', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/tryout/sesi/riwayat')
            .set('Authorization', `Bearer ${siswaToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
        (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
    });
});
(0, vitest_1.describe)('DELETE /api/v1/tryout/:id', () => {
    (0, vitest_1.it)('berhasil hapus tryout DRAFT', async () => {
        const draftRes = await (0, supertest_1.default)(app_1.default)
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
        const res = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/v1/tryout/${delId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
    });
    (0, vitest_1.it)('gagal hapus tryout yang sudah PUBLISHED (400)', async () => {
        // testTryoutId saat ini statusnya ONGOING (sudah dipublish)
        const res = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/v1/tryout/${testTryoutId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
