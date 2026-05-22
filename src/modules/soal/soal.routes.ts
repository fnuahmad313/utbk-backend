import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client";
import * as SoalController from "./soal.controller";

const router = Router();

// GET — admin dan siswa boleh akses
router.get("/", authenticate as any, SoalController.getSoal as any);
router.get("/:id", authenticate as any, SoalController.getSoalById as any);

// CRUD — hanya admin
router.post("/", requireRole(Role.ADMIN) as any, SoalController.createSoal as any);
router.put("/:id", requireRole(Role.ADMIN) as any, SoalController.updateSoal as any);
router.delete("/:id", requireRole(Role.ADMIN) as any, SoalController.deleteSoal as any);

export default router;
