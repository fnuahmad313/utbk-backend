"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
(0, vitest_1.describe)("Info PTN Module", () => {
    (0, vitest_1.describe)("GET /api/v1/info/jalur", () => {
        (0, vitest_1.it)("berhasil mengambil semua jalur masuk tanpa authentication token", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/v1/info/jalur");
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty("data");
            (0, vitest_1.expect)(Array.isArray(res.body.data)).toBe(true);
            (0, vitest_1.expect)(res.body.data.length).toBe(3);
            const slugs = res.body.data.map((j) => j.slug);
            (0, vitest_1.expect)(slugs).toContain("snbt");
            (0, vitest_1.expect)(slugs).toContain("mandiri");
            (0, vitest_1.expect)(slugs).toContain("prestasi");
        });
    });
    (0, vitest_1.describe)("GET /api/v1/info/jalur/:slug", () => {
        (0, vitest_1.it)("berhasil mengambil detail jalur snbt dengan slug valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/v1/info/jalur/snbt");
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body).toHaveProperty("data");
            (0, vitest_1.expect)(res.body.data.slug).toBe("snbt");
            (0, vitest_1.expect)(res.body.data.nama).toContain("SNBT");
            (0, vitest_1.expect)(Array.isArray(res.body.data.syarat)).toBe(true);
            (0, vitest_1.expect)(Array.isArray(res.body.data.tahapan)).toBe(true);
            (0, vitest_1.expect)(Array.isArray(res.body.data.tips)).toBe(true);
        });
        (0, vitest_1.it)("berhasil mengambil detail jalur mandiri dengan slug valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/v1/info/jalur/mandiri");
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.slug).toBe("mandiri");
            (0, vitest_1.expect)(res.body.data.nama).toContain("Mandiri");
        });
        (0, vitest_1.it)("berhasil mengambil detail jalur prestasi dengan slug valid", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/v1/info/jalur/prestasi");
            (0, vitest_1.expect)(res.status).toBe(200);
            (0, vitest_1.expect)(res.body.data.slug).toBe("prestasi");
            (0, vitest_1.expect)(res.body.data.nama).toContain("Prestasi");
        });
        (0, vitest_1.it)("kembalikan 404 jika slug tidak ditemukan", async () => {
            const res = await (0, supertest_1.default)(app_1.default).get("/api/v1/info/jalur/jalur_palsu_tidak_ada");
            (0, vitest_1.expect)(res.status).toBe(404);
            (0, vitest_1.expect)(res.body).toHaveProperty("message");
        });
    });
});
