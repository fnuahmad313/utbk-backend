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
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
// Mock Supabase — tidak butuh koneksi internet atau akun real
vitest_1.vi.mock("../config/supabase", () => ({
    supabase: { auth: { signUp: vitest_1.vi.fn(), signInWithPassword: vitest_1.vi.fn() } },
    supabaseAdmin: {
        auth: {
            getUser: vitest_1.vi.fn().mockImplementation(async (token) => {
                if (token === "admin-token") {
                    return { data: { user: { id: "test-ptn-admin-uuid", email: "adminptn@utbk.dev" } }, error: null };
                }
                if (token === "siswa-token") {
                    return { data: { user: { id: "test-ptn-siswa-uuid", email: "siswaptn@utbk.dev" } }, error: null };
                }
                return { data: { user: null }, error: new Error("Token tidak valid") };
            })
        }
    }
}));
(0, vitest_1.describe)("PTN & Jurusan Module Integration Tests", () => {
    let testPtnId;
    let testJurusanId;
    const adminToken = "admin-token";
    const siswaToken = "siswa-token";
    (0, vitest_1.beforeAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../config/prisma")));
        await prisma.user.upsert({
            where: { id: "test-ptn-admin-uuid" },
            update: {},
            create: { id: "test-ptn-admin-uuid", email: "adminptn@utbk.dev", name: "Test Admin PTN", role: "ADMIN" }
        });
        await prisma.user.upsert({
            where: { id: "test-ptn-siswa-uuid" },
            update: {},
            create: { id: "test-ptn-siswa-uuid", email: "siswaptn@utbk.dev", name: "Test Siswa PTN", role: "SISWA" }
        });
    });
    (0, vitest_1.afterAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../config/prisma")));
        // Clean up cascaded or specifically named test departments and universities
        await prisma.jurusan.deleteMany({ where: { ptn: { nama: { startsWith: "Test PTN" } } } });
        await prisma.pTN.deleteMany({ where: { nama: { startsWith: "Test PTN" } } });
        await prisma.user.deleteMany({ where: { id: { in: ["test-ptn-admin-uuid", "test-ptn-siswa-uuid"] } } });
    });
    // ==========================================
    // POST /api/v1/ptn
    // ==========================================
    (0, vitest_1.describe)("POST /api/v1/ptn", () => {
        (0, vitest_1.it)("gagal jika bukan admin (403)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn")
                .set("Authorization", `Bearer ${siswaToken}`)
                .send({
                nama: "Test PTN Universitas Gadjah Mada",
                singkatan: "UGM-TEST",
                kota: "Yogyakarta",
                provinsi: "DIY",
                akreditasi: "Unggul",
                tipe: "Universitas"
            });
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)("gagal jika body tidak valid (400)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                nama: "", // empty
                singkatan: "UGM-TEST",
                kota: "Yogyakarta",
                provinsi: "DIY",
                akreditasi: "Unggul",
                tipe: "Universitas"
            });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)("gagal jika tipe tidak valid (400)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                nama: "Test PTN Academy",
                singkatan: "PTNA",
                kota: "Bandung",
                provinsi: "Jawa Barat",
                akreditasi: "A",
                tipe: "Akademi" // Invalid tipe
            });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("berhasil membuat PTN baru (201)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                nama: "Test PTN Universitas Indonesia",
                singkatan: "UI-TEST",
                kota: "Depok",
                provinsi: "Jawa Barat",
                akreditasi: "Unggul",
                tipe: "Universitas",
                website: "https://ui-test.ac.id",
                deskripsi: "Kampus uji coba"
            });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body).toHaveProperty("data");
            (0, vitest_1.expect)(res.body.data).toHaveProperty("id");
            (0, vitest_1.expect)(res.body.data.nama).toBe("Test PTN Universitas Indonesia");
            testPtnId = res.body.data.id;
        });
    });
    // ==========================================
    // GET /api/v1/ptn
    // ==========================================
    (0, vitest_1.describe)("GET /api/v1/ptn", () => {
        (0, vitest_1.it)("gagal tanpa token (401)", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/v1/ptn");
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)("berhasil mendapatkan daftar PTN", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/ptn")
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty("data");
            (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
            (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("berhasil filter by provinsi", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/ptn?provinsi=Jawa Barat")
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.every((p) => p.provinsi === "Jawa Barat")).toBe(true);
        });
        (0, vitest_1.it)("berhasil search by nama atau singkatan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/ptn?search=UI-TEST")
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.length).toBe(1);
            (0, vitest_1.expect)(res.body.data[0].singkatan).toBe("UI-TEST");
        });
    });
    // ==========================================
    // GET /api/v1/ptn/:id
    // ==========================================
    (0, vitest_1.describe)("GET /api/v1/ptn/:id", () => {
        (0, vitest_1.it)("berhasil mendapatkan detail PTN beserta jurusan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/ptn/${testPtnId}`)
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.id).toBe(testPtnId);
            (0, vitest_1.expect)(res.body.data).toHaveProperty("jurusans");
            (0, vitest_1.expect)(Array.isArray(res.body.data.jurusans)).toBe(true);
        });
        (0, vitest_1.it)("kembalikan 404 jika PTN tidak ditemukan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/ptn/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(404);
            (0, vitest_1.expect)(res.body.message).toContain("tidak ditemukan");
        });
    });
    // ==========================================
    // PUT /api/v1/ptn/:id
    // ==========================================
    (0, vitest_1.describe)("PUT /api/v1/ptn/:id", () => {
        (0, vitest_1.it)("berhasil update PTN", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/ptn/${testPtnId}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                kota: "Jakarta Selatan",
                singkatan: "UI-TESTED"
            });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.kota).toBe("Jakarta Selatan");
            (0, vitest_1.expect)(res.body.data.singkatan).toBe("UI-TESTED");
        });
        (0, vitest_1.it)("gagal jika bukan admin (403)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/ptn/${testPtnId}`)
                .set("Authorization", `Bearer ${siswaToken}`)
                .send({
                kota: "Surabaya"
            });
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)("kembalikan 404 jika PTN tidak ditemukan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put("/api/v1/ptn/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                kota: "Bandung"
            });
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
    // ==========================================
    // POST /api/v1/ptn/jurusan
    // ==========================================
    (0, vitest_1.describe)("POST /api/v1/ptn/jurusan", () => {
        (0, vitest_1.it)("gagal jika bukan admin (403)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn/jurusan")
                .set("Authorization", `Bearer ${siswaToken}`)
                .send({
                ptnId: testPtnId,
                nama: "Test PTN Ilmu Komputer",
                kode: "TEST-IK",
                fakultas: "Fasilkom",
                jenjang: "S1",
                kelompok: "SAINTEK"
            });
            (0, vitest_1.expect)(res.status).toBe(403);
        });
        (0, vitest_1.it)("gagal jika kelompok tidak valid (400)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn/jurusan")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                ptnId: testPtnId,
                nama: "Test PTN Ilmu Komputer",
                kode: "TEST-IK",
                fakultas: "Fasilkom",
                jenjang: "S1",
                kelompok: "INVALID_KELOMPOK" // Invalid kelompok
            });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)("gagal jika jenjang tidak valid (400)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn/jurusan")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                ptnId: testPtnId,
                nama: "Test PTN Ilmu Komputer",
                kode: "TEST-IK",
                fakultas: "Fasilkom",
                jenjang: "S5", // Invalid jenjang
                kelompok: "SAINTEK"
            });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)("gagal jika ptnId tidak valid (404)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn/jurusan")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                ptnId: "00000000-0000-0000-0000-000000000000",
                nama: "Test PTN Ilmu Komputer",
                kode: "TEST-IK",
                fakultas: "Fasilkom",
                jenjang: "S1",
                kelompok: "SAINTEK"
            });
            (0, vitest_1.expect)(res.status).toBe(404);
        });
        (0, vitest_1.it)("berhasil membuat Jurusan baru (201)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn/jurusan")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                ptnId: testPtnId,
                nama: "Test PTN Ilmu Komputer",
                kode: "TEST-IK",
                fakultas: "Fakultas Ilmu Komputer",
                jenjang: "S1",
                kelompok: "SAINTEK",
                dayaTampung: 80,
                passingGrade: 710.5,
                deskripsi: "Jurusan testing komplit",
                prospekKerja: "Q/A Engineer"
            });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body.data).toHaveProperty("id");
            (0, vitest_1.expect)(res.body.data.nama).toBe("Test PTN Ilmu Komputer");
            testJurusanId = res.body.data.id;
        });
    });
    // ==========================================
    // GET /api/v1/ptn/jurusan
    // ==========================================
    (0, vitest_1.describe)("GET /api/v1/ptn/jurusan", () => {
        (0, vitest_1.it)("berhasil mendapatkan daftar semua jurusan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/ptn/jurusan")
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty("data");
            (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
            (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)("berhasil filter by kelompok SAINTEK", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/ptn/jurusan?kelompok=SAINTEK")
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.every((j) => j.kelompok === "SAINTEK")).toBe(true);
        });
        (0, vitest_1.it)("berhasil search by nama jurusan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/ptn/jurusan?search=Test PTN Ilmu Komputer")
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.length).toBe(1);
            (0, vitest_1.expect)(res.body.data[0].nama).toBe("Test PTN Ilmu Komputer");
        });
    });
    // ==========================================
    // GET /api/v1/ptn/jurusan/:id
    // ==========================================
    (0, vitest_1.describe)("GET /api/v1/ptn/jurusan/:id", () => {
        (0, vitest_1.it)("berhasil mendapatkan detail jurusan beserta data PTN", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/ptn/jurusan/${testJurusanId}`)
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.id).toBe(testJurusanId);
            (0, vitest_1.expect)(res.body.data).toHaveProperty("ptn");
            (0, vitest_1.expect)(res.body.data.ptn.id).toBe(testPtnId);
        });
        (0, vitest_1.it)("kembalikan 404 jika jurusan tidak ditemukan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/ptn/jurusan/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
    // ==========================================
    // GET /api/v1/ptn/:ptnId/jurusan
    // ==========================================
    (0, vitest_1.describe)("GET /api/v1/ptn/:ptnId/jurusan", () => {
        (0, vitest_1.it)("berhasil mendapatkan jurusan dari PTN tertentu", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/ptn/${testPtnId}/jurusan`)
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
            (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(res.body.data[0].ptnId).toBe(testPtnId);
        });
        (0, vitest_1.it)("kembalikan 404 jika PTN tidak ditemukan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/ptn/00000000-0000-0000-0000-000000000000/jurusan")
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
    // ==========================================
    // PUT /api/v1/ptn/jurusan/:id
    // ==========================================
    (0, vitest_1.describe)("PUT /api/v1/ptn/jurusan/:id", () => {
        (0, vitest_1.it)("berhasil update jurusan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/ptn/jurusan/${testJurusanId}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                nama: "Test PTN Ilmu Komputer Updated",
                dayaTampung: 100
            });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.nama).toBe("Test PTN Ilmu Komputer Updated");
            (0, vitest_1.expect)(res.body.data.dayaTampung).toBe(100);
        });
        (0, vitest_1.it)("kembalikan 404 jika jurusan tidak ditemukan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put("/api/v1/ptn/jurusan/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                nama: "Apapun"
            });
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
    // ==========================================
    // DELETE /api/v1/ptn/jurusan/:id
    // ==========================================
    (0, vitest_1.describe)("DELETE /api/v1/ptn/jurusan/:id", () => {
        (0, vitest_1.it)("berhasil hapus jurusan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/ptn/jurusan/${testJurusanId}`)
                .set("Authorization", `Bearer ${adminToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            // Verify not found after deletion
            const getRes = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/ptn/jurusan/${testJurusanId}`)
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(getRes.status).toBe(404);
        });
        (0, vitest_1.it)("kembalikan 404 jika jurusan tidak ditemukan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete("/api/v1/ptn/jurusan/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${adminToken}`);
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
    // ==========================================
    // DELETE /api/v1/ptn/:id
    // ==========================================
    (0, vitest_1.describe)("DELETE /api/v1/ptn/:id", () => {
        (0, vitest_1.it)("berhasil hapus PTN beserta semua jurusannya", async () => {
            // 1. Create a quick new department inside our test PTN to verify cascading delete
            const createJurusanRes = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/ptn/jurusan")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                ptnId: testPtnId,
                nama: "Test PTN Ilmu Hukum",
                kode: "TEST-IH",
                fakultas: "Fakultas Hukum",
                jenjang: "S1",
                kelompok: "SOSHUM"
            });
            (0, vitest_1.expect)(createJurusanRes.status).toBe(201);
            const tempJurusanId = createJurusanRes.body.data.id;
            // 2. Delete the PTN
            const deletePtnRes = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/ptn/${testPtnId}`)
                .set("Authorization", `Bearer ${adminToken}`);
            (0, vitest_1.expect)(deletePtnRes.status).toBe(200);
            // 3. Verify PTN is deleted
            const getPtnRes = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/ptn/${testPtnId}`)
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(getPtnRes.status).toBe(404);
            // 4. Verify department inside the PTN is also deleted
            const getJurusanRes = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/ptn/jurusan/${tempJurusanId}`)
                .set("Authorization", `Bearer ${siswaToken}`);
            (0, vitest_1.expect)(getJurusanRes.status).toBe(404);
        });
        (0, vitest_1.it)("kembalikan 404 jika PTN tidak ditemukan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/ptn/${testPtnId}`) // Since it was just deleted
                .set("Authorization", `Bearer ${adminToken}`);
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
});
