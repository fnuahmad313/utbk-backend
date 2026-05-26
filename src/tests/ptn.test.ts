import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app";

// Mock Supabase — tidak butuh koneksi internet atau akun real
vi.mock("../config/supabase", () => ({
  supabase: { auth: { signUp: vi.fn(), signInWithPassword: vi.fn() } },
  supabaseAdmin: {
    auth: {
      getUser: vi.fn().mockImplementation(async (token: string) => {
        if (token === "admin-token") {
          return { data: { user: { id: "test-ptn-admin-uuid", email: "adminptn@utbk.dev" } }, error: null }
        }
        if (token === "siswa-token") {
          return { data: { user: { id: "test-ptn-siswa-uuid", email: "siswaptn@utbk.dev" } }, error: null }
        }
        return { data: { user: null }, error: new Error("Token tidak valid") }
      })
    }
  }
}));

describe("PTN & Jurusan Module Integration Tests", () => {
  let testPtnId: string;
  let testJurusanId: string;
  const adminToken = "admin-token";
  const siswaToken = "siswa-token";

  beforeAll(async () => {
    const { prisma } = await import("../config/prisma");

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

  afterAll(async () => {
    const { prisma } = await import("../config/prisma");

    // Clean up cascaded or specifically named test departments and universities
    await prisma.jurusan.deleteMany({ where: { ptn: { nama: { startsWith: "Test PTN" } } } });
    await prisma.pTN.deleteMany({ where: { nama: { startsWith: "Test PTN" } } });
    await prisma.user.deleteMany({ where: { id: { in: ["test-ptn-admin-uuid", "test-ptn-siswa-uuid"] } } });
  });

  // ==========================================
  // POST /api/v1/ptn
  // ==========================================
  describe("POST /api/v1/ptn", () => {
    it("gagal jika bukan admin (403)", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(403);
    });

    it("gagal jika body tidak valid (400)", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(400);
    });

    it("gagal jika tipe tidak valid (400)", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("berhasil membuat PTN baru (201)", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.nama).toBe("Test PTN Universitas Indonesia");
      testPtnId = res.body.data.id;
    });
  });

  // ==========================================
  // GET /api/v1/ptn
  // ==========================================
  describe("GET /api/v1/ptn", () => {
    it("gagal tanpa token (401)", async () => {
      const res = await request(app).get("/api/v1/ptn");
      expect(res.status).toBe(401);
    });

    it("berhasil mendapatkan daftar PTN", async () => {
      const res = await request(app)
        .get("/api/v1/ptn")
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("berhasil filter by provinsi", async () => {
      const res = await request(app)
        .get("/api/v1/ptn?provinsi=Jawa Barat")
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((p: any) => p.provinsi === "Jawa Barat")).toBe(true);
    });

    it("berhasil search by nama atau singkatan", async () => {
      const res = await request(app)
        .get("/api/v1/ptn?search=UI-TEST")
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].singkatan).toBe("UI-TEST");
    });
  });

  // ==========================================
  // GET /api/v1/ptn/:id
  // ==========================================
  describe("GET /api/v1/ptn/:id", () => {
    it("berhasil mendapatkan detail PTN beserta jurusan", async () => {
      const res = await request(app)
        .get(`/api/v1/ptn/${testPtnId}`)
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testPtnId);
      expect(res.body.data).toHaveProperty("jurusans");
      expect(Array.isArray(res.body.data.jurusans)).toBe(true);
    });

    it("kembalikan 404 jika PTN tidak ditemukan", async () => {
      const res = await request(app)
        .get("/api/v1/ptn/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("tidak ditemukan");
    });
  });

  // ==========================================
  // PUT /api/v1/ptn/:id
  // ==========================================
  describe("PUT /api/v1/ptn/:id", () => {
    it("berhasil update PTN", async () => {
      const res = await request(app)
        .put(`/api/v1/ptn/${testPtnId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          kota: "Jakarta Selatan",
          singkatan: "UI-TESTED"
        });

      expect(res.status).toBe(200);
      expect(res.body.data.kota).toBe("Jakarta Selatan");
      expect(res.body.data.singkatan).toBe("UI-TESTED");
    });

    it("gagal jika bukan admin (403)", async () => {
      const res = await request(app)
        .put(`/api/v1/ptn/${testPtnId}`)
        .set("Authorization", `Bearer ${siswaToken}`)
        .send({
          kota: "Surabaya"
        });

      expect(res.status).toBe(403);
    });

    it("kembalikan 404 jika PTN tidak ditemukan", async () => {
      const res = await request(app)
        .put("/api/v1/ptn/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          kota: "Bandung"
        });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // POST /api/v1/ptn/jurusan
  // ==========================================
  describe("POST /api/v1/ptn/jurusan", () => {
    it("gagal jika bukan admin (403)", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(403);
    });

    it("gagal jika kelompok tidak valid (400)", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(400);
    });

    it("gagal jika jenjang tidak valid (400)", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(400);
    });

    it("gagal jika ptnId tidak valid (404)", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(404);
    });

    it("berhasil membuat Jurusan baru (201)", async () => {
      const res = await request(app)
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

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.nama).toBe("Test PTN Ilmu Komputer");
      testJurusanId = res.body.data.id;
    });
  });

  // ==========================================
  // GET /api/v1/ptn/jurusan
  // ==========================================
  describe("GET /api/v1/ptn/jurusan", () => {
    it("berhasil mendapatkan daftar semua jurusan", async () => {
      const res = await request(app)
        .get("/api/v1/ptn/jurusan")
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("berhasil filter by kelompok SAINTEK", async () => {
      const res = await request(app)
        .get("/api/v1/ptn/jurusan?kelompok=SAINTEK")
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((j: any) => j.kelompok === "SAINTEK")).toBe(true);
    });

    it("berhasil search by nama jurusan", async () => {
      const res = await request(app)
        .get("/api/v1/ptn/jurusan?search=Test PTN Ilmu Komputer")
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].nama).toBe("Test PTN Ilmu Komputer");
    });
  });

  // ==========================================
  // GET /api/v1/ptn/jurusan/:id
  // ==========================================
  describe("GET /api/v1/ptn/jurusan/:id", () => {
    it("berhasil mendapatkan detail jurusan beserta data PTN", async () => {
      const res = await request(app)
        .get(`/api/v1/ptn/jurusan/${testJurusanId}`)
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testJurusanId);
      expect(res.body.data).toHaveProperty("ptn");
      expect(res.body.data.ptn.id).toBe(testPtnId);
    });

    it("kembalikan 404 jika jurusan tidak ditemukan", async () => {
      const res = await request(app)
        .get("/api/v1/ptn/jurusan/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // GET /api/v1/ptn/:ptnId/jurusan
  // ==========================================
  describe("GET /api/v1/ptn/:ptnId/jurusan", () => {
    it("berhasil mendapatkan jurusan dari PTN tertentu", async () => {
      const res = await request(app)
        .get(`/api/v1/ptn/${testPtnId}/jurusan`)
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].ptnId).toBe(testPtnId);
    });

    it("kembalikan 404 jika PTN tidak ditemukan", async () => {
      const res = await request(app)
        .get("/api/v1/ptn/00000000-0000-0000-0000-000000000000/jurusan")
        .set("Authorization", `Bearer ${siswaToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // PUT /api/v1/ptn/jurusan/:id
  // ==========================================
  describe("PUT /api/v1/ptn/jurusan/:id", () => {
    it("berhasil update jurusan", async () => {
      const res = await request(app)
        .put(`/api/v1/ptn/jurusan/${testJurusanId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nama: "Test PTN Ilmu Komputer Updated",
          dayaTampung: 100
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nama).toBe("Test PTN Ilmu Komputer Updated");
      expect(res.body.data.dayaTampung).toBe(100);
    });

    it("kembalikan 404 jika jurusan tidak ditemukan", async () => {
      const res = await request(app)
        .put("/api/v1/ptn/jurusan/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nama: "Apapun"
        });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // DELETE /api/v1/ptn/jurusan/:id
  // ==========================================
  describe("DELETE /api/v1/ptn/jurusan/:id", () => {
    it("berhasil hapus jurusan", async () => {
      const res = await request(app)
        .delete(`/api/v1/ptn/jurusan/${testJurusanId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify not found after deletion
      const getRes = await request(app)
        .get(`/api/v1/ptn/jurusan/${testJurusanId}`)
        .set("Authorization", `Bearer ${siswaToken}`);
      expect(getRes.status).toBe(404);
    });

    it("kembalikan 404 jika jurusan tidak ditemukan", async () => {
      const res = await request(app)
        .delete("/api/v1/ptn/jurusan/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // DELETE /api/v1/ptn/:id
  // ==========================================
  describe("DELETE /api/v1/ptn/:id", () => {
    it("berhasil hapus PTN beserta semua jurusannya", async () => {
      // 1. Create a quick new department inside our test PTN to verify cascading delete
      const createJurusanRes = await request(app)
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
      expect(createJurusanRes.status).toBe(201);
      const tempJurusanId = createJurusanRes.body.data.id;

      // 2. Delete the PTN
      const deletePtnRes = await request(app)
        .delete(`/api/v1/ptn/${testPtnId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(deletePtnRes.status).toBe(200);

      // 3. Verify PTN is deleted
      const getPtnRes = await request(app)
        .get(`/api/v1/ptn/${testPtnId}`)
        .set("Authorization", `Bearer ${siswaToken}`);
      expect(getPtnRes.status).toBe(404);

      // 4. Verify department inside the PTN is also deleted
      const getJurusanRes = await request(app)
        .get(`/api/v1/ptn/jurusan/${tempJurusanId}`)
        .set("Authorization", `Bearer ${siswaToken}`);
      expect(getJurusanRes.status).toBe(404);
    });

    it("kembalikan 404 jika PTN tidak ditemukan", async () => {
      const res = await request(app)
        .delete(`/api/v1/ptn/${testPtnId}`) // Since it was just deleted
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
