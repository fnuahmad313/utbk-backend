import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import * as SoalController from "./soal.controller";

const router = Router();

router.get("/", authenticate as any, SoalController.getSoal as any);
router.get("/:id", authenticate as any, SoalController.getSoalById as any);
router.post("/", authenticate as any, SoalController.createSoal as any);
router.put("/:id", authenticate as any, SoalController.updateSoal as any);
router.delete("/:id", authenticate as any, SoalController.deleteSoal as any);

export default router;
