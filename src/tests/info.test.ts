import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("Info PTN Module", () => {
  describe("GET /api/v1/info/jalur", () => {
    it("berhasil mengambil semua jalur masuk tanpa authentication token", async () => {
      const res = await request(app).get("/api/v1/info/jalur");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);

      const slugs = res.body.data.map((j: any) => j.slug);
      expect(slugs).toContain("snbt");
      expect(slugs).toContain("mandiri");
      expect(slugs).toContain("prestasi");
    });
  });

  describe("GET /api/v1/info/jalur/:slug", () => {
    it("berhasil mengambil detail jalur snbt dengan slug valid", async () => {
      const res = await request(app).get("/api/v1/info/jalur/snbt");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data.slug).toBe("snbt");
      expect(res.body.data.nama).toContain("SNBT");
      expect(Array.isArray(res.body.data.syarat)).toBe(true);
      expect(Array.isArray(res.body.data.tahapan)).toBe(true);
      expect(Array.isArray(res.body.data.tips)).toBe(true);
    });

    it("berhasil mengambil detail jalur mandiri dengan slug valid", async () => {
      const res = await request(app).get("/api/v1/info/jalur/mandiri");

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe("mandiri");
      expect(res.body.data.nama).toContain("Mandiri");
    });

    it("berhasil mengambil detail jalur prestasi dengan slug valid", async () => {
      const res = await request(app).get("/api/v1/info/jalur/prestasi");

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe("prestasi");
      expect(res.body.data.nama).toContain("Prestasi");
    });

    it("kembalikan 404 jika slug tidak ditemukan", async () => {
      const res = await request(app).get("/api/v1/info/jalur/jalur_palsu_tidak_ada");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message");
    });
  });
});
