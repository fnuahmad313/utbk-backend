import { Router } from "express";
import * as InfoController from "./info.controller";

const router = Router();

router.get("/jalur", InfoController.getJalur as any);
router.get("/jalur/:slug", InfoController.getJalurBySlug as any);

export default router;
