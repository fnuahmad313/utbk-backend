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
    supabase: {
        auth: {
            signUp: vitest_1.vi.fn(),
            signInWithPassword: vitest_1.vi.fn(),
        },
    },
    supabaseAdmin: {
        auth: {
            getUser: vitest_1.vi.fn().mockImplementation(async (token) => {
                if (token === "valid-token") {
                    return {
                        data: { user: { id: "test-user-soal-uuid", email: "testsoal@utbk.dev" } },
                        error: null,
                    };
                }
                if (token === "siswa-token") {
                    return {
                        data: { user: { id: "test-siswa-uuid", email: "testsisswa@utbk.dev" } },
                        error: null,
                    };
                }
                return { data: { user: null }, error: new Error("Token tidak valid") };
            }),
        },
    },
}));
(0, vitest_1.describe)("Soal Module", () => {
    const token = "valid-token";
    let createdSoalId;
    (0, vitest_1.beforeAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../config/prisma")));
        await prisma.user.upsert({
            where: { id: "test-user-soal-uuid" },
            update: {},
            create: {
                id: "test-user-soal-uuid",
                email: "testsoal@utbk.dev",
                name: "Test Admin Soal",
                role: "ADMIN"
            }
        });
        await prisma.user.upsert({
            where: { id: "test-siswa-uuid" },
            update: {},
            create: {
                id: "test-siswa-uuid",
                email: "testsisswa@utbk.dev",
                name: "Test Siswa",
                role: "SISWA"
            }
        });
    });
    // Cleanup setelah semua test selesai
    (0, vitest_1.afterAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../config/prisma")));
        await prisma.jawabanSiswa.deleteMany({
            where: { session: { userId: "test-user-soal-uuid" } },
        });
        await prisma.latihanSession.deleteMany({
            where: { userId: "test-user-soal-uuid" },
        });
        await prisma.soal.deleteMany({
            where: { pertanyaan: { startsWith: "Test Pertanyaan" } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: ["test-user-soal-uuid", "test-siswa-uuid"] } }
        });
    });
    // ===========================
    // POST /api/v1/soal
    // ===========================
    (0, vitest_1.describe)("POST /api/v1/soal", () => {
        (0, vitest_1.it)("gagal tanpa token authentication", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/soal")
                .send({
                pertanyaan: "Test Pertanyaan 1",
                opsi: { A: "A", B: "B", C: "C", D: "D", E: "E" },
                jawaban: "A",
                mapel: "TPS",
                tingkat: "mudah",
            });
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)("gagal jika role bukan admin (403)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/soal")
                .set("Authorization", "Bearer siswa-token")
                .send({
                pertanyaan: "Test soal",
                opsi: { A: "A", B: "B", C: "C", D: "D", E: "E" },
                jawaban: "A",
                mapel: "TPS",
                tingkat: "mudah",
            });
            (0, vitest_1.expect)(res.status).toBe(403);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("gagal jika parameter body tidak valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/soal")
                .set("Authorization", `Bearer ${token}`)
                .send({
                pertanyaan: "",
                opsi: { A: "A" },
                jawaban: "Z",
                mapel: "TPS_INVALID",
                tingkat: "sangat_sulit",
            });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("berhasil membuat soal baru dengan data valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/soal")
                .set("Authorization", `Bearer ${token}`)
                .send({
                pertanyaan: "Test Pertanyaan 1",
                opsi: { A: "Opsi A", B: "Opsi B", C: "Opsi C", D: "Opsi D", E: "Opsi E" },
                jawaban: "B",
                pembahasan: "Ini pembahasan detail soal 1",
                mapel: "TPS",
                tingkat: "mudah",
            });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body).toHaveProperty("data");
            (0, vitest_1.expect)(res.body.data).toHaveProperty("id");
            (0, vitest_1.expect)(res.body.data.pertanyaan).toBe("Test Pertanyaan 1");
            (0, vitest_1.expect)(res.body.data).not.toHaveProperty("jawaban");
            createdSoalId = res.body.data.id;
        });
    });
    // ===========================
    // GET /api/v1/soal
    // ===========================
    (0, vitest_1.describe)("GET /api/v1/soal", () => {
        (0, vitest_1.it)("berhasil mengambil semua soal", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/soal")
                .set("Authorization", `Bearer ${token}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty("data");
            (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
            (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
            res.body.data.forEach((s) => {
                (0, vitest_1.expect)(s).not.toHaveProperty("jawaban");
            });
        });
        (0, vitest_1.it)("berhasil mengambil dengan filter mapel dan tingkat", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/soal?mapel=TPS&tingkat=mudah")
                .set("Authorization", `Bearer ${token}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.length).toBeGreaterThan(0);
            res.body.data.forEach((s) => {
                (0, vitest_1.expect)(s.mapel).toBe("TPS");
                (0, vitest_1.expect)(s.tingkat).toBe("mudah");
                (0, vitest_1.expect)(s).not.toHaveProperty("jawaban");
            });
        });
        (0, vitest_1.it)("gagal jika filter query tidak valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/soal?mapel=INVALID")
                .set("Authorization", `Bearer ${token}`);
            (0, vitest_1.expect)(res.status).toBe(400);
        });
    });
    // ===========================
    // GET /api/v1/soal/:id
    // ===========================
    (0, vitest_1.describe)("GET /api/v1/soal/:id", () => {
        (0, vitest_1.it)("berhasil mengambil soal berdasarkan ID", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/soal/${createdSoalId}`)
                .set("Authorization", `Bearer ${token}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.id).toBe(createdSoalId);
            (0, vitest_1.expect)(res.body.data.pertanyaan).toBe("Test Pertanyaan 1");
            (0, vitest_1.expect)(res.body.data).not.toHaveProperty("jawaban");
        });
        (0, vitest_1.it)("kembalikan 404 jika ID tidak ditemukan", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/soal/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${token}`);
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
    // ===========================
    // PUT /api/v1/soal/:id
    // ===========================
    (0, vitest_1.describe)("PUT /api/v1/soal/:id", () => {
        (0, vitest_1.it)("berhasil mengupdate soal", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/soal/${createdSoalId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ pertanyaan: "Test Pertanyaan 1 Updated", tingkat: "sedang" });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.pertanyaan).toBe("Test Pertanyaan 1 Updated");
            (0, vitest_1.expect)(res.body.data.tingkat).toBe("sedang");
            (0, vitest_1.expect)(res.body.data).not.toHaveProperty("jawaban");
        });
        (0, vitest_1.it)("gagal update dengan data body tidak valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/soal/${createdSoalId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ tingkat: "sangat_sulit" });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)("kembalikan 404 jika ID tidak ditemukan saat update", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put("/api/v1/soal/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${token}`)
                .send({ pertanyaan: "Apapun" });
            (0, vitest_1.expect)(res.status).toBe(404);
        });
    });
    // ===========================
    // DELETE /api/v1/soal/:id
    // ===========================
    (0, vitest_1.describe)("DELETE /api/v1/soal/:id", () => {
        (0, vitest_1.it)("kembalikan 404 jika ID tidak ditemukan saat delete", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete("/api/v1/soal/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${token}`);
            (0, vitest_1.expect)(res.status).toBe(404);
        });
        (0, vitest_1.it)("berhasil menghapus soal", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/soal/${createdSoalId}`)
                .set("Authorization", `Bearer ${token}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            const getRes = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/soal/${createdSoalId}`)
                .set("Authorization", `Bearer ${token}`);
            (0, vitest_1.expect)(getRes.status).toBe(404);
        });
    });
});
