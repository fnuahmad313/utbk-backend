import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app";

// Mock Supabase — tidak butuh koneksi internet atau akun real
vi.mock("../config/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockImplementation(async ({ email, password }) => {
        return {
          data: { user: { id: "test-siswa-auth-uuid", email } },
          error: null,
        };
      }),
      signInWithPassword: vi.fn().mockImplementation(async ({ email, password }) => {
        if (email === "tidakada@utbk.dev") {
          return { data: { user: null, session: null }, error: new Error("User not found") };
        }
        if (password === "wrongpassword") {
          return { data: { user: null, session: null }, error: new Error("Invalid credentials") };
        }
        return {
          data: {
            user: { id: "test-siswa-auth-uuid", email },
            session: { access_token: "siswa-token-auth", refresh_token: "mock-refresh-token" }
          },
          error: null,
        };
      }),
    },
  },
  supabaseAdmin: {
    auth: {
      getUser: vi.fn().mockImplementation(async (token: string) => {
        if (token === "admin-token") {
          return {
            data: { user: { id: "test-admin-uuid", email: "admin@utbk.dev" } },
            error: null,
          };
        }
        if (token === "siswa-token-auth") {
          return {
            data: { user: { id: "test-siswa-auth-uuid", email: "siswa@utbk.dev" } },
            error: null,
          };
        }
        return { data: { user: null }, error: new Error("Token tidak valid") };
      }),
      admin: {
        signOut: vi.fn().mockResolvedValue({ error: null }),
      }
    },
  },
}));

let accessToken: string;
const testEmail = `test_${Date.now()}@utbk.dev`;
const testPassword = "Password123!";
const testName = "Siswa Test";

describe("Auth Endpoints", () => {
  beforeAll(async () => {
    const { prisma } = await import("../config/prisma");
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

  afterAll(async () => {
    const { prisma } = await import("../config/prisma");
    await prisma.user.deleteMany({
      where: {
        id: { in: ["test-admin-uuid", "test-siswa-auth-uuid"] },
      },
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("berhasil register dengan data valid", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: testEmail,
        password: testPassword,
        name: testName,
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("user");
    });

    it("gagal register jika email sudah dipakai", async () => {
      // Mock signUp to return error for duplicate email in this specific test
      const { supabase } = await import("../config/supabase");
      const originalSignUp = supabase.auth.signUp;
      supabase.auth.signUp = vi.fn().mockImplementation(async () => {
        return { data: { user: null }, error: new Error("User already registered") };
      });

      const res = await request(app).post("/api/v1/auth/register").send({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
      
      // Restore
      supabase.auth.signUp = originalSignUp;
    });

    it("gagal register jika body kosong", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({});

      expect(res.status).toBe(400);
    });

    it("gagal register jika password terlalu pendek", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `short_${Date.now()}@utbk.dev`,
          password: "123",
          name: "Test",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("berhasil login dengan kredensial valid", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "siswa@utbk.dev",
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("access_token");
      expect(res.body).toHaveProperty("refresh_token");
      accessToken = res.body.access_token;
    });

    it("gagal login dengan password salah", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "siswa@utbk.dev",
        password: "wrongpassword",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("gagal login dengan email tidak terdaftar", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "tidakada@utbk.dev",
        password: testPassword,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("gagal login jika body kosong", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({});

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("gagal akses tanpa token", async () => {
      const res = await request(app).get("/api/v1/auth/me");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    it("gagal akses dengan token invalid", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer token_palsu_tidak_valid");

      expect(res.status).toBe(401);
    });

    it("berhasil akses dengan token valid", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("email");
      expect(res.body.data).toHaveProperty("role");
    });
  });

  describe("PATCH /api/v1/auth/role", () => {
    it("gagal jika role bukan admin (403)", async () => {
      const res = await request(app)
        .patch("/api/v1/auth/role")
        .set("Authorization", "Bearer siswa-token-auth")
        .send({ userId: "test-siswa-auth-uuid", role: "ADMIN" });
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("message");
    });

    it("gagal jika userId atau role tidak dikirim (400)", async () => {
      const res = await request(app)
        .patch("/api/v1/auth/role")
        .set("Authorization", "Bearer admin-token")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("gagal jika role tidak valid (400)", async () => {
      const res = await request(app)
        .patch("/api/v1/auth/role")
        .set("Authorization", "Bearer admin-token")
        .send({ userId: "test-siswa-auth-uuid", role: "SUPERADMIN" });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("gagal jika userId tidak ditemukan (404)", async () => {
      const res = await request(app)
        .patch("/api/v1/auth/role")
        .set("Authorization", "Bearer admin-token")
        .send({ userId: "00000000-0000-0000-0000-000000000000", role: "ADMIN" });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message");
    });

    it("berhasil mengubah role user (200)", async () => {
      const res = await request(app)
        .patch("/api/v1/auth/role")
        .set("Authorization", "Bearer admin-token")
        .send({ userId: "test-siswa-auth-uuid", role: "ADMIN" });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("data");
      expect(res.body.data.role).toBe("ADMIN");
    });
  });
});
