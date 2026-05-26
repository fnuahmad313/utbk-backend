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
vitest_1.vi.mock("../config/supabase", () => ({
    supabase: {
        auth: {
            signUp: vitest_1.vi.fn().mockImplementation(async ({ email, password }) => {
                return {
                    data: { user: { id: "test-siswa-auth-uuid", email } },
                    error: null,
                };
            }),
            signInWithPassword: vitest_1.vi
                .fn()
                .mockImplementation(async ({ email, password }) => {
                if (email === "tidakada@utbk.dev") {
                    return {
                        data: { user: null, session: null },
                        error: new Error("User not found"),
                    };
                }
                if (password === "wrongpassword") {
                    return {
                        data: { user: null, session: null },
                        error: new Error("Invalid credentials"),
                    };
                }
                return {
                    data: {
                        user: { id: "test-siswa-auth-uuid", email },
                        session: {
                            access_token: "siswa-token-auth",
                            refresh_token: "mock-refresh-token",
                        },
                    },
                    error: null,
                };
            }),
        },
    },
    supabaseAdmin: {
        auth: {
            getUser: vitest_1.vi.fn().mockImplementation(async (token) => {
                if (token === "admin-token") {
                    return {
                        data: { user: { id: "test-admin-uuid", email: "admin@utbk.dev" } },
                        error: null,
                    };
                }
                if (token === "siswa-token-auth") {
                    return {
                        data: {
                            user: { id: "test-siswa-auth-uuid", email: "siswa@utbk.dev" },
                        },
                        error: null,
                    };
                }
                return { data: { user: null }, error: new Error("Token tidak valid") };
            }),
            admin: {
                signOut: vitest_1.vi.fn().mockResolvedValue({ error: null }),
            },
        },
    },
}));
let accessToken;
const testEmail = `test_${Date.now()}@utbk.dev`;
const testPassword = "Password123!";
const testName = "Siswa Test";
(0, vitest_1.describe)("Auth Endpoints", () => {
    (0, vitest_1.beforeAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../config/prisma")));
        await prisma.user.upsert({
            where: { id: "test-admin-uuid" },
            update: {},
            create: {
                id: "test-admin-uuid",
                email: "admin@utbk.dev",
                name: "Test Admin",
                role: "ADMIN",
            },
        });
        await prisma.user.upsert({
            where: { id: "test-siswa-auth-uuid" },
            update: {},
            create: {
                id: "test-siswa-auth-uuid",
                email: "siswa@utbk.dev",
                name: "Test Siswa",
                role: "SISWA",
            },
        });
    });
    (0, vitest_1.afterAll)(async () => {
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../config/prisma")));
        await prisma.user.deleteMany({
            where: {
                id: { in: ["test-admin-uuid", "test-siswa-auth-uuid"] },
            },
        });
    });
    (0, vitest_1.describe)("POST /api/v1/auth/register", () => {
        (0, vitest_1.it)("berhasil register dengan data valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/v1/auth/register").send({
                email: testEmail,
                password: testPassword,
                name: testName,
            });
            (0, vitest_1.expect)(res.status).toBe(201);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
            (0, vitest_1.expect)(res.body).toHaveProperty("user");
        });
        (0, vitest_1.it)("gagal register jika email sudah dipakai", async () => {
            const { supabase } = await Promise.resolve().then(() => __importStar(require("../config/supabase")));
            const originalSignUp = supabase.auth.signUp;
            supabase.auth.signUp = vitest_1.vi.fn().mockImplementation(async () => {
                return {
                    data: { user: null },
                    error: new Error("User already registered"),
                };
            });
            const res = await (0, supertest_1.default)(app_1.default).post("/api/v1/auth/register").send({
                email: testEmail,
                password: testPassword,
                name: testName,
            });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
            supabase.auth.signUp = originalSignUp;
        });
        (0, vitest_1.it)("gagal register jika body kosong", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/v1/auth/register").send({});
            (0, vitest_1.expect)(res.status).toBe(400);
        });
        (0, vitest_1.it)("gagal register jika password terlalu pendek", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/v1/auth/register")
                .send({
                email: `short_${Date.now()}@utbk.dev`,
                password: "123",
                name: "Test",
            });
            (0, vitest_1.expect)(res.status).toBe(400);
        });
    });
    (0, vitest_1.describe)("POST /api/v1/auth/login", () => {
        (0, vitest_1.it)("berhasil login dengan kredensial valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/v1/auth/login").send({
                email: "siswa@utbk.dev",
                password: testPassword,
            });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty("access_token");
            (0, vitest_1.expect)(res.body).toHaveProperty("refresh_token");
            accessToken = res.body.access_token;
        });
        (0, vitest_1.it)("gagal login dengan password salah", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/v1/auth/login").send({
                email: "siswa@utbk.dev",
                password: "wrongpassword",
            });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("gagal login dengan email tidak terdaftar", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/v1/auth/login").send({
                email: "tidakada@utbk.dev",
                password: testPassword,
            });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("gagal login jika body kosong", async () => {
            const res = await (0, supertest_1.default)(app_1.default).post("/api/v1/auth/login").send({});
            (0, vitest_1.expect)(res.status).toBe(400);
        });
    });
    (0, vitest_1.describe)("GET /api/v1/auth/me", () => {
        (0, vitest_1.it)("gagal akses tanpa token", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/v1/auth/me");
            (0, vitest_1.expect)(res.status).toBe(401);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("gagal akses dengan token invalid", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/auth/me")
                .set("Authorization", "Bearer token_palsu_tidak_valid");
            (0, vitest_1.expect)(res.status).toBe(401);
        });
        (0, vitest_1.it)("berhasil akses dengan token valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get("/api/v1/auth/me")
                .set("Authorization", `Bearer ${accessToken}`);
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty("data");
            (0, vitest_1.expect)(res.body.data).toHaveProperty("id");
            (0, vitest_1.expect)(res.body.data).toHaveProperty("email");
            (0, vitest_1.expect)(res.body.data).toHaveProperty("role");
        });
    });
    (0, vitest_1.describe)("PATCH /api/v1/auth/role", () => {
        (0, vitest_1.it)("gagal jika role bukan admin (403)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch("/api/v1/auth/role")
                .set("Authorization", "Bearer siswa-token-auth")
                .send({ userId: "test-siswa-auth-uuid", role: "ADMIN" });
            (0, vitest_1.expect)(res.status).toBe(403);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("gagal jika userId atau role tidak dikirim (400)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch("/api/v1/auth/role")
                .set("Authorization", "Bearer admin-token")
                .send({});
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("gagal jika role tidak valid (400)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch("/api/v1/auth/role")
                .set("Authorization", "Bearer admin-token")
                .send({ userId: "test-siswa-auth-uuid", role: "SUPERADMIN" });
            (0, vitest_1.expect)(res.status).toBe(400);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("gagal jika userId tidak ditemukan (404)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch("/api/v1/auth/role")
                .set("Authorization", "Bearer admin-token")
                .send({
                userId: "00000000-0000-0000-0000-000000000000",
                role: "ADMIN",
            });
            (0, vitest_1.expect)(res.status).toBe(404);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
        (0, vitest_1.it)("berhasil mengubah role user (200)", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch("/api/v1/auth/role")
                .set("Authorization", "Bearer admin-token")
                .send({ userId: "test-siswa-auth-uuid", role: "ADMIN" });
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
            (0, vitest_1.expect)(res.body).toHaveProperty("data");
            (0, vitest_1.expect)(res.body.data.role).toBe("ADMIN");
        });
    });
});
