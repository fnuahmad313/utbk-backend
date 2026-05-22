import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import * as LatihanController from "./latihan.controller";

const router = Router();

router.post("/mulai", authenticate as any, LatihanController.startSession as any);
router.post("/:sessionId/submit", authenticate as any, LatihanController.submitSession as any);
router.get("/riwayat", authenticate as any, LatihanController.getRiwayat as any);
router.get("/:sessionId", authenticate as any, LatihanController.getSessionDetail as any);

export default router;
