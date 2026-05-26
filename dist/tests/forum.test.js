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
    supabase: { auth: { signUp: vitest_1.vi.fn(), signInWithPassword: vitest_1.vi.fn() } },
    supabaseAdmin: {
        auth: {
            getUser: vitest_1.vi.fn().mockImplementation(async (token) => {
                if (token === 'admin-token') {
                    return { data: { user: { id: 'test-forum-admin-uuid', email: 'admin-forum@utbk.dev' } }, error: null };
                }
                if (token === 'siswa-token') {
                    return { data: { user: { id: 'test-forum-siswa-uuid', email: 'siswa-forum@utbk.dev' } }, error: null };
                }
                if (token === 'siswa2-token') {
                    return { data: { user: { id: 'test-forum-siswa2-uuid', email: 'siswa2-forum@utbk.dev' } }, error: null };
                }
                return { data: { user: null }, error: new Error('Token tidak valid') };
            })
        }
    }
}));
(0, vitest_1.describe)('Forum & Komunitas Module', () => {
    let adminToken = 'admin-token';
    let siswaToken = 'siswa-token';
    let siswa2Token = 'siswa2-token';
    let testKategoriId;
    let testKategori2Id;
    let testPostId;
    let testPost2Id;
    let testKomentarId;
    let testReplyId;
    (0, vitest_1.beforeAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        // Clean up first — use userId filter to catch ALL test posts (including 'Test Post Temp')
        const testUserIds = ['test-forum-admin-uuid', 'test-forum-siswa-uuid', 'test-forum-siswa2-uuid'];
        await prisma.forumKomentarLike.deleteMany({ where: { komentar: { post: { userId: { in: testUserIds } } } } });
        await prisma.forumPostLike.deleteMany({ where: { post: { userId: { in: testUserIds } } } });
        await prisma.forumKomentar.deleteMany({ where: { post: { userId: { in: testUserIds } } } });
        await prisma.forumPost.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.kategoriForumPost.deleteMany({ where: { nama: { startsWith: 'Test Kategori' } } });
        await prisma.user.deleteMany({
            where: { id: { in: ['test-forum-admin-uuid', 'test-forum-siswa-uuid', 'test-forum-siswa2-uuid'] } }
        });
        // Create users
        await prisma.user.upsert({
            where: { id: 'test-forum-admin-uuid' },
            update: {},
            create: { id: 'test-forum-admin-uuid', email: 'admin-forum@utbk.dev', name: 'Test Admin Forum', role: 'ADMIN' }
        });
        await prisma.user.upsert({
            where: { id: 'test-forum-siswa-uuid' },
            update: {},
            create: { id: 'test-forum-siswa-uuid', email: 'siswa-forum@utbk.dev', name: 'Test Siswa Forum', role: 'SISWA' }
        });
        await prisma.user.upsert({
            where: { id: 'test-forum-siswa2-uuid' },
            update: {},
            create: { id: 'test-forum-siswa2-uuid', email: 'siswa2-forum@utbk.dev', name: 'Test Siswa Forum 2', role: 'SISWA' }
        });
    });
    (0, vitest_1.afterAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        const testUserIds = ['test-forum-admin-uuid', 'test-forum-siswa-uuid', 'test-forum-siswa2-uuid'];
        await prisma.forumKomentarLike.deleteMany({ where: { komentar: { post: { userId: { in: testUserIds } } } } });
        await prisma.forumPostLike.deleteMany({ where: { post: { userId: { in: testUserIds } } } });
        await prisma.forumKomentar.deleteMany({ where: { post: { userId: { in: testUserIds } } } });
        await prisma.forumPost.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.kategoriForumPost.deleteMany({ where: { nama: { startsWith: 'Test Kategori' } } });
        await prisma.user.deleteMany({
            where: { id: { in: ['test-forum-admin-uuid', 'test-forum-siswa-uuid', 'test-forum-siswa2-uuid'] } }
        });
    });
    // ===== KATEGORI =====
    (0, vitest_1.describe)('POST /api/v1/forum/kategori', () => {
        (0, vitest_1.it)('gagal jika bukan admin (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/kategori')
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ nama: 'Test Kategori Satu' });
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)('berhasil membuat kategori baru dan generate slug otomatis', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/kategori')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ nama: 'Test Kategori Satu', deskripsi: 'Kategori untuk testing' });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body.data).toHaveProperty('id');
            (0, vitest_1.expect)(res.body.data.nama).toBe('Test Kategori Satu');
            (0, vitest_1.expect)(res.body.data.slug).toBe('test-kategori-satu');
            testKategoriId = res.body.data.id;
            // Create a second one for later tests
            const res2 = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/kategori')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ nama: 'Test Kategori Dua', deskripsi: 'Kategori kedua untuk testing' });
            (0, vitest_1.expect)(res2.status).toBe(201);
            testKategori2Id = res2.body.data.id;
        });
        (0, vitest_1.it)('gagal jika nama kategori duplikat (400)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/kategori')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ nama: 'Test Kategori Satu' });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
    });
    (0, vitest_1.describe)('GET /api/v1/forum/kategori', () => {
        (0, vitest_1.it)('berhasil mendapat daftar kategori beserta jumlah post', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/forum/kategori')
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
            const found = res.body.data.find((k) => k.id === testKategoriId);
            (0, vitest_1.expect)(found).toBeDefined();
            (0, vitest_1.expect)(found).toHaveProperty('_count');
            (0, vitest_1.expect)(found._count).toHaveProperty('posts');
        });
    });
    // ===== POST =====
    (0, vitest_1.describe)('POST /api/v1/forum/posts', () => {
        (0, vitest_1.it)('gagal jika bukan siswa (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/posts')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ kategoriId: testKategoriId, judul: 'Test Forum Post 1', konten: 'Konten post forum 1 yang panjang' });
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)('gagal jika judul terlalu pendek (400)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/posts')
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ kategoriId: testKategoriId, judul: 'Abc', konten: 'Konten post forum 1 yang panjang' });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)('gagal jika konten terlalu pendek (400)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/posts')
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ kategoriId: testKategoriId, judul: 'Test Forum Post 1', konten: 'Short' });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)('gagal jika kategoriId tidak valid (400)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/posts')
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ kategoriId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', judul: 'Test Forum Post 1', konten: 'Konten post forum 1 yang panjang' });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)('berhasil membuat post baru', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/posts')
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ kategoriId: testKategoriId, judul: 'Test Forum Post Satu', konten: 'Konten post forum 1 yang panjang sekali ini' });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body.data).toHaveProperty('id');
            (0, vitest_1.expect)(res.body.data.judul).toBe('Test Forum Post Satu');
            testPostId = res.body.data.id;
            // Create a second post by siswa2 for testing ordering/pins
            const res2 = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/posts')
                .set('Authorization', `Bearer ${siswa2Token}`)
                .send({ kategoriId: testKategoriId, judul: 'Test Forum Post Dua', konten: 'Konten post forum 2 yang panjang sekali ini' });
            (0, vitest_1.expect)(res2.status).toBe(201);
            testPost2Id = res2.body.data.id;
        });
    });
    (0, vitest_1.describe)('GET /api/v1/forum/posts', () => {
        (0, vitest_1.it)('berhasil mendapat daftar post dengan pagination', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/forum/posts?page=1&limit=5')
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty('data');
            (0, vitest_1.expect)(res.body).toHaveProperty('meta');
            (0, vitest_1.expect)(res.body.meta.page).toBe(1);
            (0, vitest_1.expect)(res.body.meta.limit).toBe(5);
        });
        (0, vitest_1.it)('berhasil filter by kategoriId', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/forum/posts?kategoriId=${testKategoriId}`)
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.every((p) => p.kategori.id === testKategoriId)).toBe(true);
        });
        (0, vitest_1.it)('berhasil search by judul', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/forum/posts?search=Post Satu')
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.some((p) => p.judul.includes('Satu'))).toBe(true);
        });
        (0, vitest_1.it)('pinned post muncul di atas', async () => {
            // First, pin post 2 (which was created after post 1)
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/v1/forum/posts/${testPost2Id}/pin`)
                .set('Authorization', `Bearer ${adminToken}`);
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/forum/posts')
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            // The first post in the list should be post 2 because it is pinned
            (0, vitest_1.expect)(res.body.data[0].id).toBe(testPost2Id);
            (0, vitest_1.expect)(res.body.data[0].isPinned).toBe(true);
            // Unpin post 2 to restore clean state
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/v1/forum/posts/${testPost2Id}/pin`)
                .set('Authorization', `Bearer ${adminToken}`);
        });
    });
    (0, vitest_1.describe)('GET /api/v1/forum/posts/:id', () => {
        (0, vitest_1.it)('berhasil mendapat detail post beserta komentar', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/forum/posts/${testPostId}`)
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.id).toBe(testPostId);
            (0, vitest_1.expect)(res.body.data).toHaveProperty('komentar');
            (0, vitest_1.expect)(res.body.data).toHaveProperty('isLikedByUser');
            (0, vitest_1.expect)(res.body.data.isLikedByUser).toBe(false);
        });
        (0, vitest_1.it)('viewCount bertambah setiap kali diakses', async () => {
            const resBefore = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/forum/posts/${testPostId}`)
                .set('Authorization', `Bearer ${siswaToken}`);
            const countBefore = resBefore.body.data.viewCount;
            const resAfter = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/forum/posts/${testPostId}`)
                .set('Authorization', `Bearer ${siswaToken}`);
            const countAfter = resAfter.body.data.viewCount;
            (0, vitest_1.expect)(countAfter).toBe(countBefore + 1);
        });
        (0, vitest_1.it)('kembalikan 404 jika post tidak ditemukan', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/forum/posts/a1b2c3d4-e5f6-7890-abcd-ef1234567890')
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
    (0, vitest_1.describe)('PUT /api/v1/forum/posts/:id', () => {
        (0, vitest_1.it)('berhasil update post milik sendiri', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/forum/posts/${testPostId}`)
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ judul: 'Test Forum Post Satu Updated', konten: 'Konten post forum 1 yang sudah di-update sekarang' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.judul).toBe('Test Forum Post Satu Updated');
        });
        (0, vitest_1.it)('gagal update post milik orang lain (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/forum/posts/${testPostId}`)
                .set('Authorization', `Bearer ${siswa2Token}`)
                .send({ judul: 'Hack Post Orang Lain' });
            (0, vitest_1.expect)(res.status).toBe(403);
        });
    });
    (0, vitest_1.describe)('POST /api/v1/forum/posts/:id/like', () => {
        (0, vitest_1.it)('berhasil like post dan likeCount bertambah', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/forum/posts/${testPostId}/like`)
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.liked).toBe(true);
            (0, vitest_1.expect)(res.body.data.likeCount).toBe(1);
        });
        (0, vitest_1.it)('berhasil unlike post dan likeCount berkurang', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/forum/posts/${testPostId}/like`)
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.liked).toBe(false);
            (0, vitest_1.expect)(res.body.data.likeCount).toBe(0);
        });
    });
    (0, vitest_1.describe)('PATCH /api/v1/forum/posts/:id/pin', () => {
        (0, vitest_1.it)('admin berhasil toggle pin post', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/v1/forum/posts/${testPostId}/pin`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.isPinned).toBe(true);
        });
        (0, vitest_1.it)('gagal jika bukan admin (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/v1/forum/posts/${testPostId}/pin`)
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(403);
        });
    });
    (0, vitest_1.describe)('PATCH /api/v1/forum/posts/:id/lock', () => {
        (0, vitest_1.it)('admin berhasil toggle lock post', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/v1/forum/posts/${testPostId}/lock`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.isLocked).toBe(true);
        });
    });
    // ===== KOMENTAR =====
    (0, vitest_1.describe)('POST /api/v1/forum/posts/:postId/komentar', () => {
        (0, vitest_1.it)('gagal komentar di post yang terkunci (400)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/forum/posts/${testPostId}/komentar`)
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ konten: 'Komentar di post locked' });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body.message).toContain('dikunci');
        });
        (0, vitest_1.it)('berhasil membuat komentar baru setelah post diunlock', async () => {
            // Unlock post first
            await (0, supertest_1.default)(app_1.default)
                .patch(`/api/v1/forum/posts/${testPostId}/lock`)
                .set('Authorization', `Bearer ${adminToken}`);
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/forum/posts/${testPostId}/komentar`)
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ konten: 'Ini komentar level satu' });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body.data).toHaveProperty('id');
            (0, vitest_1.expect)(res.body.data.konten).toBe('Ini komentar level satu');
            testKomentarId = res.body.data.id;
        });
        (0, vitest_1.it)('berhasil membuat reply ke komentar (level 2)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/forum/posts/${testPostId}/komentar`)
                .set('Authorization', `Bearer ${siswa2Token}`)
                .send({ parentId: testKomentarId, konten: 'Ini reply ke komentar (level 2)' });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body.data).toHaveProperty('id');
            (0, vitest_1.expect)(res.body.data.parentId).toBe(testKomentarId);
            testReplyId = res.body.data.id;
        });
        (0, vitest_1.it)('gagal reply ke reply (level 3 tidak diizinkan)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/forum/posts/${testPostId}/komentar`)
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ parentId: testReplyId, konten: 'Reply level tiga' });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
    });
    (0, vitest_1.describe)('POST /api/v1/forum/komentar/:id/like', () => {
        (0, vitest_1.it)('berhasil like komentar dan likeCount bertambah', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/forum/komentar/${testKomentarId}/like`)
                .set('Authorization', `Bearer ${siswa2Token}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.liked).toBe(true);
            (0, vitest_1.expect)(res.body.data.likeCount).toBe(1);
        });
        (0, vitest_1.it)('berhasil unlike komentar dan likeCount berkurang', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post(`/api/v1/forum/komentar/${testKomentarId}/like`)
                .set('Authorization', `Bearer ${siswa2Token}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.liked).toBe(false);
            (0, vitest_1.expect)(res.body.data.likeCount).toBe(0);
        });
    });
    (0, vitest_1.describe)('PUT /api/v1/forum/komentar/:id', () => {
        (0, vitest_1.it)('berhasil update komentar milik sendiri', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/forum/komentar/${testKomentarId}`)
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ konten: 'Komentar level satu terupdate' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.konten).toBe('Komentar level satu terupdate');
        });
        (0, vitest_1.it)('gagal update komentar orang lain (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/forum/komentar/${testKomentarId}`)
                .set('Authorization', `Bearer ${siswa2Token}`)
                .send({ konten: 'Mencoba hack komentar' });
            (0, vitest_1.expect)(res.status).toBe(403);
        });
    });
    (0, vitest_1.describe)('DELETE /api/v1/forum/komentar/:id', () => {
        (0, vitest_1.it)('gagal hapus komentar milik orang lain (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/forum/komentar/${testKomentarId}`)
                .set('Authorization', `Bearer ${siswa2Token}`);
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)('siswa berhasil hapus komentar miliknya', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/forum/komentar/${testReplyId}`)
                .set('Authorization', `Bearer ${siswa2Token}`);
            (0, vitest_1.expect)(res.status).toBe(200);
        });
        (0, vitest_1.it)('admin berhasil hapus komentar siapapun', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/forum/komentar/${testKomentarId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
        });
    });
    (0, vitest_1.describe)('DELETE /api/v1/forum/posts/:id', () => {
        (0, vitest_1.it)('gagal hapus post milik orang lain (403)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/forum/posts/${testPost2Id}`)
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)('siswa berhasil hapus post miliknya', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/forum/posts/${testPostId}`)
                .set('Authorization', `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
        });
        (0, vitest_1.it)('admin berhasil hapus post siapapun', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/forum/posts/${testPost2Id}`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
        });
    });
    // ===== KATEGORI MUTASI LAINNYA =====
    (0, vitest_1.describe)('PUT /api/v1/forum/kategori/:id', () => {
        (0, vitest_1.it)('admin berhasil update kategori', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/forum/kategori/${testKategoriId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ nama: 'Test Kategori Satu Terubah', deskripsi: 'Deskripsi update' });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.nama).toBe('Test Kategori Satu Terubah');
            (0, vitest_1.expect)(res.body.data.slug).toBe('test-kategori-satu-terubah');
        });
        (0, vitest_1.it)('kembalikan 404 jika kategori tidak ditemukan', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put('/api/v1/forum/kategori/a1b2c3d4-e5f6-7890-abcd-ef1234567890')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ nama: 'Random Name' });
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
    (0, vitest_1.describe)('DELETE /api/v1/forum/kategori/:id', () => {
        (0, vitest_1.it)('gagal hapus kategori yang masih punya post (400)', async () => {
            // Create a temporary post inside testKategori2Id
            const postRes = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/forum/posts')
                .set('Authorization', `Bearer ${siswaToken}`)
                .send({ kategoriId: testKategori2Id, judul: 'Test Post Temp', konten: 'Panjang konten post temp' });
            (0, vitest_1.expect)(postRes.status).toBe(201);
            const tempPostId = postRes.body.data.id;
            // Attempt to delete the category
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/forum/kategori/${testKategori2Id}`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, vitest_1.expect)(res.status).toBe(400);
            // Clean up the post
            await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/forum/posts/${tempPostId}`)
                .set('Authorization', `Bearer ${adminToken}`);
        });
        (0, vitest_1.it)('admin berhasil hapus kategori kosong', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/forum/kategori/${testKategori2Id}`)
                .set('Authorization', `Bearer ${adminToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
        });
    });
});
