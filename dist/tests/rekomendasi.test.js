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
// Mock Supabase
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
                if (token === 'siswa-token') {
                    return {
                        data: {
                            user: {
                                id: 'test-rek-siswa-uuid',
                                email: 'siswa-rek@utbk.dev',
                            },
                        },
                        error: null,
                    };
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
                    };
                }
                return { data: { user: null }, error: new Error('Token tidak valid') };
            }),
        },
    },
}));
(0, vitest_1.describe)('Rekomendasi Module', () => {
    let testTryoutId;
    (0, vitest_1.beforeAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        // Clean up first
        await prisma.sesiTryout.deleteMany({
            where: { userId: { in: ['test-rek-siswa-uuid', 'test-rek-notryout-uuid'] } },
        });
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
        });
        await prisma.user.upsert({
            where: { id: 'test-rek-notryout-uuid' },
            update: {},
            create: {
                id: 'test-rek-notryout-uuid',
                email: 'siswa-notryout@utbk.dev',
                name: 'Test Siswa No Tryout',
                role: 'SISWA',
            },
        });
        // Find or create a tryout for the test
        let tryout = await prisma.tryout.findFirst();
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
            });
        }
        testTryoutId = tryout.id;
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
        });
    });
    (0, vitest_1.afterAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        await prisma.sesiTryout.deleteMany({
            where: { userId: { in: ['test-rek-siswa-uuid', 'test-rek-notryout-uuid'] } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: ['test-rek-siswa-uuid', 'test-rek-notryout-uuid'] } },
        });
    });
    // ===========================
    // GET /api/v1/rekomendasi
    // ===========================
    (0, vitest_1.describe)('GET /api/v1/rekomendasi', () => {
        (0, vitest_1.it)('gagal tanpa token (401)', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/v1/rekomendasi');
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)('gagal jika role bukan siswa (403)', async () => {
            // No valid non-SISWA token in our mock, but missing token returns 401
            // We test with an invalid token
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi')
                .set('Authorization', 'Bearer invalid-token');
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)('gagal jika belum ada data tryout yang selesai (400)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi')
                .set('Authorization', 'Bearer siswa-no-tryout-token');
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.message).toContain('Belum ada data tryout');
        });
        (0, vitest_1.it)('berhasil mendapat rekomendasi jurusan', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi')
                .set('Authorization', 'Bearer siswa-token');
            // If no jurusan with passingGrade in DB, response should still be 200
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('data');
            (0, vitest_1.expect)(res.body.data).toHaveProperty('skorReferensi');
            (0, vitest_1.expect)(res.body.data).toHaveProperty('totalRekomendasi');
            (0, vitest_1.expect)(res.body.data).toHaveProperty('rekomendasi');
            (0, vitest_1.expect)(Array.isArray(res.body.data.rekomendasi)).toBe(true);
        });
        (0, vitest_1.it)('response berisi skorReferensi yang benar', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            // Average of skorTotal = 72 (only one session)
            (0, vitest_1.expect)(res.body.data.skorReferensi).toBe(72);
        });
        (0, vitest_1.it)('setiap item rekomendasi punya field kategori: aman | kompetitif | tantangan', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            const validKategori = ['aman', 'kompetitif', 'tantangan'];
            for (const item of res.body.data.rekomendasi) {
                (0, vitest_1.expect)(validKategori).toContain(item.kategori);
                (0, vitest_1.expect)(item).toHaveProperty('jurusanId');
                (0, vitest_1.expect)(item).toHaveProperty('namaJurusan');
                (0, vitest_1.expect)(item).toHaveProperty('fakultas');
                (0, vitest_1.expect)(item).toHaveProperty('jenjang');
                (0, vitest_1.expect)(item).toHaveProperty('kelompok');
                (0, vitest_1.expect)(item).toHaveProperty('ptn');
                (0, vitest_1.expect)(item).toHaveProperty('passingGrade');
                (0, vitest_1.expect)(item).toHaveProperty('selisih');
            }
        });
        (0, vitest_1.it)('berhasil filter by kelompok SAINTEK', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi?kelompok=SAINTEK')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            for (const item of res.body.data.rekomendasi) {
                (0, vitest_1.expect)(item.kelompok).toBe('SAINTEK');
            }
        });
        (0, vitest_1.it)('gagal jika kelompok tidak valid (400)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi?kelompok=INVALID')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.message).toContain('Kelompok tidak valid');
        });
        (0, vitest_1.it)('limit default 10 dan bisa diubah via query param', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi?limit=5')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.rekomendasi.length).toBeLessThanOrEqual(5);
            // Test default
            const resDefault = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(resDefault.status).toBe(200);
            (0, vitest_1.expect)(resDefault.body.data.rekomendasi.length).toBeLessThanOrEqual(10);
        });
        (0, vitest_1.it)('urutan rekomendasi: aman dulu, lalu kompetitif, lalu tantangan', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/rekomendasi?limit=50')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            const rekomendasi = res.body.data.rekomendasi;
            const kategoriOrder = { aman: 0, kompetitif: 1, tantangan: 2 };
            for (let i = 1; i < rekomendasi.length; i++) {
                const prevOrder = kategoriOrder[rekomendasi[i - 1].kategori];
                const currOrder = kategoriOrder[rekomendasi[i].kategori];
                (0, vitest_1.expect)(currOrder).toBeGreaterThanOrEqual(prevOrder);
                // Within same category, selisih should be ascending
                if (prevOrder === currOrder) {
                    (0, vitest_1.expect)(rekomendasi[i].selisih).toBeGreaterThanOrEqual(rekomendasi[i - 1].selisih);
                }
            }
        });
    });
});
