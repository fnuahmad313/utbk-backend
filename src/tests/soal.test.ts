import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app";

// Mock Supabase — tidak butuh koneksi internet atau akun real
vi.mock("../config/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
  supabaseAdmin: {
    auth: {
      getUser: vi.fn().mockImplementation(async (token: string) => {
        if (token === "valid-token") {
          return {
            data: { user: { id: "test-user-soal-uuid", email: "testsoal@utbk.dev" } },
            error: null,
          };
        }
        return { data: { user: null }, error: new Error("Token tidak valid") };
      }),
    },
  },
}));

describe("Soal Module", () => {
  const token = "valid-token";
  let createdSoalId: string;

  // Cleanup setelah semua test selesai
  afterAll(async () => {
    const { prisma } = await import("../config/prisma");
    await prisma.jawabanSiswa.deleteMany({
      where: { session: { userId: "test-user-soal-uuid" } },
    });
    await prisma.latihanSession.deleteMany({
      where: { userId: "test-user-soal-uuid" },
    });
    await prisma.soal.deleteMany({
      where: { pertanyaan: { startsWith: "Test Pertanyaan" } },
    });
  });

  // ===========================
  // POST /api/v1/soal
  // ===========================
  describe("POST /api/v1/soal", () => {
    it("gagal tanpa token authentication", async () => {
      const res = await request(app)
        .post("/api/v1/soal")
        .send({
          pertanyaan: "Test Pertanyaan 1",
          opsi: { A: "A", B: "B", C: "C", D: "D", E: "E" },
          jawaban: "A",
          mapel: "TPS",
          tingkat: "mudah",
        });
      expect(res.status).toBe(401);
    });

    it("gagal jika parameter body tidak valid", async () => {
      const res = await request(app)
        .post("/api/v1/soal")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pertanyaan: "",
          opsi: { A: "A" },
          jawaban: "Z",
          mapel: "TPS_INVALID",
          tingkat: "sangat_sulit",
        });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("berhasil membuat soal baru dengan data valid", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.pertanyaan).toBe("Test Pertanyaan 1");
      expect(res.body.data).not.toHaveProperty("jawaban");

      createdSoalId = res.body.data.id;
    });
  });

  // ===========================
  // GET /api/v1/soal
  // ===========================
  describe("GET /api/v1/soal", () => {
    it("berhasil mengambil semua soal", async () => {
      const res = await request(app)
        .get("/api/v1/soal")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((s: any) => {
        expect(s).not.toHaveProperty("jawaban");
      });
    });

    it("berhasil mengambil dengan filter mapel dan tingkat", async () => {
      const res = await request(app)
        .get("/api/v1/soal?mapel=TPS&tingkat=mudah")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((s: any) => {
        expect(s.mapel).toBe("TPS");
        expect(s.tingkat).toBe("mudah");
        expect(s).not.toHaveProperty("jawaban");
      });
    });

    it("gagal jika filter query tidak valid", async () => {
      const res = await request(app)
        .get("/api/v1/soal?mapel=INVALID")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  // ===========================
  // GET /api/v1/soal/:id
  // ===========================
  describe("GET /api/v1/soal/:id", () => {
    it("berhasil mengambil soal berdasarkan ID", async () => {
      const res = await request(app)
        .get(`/api/v1/soal/${createdSoalId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdSoalId);
      expect(res.body.data.pertanyaan).toBe("Test Pertanyaan 1");
      expect(res.body.data).not.toHaveProperty("jawaban");
    });

    it("kembalikan 404 jika ID tidak ditemukan", async () => {
      const res = await request(app)
        .get("/api/v1/soal/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ===========================
  // PUT /api/v1/soal/:id
  // ===========================
  describe("PUT /api/v1/soal/:id", () => {
    it("berhasil mengupdate soal", async () => {
      const res = await request(app)
        .put(`/api/v1/soal/${createdSoalId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ pertanyaan: "Test Pertanyaan 1 Updated", tingkat: "sedang" });

      expect(res.status).toBe(200);
      expect(res.body.data.pertanyaan).toBe("Test Pertanyaan 1 Updated");
      expect(res.body.data.tingkat).toBe("sedang");
      expect(res.body.data).not.toHaveProperty("jawaban");
    });

    it("gagal update dengan data body tidak valid", async () => {
      const res = await request(app)
        .put(`/api/v1/soal/${createdSoalId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ tingkat: "sangat_sulit" });

      expect(res.status).toBe(400);
    });

    it("kembalikan 404 jika ID tidak ditemukan saat update", async () => {
      const res = await request(app)
        .put("/api/v1/soal/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${token}`)
        .send({ pertanyaan: "Apapun" });

      expect(res.status).toBe(404);
    });
  });

  // ===========================
  // DELETE /api/v1/soal/:id
  // ===========================
  describe("DELETE /api/v1/soal/:id", () => {
    it("kembalikan 404 jika ID tidak ditemukan saat delete", async () => {
      const res = await request(app)
        .delete("/api/v1/soal/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("berhasil menghapus soal", async () => {
      const res = await request(app)
        .delete(`/api/v1/soal/${createdSoalId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/v1/soal/${createdSoalId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(getRes.status).toBe(404);
    });
  });
});