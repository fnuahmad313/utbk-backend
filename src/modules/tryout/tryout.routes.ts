import { Router } from "express";
import { requireRole } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client";
import * as TryoutController from "./tryout.controller";

const router = Router();

// BENAR — urutan ini wajib diikuti
router.get("/sesi/riwayat", requireRole(Role.SISWA) as any, TryoutController.getRiwayat as any);
router.get("/sesi/:sesiId/hasil", requireRole(Role.SISWA) as any, TryoutController.getHasil as any);
router.post("/sesi/:sesiId/submit-subtes", requireRole(Role.SISWA) as any, TryoutController.submitSubtes as any);
router.post("/sesi/:sesiId/selesai", requireRole(Role.SISWA) as any, TryoutController.selesaiTryout as any);
router.get("/", requireRole(Role.SISWA) as any, TryoutController.getTryoutList as any);
router.get("/:id", requireRole(Role.SISWA) as any, TryoutController.getTryoutById as any);
router.post("/", requireRole(Role.ADMIN) as any, TryoutController.createTryout as any);
router.post("/:id/subtes", requireRole(Role.ADMIN) as any, TryoutController.addSoalSubtes as any);
router.patch("/:id/status", requireRole(Role.ADMIN) as any, TryoutController.updateStatus as any);
router.delete("/:id", requireRole(Role.ADMIN) as any, TryoutController.deleteTryout as any);

export default router;
