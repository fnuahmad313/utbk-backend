import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import soalRoutes from "../modules/soal/soal.routes";
import latihanRoutes from "../modules/latihan/latihan.routes";
import infoRoutes from "../modules/info/info.routes";
import tryoutRoutes from "../modules/tryout/tryout.routes";
import ptnRoutes from "../modules/ptn/ptn.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import rekomendasiRoutes from "../modules/rekomendasi/rekomendasi.routes";
import forumRoutes from "../modules/forum/forum.routes";
import notifikasiRoutes from "../modules/notifikasi/notifikasi.routes";
import aiRoutes from "../modules/ai/ai.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/soal", soalRoutes);
router.use("/latihan", latihanRoutes);
router.use("/info", infoRoutes);
router.use("/tryout", tryoutRoutes);
router.use("/ptn", ptnRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/rekomendasi", rekomendasiRoutes);
router.use("/forum", forumRoutes);
router.use("/notifikasi", notifikasiRoutes);
router.use("/ai", aiRoutes);

export default router;
