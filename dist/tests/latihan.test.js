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
// Mock Supabase — tidak butuh koneksi internet atau akun real
vitest_1.vi.mock('../config/supabase', () => ({
    supabase: {
        auth: {
            signUp: vitest_1.vi.fn(),
            signInWithPassword: vitest_1.vi.fn(),
        },
    },
    supabaseAdmin: {
        auth: {
            getUser: vitest_1.vi.fn().mockImplementation(async (token) => {
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
(0, vitest_1.describe)('Latihan Module', () => {
    const tokenUser1 = 'valid-token-user1';
    const tokenUser2 = 'valid-token-user2';
    let createdSoalIds = [];
    let user1SessionId;
    // Setup: buat soal test langsung via Prisma (tidak butuh Supabase Auth)
    (0, vitest_1.beforeAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
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
    (0, vitest_1.afterAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
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
    (0, vitest_1.describe)('POST /api/v1/latihan/mulai', () => {
        (0, vitest_1.it)('gagal mulai latihan jika jumlah di luar 1-40', async () => {
            const res1 = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/latihan/mulai')
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ mapel: 'TPS', jumlah: 0 });
            (0, vitest_1.expect)(res1.status).toBe(400);
            const res2 = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/latihan/mulai')
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ mapel: 'TPS', jumlah: 41 });
            (0, vitest_1.expect)(res2.status).toBe(400);
        });
        (0, vitest_1.it)('gagal mulai latihan jika mapel tidak valid', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/latihan/mulai')
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ mapel: 'IPS', jumlah: 5 });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)('berhasil mulai latihan TPS, mengembalikan soal acak (jumlah <= DB size)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/latihan/mulai')
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ mapel: 'TPS', jumlah: 10 }); // DB hanya punya 2 soal TPS, return 2
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body).toHaveProperty('data');
            (0, vitest_1.expect)(res.body.data).toHaveProperty('id');
            (0, vitest_1.expect)(res.body.data.mapel).toBe('TPS');
            (0, vitest_1.expect)(res.body.data.selesai).toBe(false);
            (0, vitest_1.expect)(Array.isArray(res.body.data.soal)).toBe(true);
            (0, vitest_1.expect)(res.body.data.soal.length).toBeGreaterThanOrEqual(1);
            res.body.data.soal.forEach((s) => {
                (0, vitest_1.expect)(s).not.toHaveProperty('jawaban');
                (0, vitest_1.expect)(s).toHaveProperty('pertanyaan');
            });
            user1SessionId = res.body.data.id;
        });
    });
    // ===========================
    // POST /api/v1/latihan/:sessionId/submit
    // ===========================
    (0, vitest_1.describe)('POST /api/v1/latihan/:sessionId/submit', () => {
        (0, vitest_1.it)('gagal submit jika session ID tidak valid / tidak ada', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/latihan/00000000-0000-0000-0000-000000000000/submit')
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ jawabans: [{ soalId: createdSoalIds[0], jawaban: 'A' }] });
            (0, vitest_1.expect)(res.status).toBe(404);
        });
        (0, vitest_1.it)('gagal submit jika mengakses session milik user lain (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/latihan/${user1SessionId}/submit`)
                .set('Authorization', `Bearer ${tokenUser2}`)
                .send({ jawabans: [{ soalId: createdSoalIds[0], jawaban: 'A' }] });
            (0, vitest_1.expect)(res.status).toBe(403);
            (0, vitest_1.expect)(res.body).toHaveProperty('message');
        });
        (0, vitest_1.it)('berhasil submit jawaban dengan data valid dan hitung skor dengan benar', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/latihan/${user1SessionId}/submit`)
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({
                jawabans: [
                    { soalId: createdSoalIds[0], jawaban: 'A' },
                    { soalId: createdSoalIds[1], jawaban: 'A' },
                ],
            });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('data');
            (0, vitest_1.expect)(res.body.data.skor).toBe(50);
            (0, vitest_1.expect)(res.body.data.jumlahBenar).toBe(1);
            (0, vitest_1.expect)(res.body.data.jumlahSalah).toBe(1);
            (0, vitest_1.expect)(res.body.data.totalSoal).toBe(2);
        });
        (0, vitest_1.it)('gagal submit jika session sudah diselesaikan sebelumnya (selesai: true)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/latihan/${user1SessionId}/submit`)
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ jawabans: [{ soalId: createdSoalIds[0], jawaban: 'A' }] });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.message).toContain('selesai');
        });
    });
    // ===========================
    // GET /api/v1/latihan/riwayat
    // ===========================
    (0, vitest_1.describe)('GET /api/v1/latihan/riwayat', () => {
        (0, vitest_1.it)('berhasil mengambil daftar riwayat sesi user', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/latihan/riwayat')
                .set('Authorization', `Bearer ${tokenUser1}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('data');
            (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
            (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(res.body.data[0].id).toBe(user1SessionId);
            (0, vitest_1.expect)(res.body.data[0].skor).toBe(50);
            (0, vitest_1.expect)(res.body.data[0].selesai).toBe(true);
        });
    });
    // ===========================
    // GET /api/v1/latihan/:sessionId
    // ===========================
    (0, vitest_1.describe)('GET /api/v1/latihan/:sessionId', () => {
        (0, vitest_1.it)('gagal mengakses detail session milik user lain (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/latihan/${user1SessionId}`)
                .set('Authorization', `Bearer ${tokenUser2}`);
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)('berhasil mengambil detail session lengkap (jawaban, status benar/salah, kunci jawaban, dan pembahasan)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/latihan/${user1SessionId}`)
                .set('Authorization', `Bearer ${tokenUser1}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.id).toBe(user1SessionId);
            (0, vitest_1.expect)(res.body.data.skor).toBe(50);
            (0, vitest_1.expect)(res.body.data.selesai).toBe(true);
            (0, vitest_1.expect)(Array.isArray(res.body.data.jawabans)).toBe(true);
            (0, vitest_1.expect)(res.body.data.jawabans.length).toBe(2);
            const j1 = res.body.data.jawabans.find((j) => j.soalId === createdSoalIds[0]);
            (0, vitest_1.expect)(j1.jawabanUser).toBe('A');
            (0, vitest_1.expect)(j1.kunciJawaban).toBe('A');
            (0, vitest_1.expect)(j1.benar).toBe(true);
            (0, vitest_1.expect)(j1.soal.pembahasan).toBe('Pembahasan Soal 1');
            const j2 = res.body.data.jawabans.find((j) => j.soalId === createdSoalIds[1]);
            (0, vitest_1.expect)(j2.jawabanUser).toBe('A');
            (0, vitest_1.expect)(j2.kunciJawaban).toBe('C');
            (0, vitest_1.expect)(j2.benar).toBe(false);
            (0, vitest_1.expect)(j2.soal.pembahasan).toBe('Pembahasan Soal 2');
        });
    });
});
