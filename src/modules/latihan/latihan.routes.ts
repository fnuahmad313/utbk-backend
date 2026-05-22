import { Router } from "express";
import { requireRole } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client";
import * as LatihanController from "./latihan.controller";

const router = Router();

router.post("/mulai", requireRole(Role.SISWA) as any, LatihanController.startSession as any);
router.post("/:sessionId/submit", requireRole(Role.SISWA) as any, LatihanController.submitSession as any);
router.get("/riwayat", requireRole(Role.SISWA) as any, LatihanController.getRiwayat as any);
router.get("/:sessionId", requireRole(Role.SISWA) as any, LatihanController.getSessionDetail as any);

export default router;
