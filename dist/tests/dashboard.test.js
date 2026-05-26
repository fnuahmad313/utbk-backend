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
                if (token === 'admin-token') {
                    return {
                        data: {
                            user: {
                                id: 'test-dashboard-admin-uuid',
                                email: 'admin-dashboard@utbk.dev',
                            },
                        },
                        error: null,
                    };
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
                    };
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
                    };
                }
                return { data: { user: null }, error: new Error('Token tidak valid') };
            }),
        },
    },
}));
(0, vitest_1.describe)('Dashboard Module', () => {
    (0, vitest_1.beforeAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        // Clean up any existing test data first
        await prisma.jawabanSiswa.deleteMany({
            where: { session: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } } },
        });
        await prisma.latihanSession.deleteMany({
            where: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
        });
        await prisma.jawabanTryout.deleteMany({
            where: { sesi: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } } },
        });
        await prisma.sesiTryout.deleteMany({
            where: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
        });
        await prisma.soal.deleteMany({
            where: { pertanyaan: { startsWith: 'Test Dashboard' } },
        });
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
        });
        await prisma.user.upsert({
            where: { id: 'test-dashboard-siswa-uuid' },
            update: {},
            create: {
                id: 'test-dashboard-siswa-uuid',
                email: 'siswa-dashboard@utbk.dev',
                name: 'Test Siswa Dashboard',
                role: 'SISWA',
            },
        });
        await prisma.user.upsert({
            where: { id: 'test-dashboard-empty-uuid' },
            update: {},
            create: {
                id: 'test-dashboard-empty-uuid',
                email: 'siswa-empty@utbk.dev',
                name: 'Test Siswa Empty',
                role: 'SISWA',
            },
        });
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
        });
        const soal2 = await prisma.soal.create({
            data: {
                pertanyaan: 'Test Dashboard Soal 2',
                tipe: 'SINGLE_CHOICE',
                opsi: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' },
                jawaban: 'B',
                mapel: 'TKA_SAINTEK',
                tingkat: 'sedang',
            },
        });
        // Create completed latihan sessions
        const sesi1 = await prisma.latihanSession.create({
            data: {
                userId: 'test-dashboard-siswa-uuid',
                mapel: 'TPS',
                skor: 80,
                selesai: true,
            },
        });
        await prisma.jawabanSiswa.create({
            data: {
                sessionId: sesi1.id,
                soalId: soal.id,
                jawaban: 'A',
                benar: true,
            },
        });
        const sesi2 = await prisma.latihanSession.create({
            data: {
                userId: 'test-dashboard-siswa-uuid',
                mapel: 'TKA_SAINTEK',
                skor: 60,
                selesai: true,
            },
        });
        await prisma.jawabanSiswa.create({
            data: {
                sessionId: sesi2.id,
                soalId: soal2.id,
                jawaban: 'A',
                benar: false,
            },
        });
    });
    (0, vitest_1.afterAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        await prisma.jawabanSiswa.deleteMany({
            where: { session: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } } },
        });
        await prisma.latihanSession.deleteMany({
            where: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
        });
        await prisma.jawabanTryout.deleteMany({
            where: { sesi: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } } },
        });
        await prisma.sesiTryout.deleteMany({
            where: { userId: { in: ['test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
        });
        await prisma.soal.deleteMany({
            where: { pertanyaan: { startsWith: 'Test Dashboard' } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: ['test-dashboard-admin-uuid', 'test-dashboard-siswa-uuid', 'test-dashboard-empty-uuid'] } },
        });
    });
    // ===========================
    // GET /api/v1/dashboard
    // ===========================
    (0, vitest_1.describe)('GET /api/v1/dashboard', () => {
        (0, vitest_1.it)('gagal tanpa token (401)', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/v1/dashboard');
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)('gagal jika role bukan siswa (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard')
                .set('Authorization', 'Bearer admin-token');
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)('berhasil mendapat dashboard siswa dengan struktur data lengkap', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('data');
            (0, vitest_1.expect)(res.body.data).toHaveProperty('overview');
            (0, vitest_1.expect)(res.body.data).toHaveProperty('latihanAnalytics');
            (0, vitest_1.expect)(res.body.data).toHaveProperty('tryoutAnalytics');
            // Check overview structure
            (0, vitest_1.expect)(res.body.data.overview).toHaveProperty('totalLatihan');
            (0, vitest_1.expect)(res.body.data.overview).toHaveProperty('totalTryout');
            (0, vitest_1.expect)(res.body.data.overview).toHaveProperty('rataRataSkorLatihan');
            (0, vitest_1.expect)(res.body.data.overview).toHaveProperty('rataRataSkorTryout');
            (0, vitest_1.expect)(res.body.data.overview).toHaveProperty('totalSoalDijawab');
            // Check latihanAnalytics structure
            (0, vitest_1.expect)(res.body.data.latihanAnalytics).toHaveProperty('perMapel');
            (0, vitest_1.expect)(res.body.data.latihanAnalytics).toHaveProperty('kelemahanMapel');
            (0, vitest_1.expect)(Array.isArray(res.body.data.latihanAnalytics.perMapel)).toBe(true);
            // Check tryoutAnalytics structure
            (0, vitest_1.expect)(res.body.data.tryoutAnalytics).toHaveProperty('riwayat');
            (0, vitest_1.expect)(res.body.data.tryoutAnalytics).toHaveProperty('trenSkorTotal');
            (0, vitest_1.expect)(res.body.data.tryoutAnalytics).toHaveProperty('skorTerbaik');
            (0, vitest_1.expect)(res.body.data.tryoutAnalytics).toHaveProperty('progressDariAwal');
        });
        (0, vitest_1.it)('overview.totalLatihan sesuai dengan jumlah sesi latihan yang selesai', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.overview.totalLatihan).toBe(2);
        });
        (0, vitest_1.it)('latihanAnalytics.perMapel berisi data per mapel yang benar', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            const perMapel = res.body.data.latihanAnalytics.perMapel;
            (0, vitest_1.expect)(perMapel.length).toBe(2);
            const tps = perMapel.find((m) => m.mapel === 'TPS');
            (0, vitest_1.expect)(tps).toBeDefined();
            (0, vitest_1.expect)(tps.totalSesi).toBe(1);
            (0, vitest_1.expect)(tps.rataRataSkor).toBe(80);
            (0, vitest_1.expect)(tps.skorTertinggi).toBe(80);
            (0, vitest_1.expect)(tps.skorTerendah).toBe(80);
            (0, vitest_1.expect)(Array.isArray(tps.trenSkor)).toBe(true);
            const tkaSaintek = perMapel.find((m) => m.mapel === 'TKA_SAINTEK');
            (0, vitest_1.expect)(tkaSaintek).toBeDefined();
            (0, vitest_1.expect)(tkaSaintek.totalSesi).toBe(1);
            (0, vitest_1.expect)(tkaSaintek.rataRataSkor).toBe(60);
            // kelemahanMapel should be TKA_SAINTEK (lower avg score)
            (0, vitest_1.expect)(res.body.data.latihanAnalytics.kelemahanMapel).toBe('TKA_SAINTEK');
        });
        (0, vitest_1.it)('dashboard siswa baru tanpa data mengembalikan nilai 0 dan array kosong', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard')
                .set('Authorization', 'Bearer siswa-empty-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.overview.totalLatihan).toBe(0);
            (0, vitest_1.expect)(res.body.data.overview.totalTryout).toBe(0);
            (0, vitest_1.expect)(res.body.data.overview.rataRataSkorLatihan).toBe(0);
            (0, vitest_1.expect)(res.body.data.overview.rataRataSkorTryout).toBe(0);
            (0, vitest_1.expect)(res.body.data.overview.totalSoalDijawab).toBe(0);
            (0, vitest_1.expect)(res.body.data.latihanAnalytics.perMapel).toEqual([]);
            (0, vitest_1.expect)(res.body.data.latihanAnalytics.kelemahanMapel).toBeNull();
            (0, vitest_1.expect)(res.body.data.tryoutAnalytics.riwayat).toEqual([]);
            (0, vitest_1.expect)(res.body.data.tryoutAnalytics.trenSkorTotal).toEqual([]);
            (0, vitest_1.expect)(res.body.data.tryoutAnalytics.skorTerbaik.sesiId).toBeNull();
            (0, vitest_1.expect)(res.body.data.tryoutAnalytics.progressDariAwal).toBeNull();
        });
    });
    // ===========================
    // GET /api/v1/dashboard/admin
    // ===========================
    (0, vitest_1.describe)('GET /api/v1/dashboard/admin', () => {
        (0, vitest_1.it)('gagal jika role bukan admin (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', 'Bearer siswa-token');
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)('berhasil mendapat dashboard admin dengan struktur data lengkap', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', 'Bearer admin-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('data');
            // Platform
            (0, vitest_1.expect)(res.body.data).toHaveProperty('platform');
            (0, vitest_1.expect)(res.body.data.platform).toHaveProperty('totalUser');
            (0, vitest_1.expect)(res.body.data.platform).toHaveProperty('totalSoal');
            (0, vitest_1.expect)(res.body.data.platform).toHaveProperty('totalPTN');
            (0, vitest_1.expect)(res.body.data.platform).toHaveProperty('totalJurusan');
            (0, vitest_1.expect)(res.body.data.platform).toHaveProperty('totalTryout');
            (0, vitest_1.expect)(res.body.data.platform).toHaveProperty('totalTryoutOngoing');
            // Aktivitas belajar
            (0, vitest_1.expect)(res.body.data).toHaveProperty('aktivitasBelajar');
            (0, vitest_1.expect)(res.body.data.aktivitasBelajar).toHaveProperty('totalSesiLatihan');
            (0, vitest_1.expect)(res.body.data.aktivitasBelajar).toHaveProperty('totalSesiTryout');
            (0, vitest_1.expect)(res.body.data.aktivitasBelajar).toHaveProperty('rataRataSkorLatihan');
            (0, vitest_1.expect)(res.body.data.aktivitasBelajar).toHaveProperty('rataRataSkorTryout');
            // Tryout stats
            (0, vitest_1.expect)(res.body.data).toHaveProperty('tryoutStats');
            (0, vitest_1.expect)(Array.isArray(res.body.data.tryoutStats)).toBe(true);
            // Top siswa
            (0, vitest_1.expect)(res.body.data).toHaveProperty('topSiswa');
            (0, vitest_1.expect)(Array.isArray(res.body.data.topSiswa)).toBe(true);
        });
        (0, vitest_1.it)('platform.totalUser hanya menghitung user dengan role SISWA', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', 'Bearer admin-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            // totalUser should count SISWA only, not ADMIN
            (0, vitest_1.expect)(typeof res.body.data.platform.totalUser).toBe('number');
            (0, vitest_1.expect)(res.body.data.platform.totalUser).toBeGreaterThanOrEqual(2); // at least our 2 test siswa
        });
        (0, vitest_1.it)('tryoutStats berisi statistik per tryout', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', 'Bearer admin-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            if (res.body.data.tryoutStats.length > 0) {
                const stat = res.body.data.tryoutStats[0];
                (0, vitest_1.expect)(stat).toHaveProperty('tryoutId');
                (0, vitest_1.expect)(stat).toHaveProperty('judul');
                (0, vitest_1.expect)(stat).toHaveProperty('status');
                (0, vitest_1.expect)(stat).toHaveProperty('totalPeserta');
                (0, vitest_1.expect)(stat).toHaveProperty('rataRataSkorTotal');
                (0, vitest_1.expect)(stat).toHaveProperty('skorTertinggi');
                (0, vitest_1.expect)(stat).toHaveProperty('skorTerendah');
            }
        });
        (0, vitest_1.it)('topSiswa berisi maksimal 10 siswa', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/dashboard/admin')
                .set('Authorization', 'Bearer admin-token');
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.topSiswa.length).toBeLessThanOrEqual(10);
            if (res.body.data.topSiswa.length > 0) {
                const siswa = res.body.data.topSiswa[0];
                (0, vitest_1.expect)(siswa).toHaveProperty('userId');
                (0, vitest_1.expect)(siswa).toHaveProperty('nama');
                (0, vitest_1.expect)(siswa).toHaveProperty('email');
                (0, vitest_1.expect)(siswa).toHaveProperty('totalTryout');
                (0, vitest_1.expect)(siswa).toHaveProperty('rataRataSkorTryout');
            }
        });
    });
});
