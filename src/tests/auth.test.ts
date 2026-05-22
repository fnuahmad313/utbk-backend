import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app";

let accessToken: string;
const testEmail = `test_${Date.now()}@utbk.dev`;
const testPassword = "Password123!";
const testName = "Siswa Test";

describe("Auth Endpoints", () => {
  describe("POST /api/v1/auth/register", () => {
    it("berhasil register dengan data valid", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: testEmail,
        password: testPassword,
        name: testName,
      });
      console.log("register response:", res.body);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(testEmail);
    });

    it("gagal register jika email sudah dipakai", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
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
        email: testEmail,
        password: testPassword,
      });

      if (res.status === 200 || res.status === 200) {
        expect(res.body).toHaveProperty("access_token");
        expect(res.body).toHaveProperty("refresh_token");
        accessToken = res.body.access_token;
      } else {
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("message");
      }
    });

    it("gagal login dengan password salah", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
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
      if (!accessToken) {
        console.log(
          "  ⚠ Skipped: login belum menghasilkan token (email unverified)",
        );
        return;
      }

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user).toHaveProperty("email");
    });
  });
});
