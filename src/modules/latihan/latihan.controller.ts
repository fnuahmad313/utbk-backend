import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import * as LatihanService from "./latihan.service";

const allowedMapel = ["TPS", "TKA_SAINTEK", "TKA_SOSHUM"];

export const startSession = async (req: AuthRequest, res: Response) => {
  try {
    const { mapel, jumlah } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Token tidak valid" });
      return;
    }

    if (!mapel || !allowedMapel.includes(mapel)) {
      res.status(400).json({ message: "Mapel tidak valid, harus TPS, TKA_SAINTEK, atau TKA_SOSHUM" });
      return;
    }

    if (
      jumlah === undefined ||
      typeof jumlah !== "number" ||
      !Number.isInteger(jumlah) ||
      jumlah < 1 ||
      jumlah > 40
    ) {
      res.status(400).json({ message: "Jumlah soal tidak valid, harus antara 1 dan 40" });
      return;
    }

    const result = await LatihanService.startSession({
      userId,
      mapel,
      jumlah,
    });

    if ("error" in result) {
      if (result.error === "no_questions_found") {
        res.status(400).json({ message: "Tidak ada soal tersedia untuk mata pelajaran ini" });
        return;
      }
      res.status(400).json({ message: result.error });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const submitSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { jawabans } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Token tidak valid" });
      return;
    }

    if (!jawabans || !Array.isArray(jawabans)) {
      res.status(400).json({ message: "Jawabans harus berupa array" });
      return;
    }

    const allowedAnswers = ["A", "B", "C", "D", "E"];
    for (const item of jawabans) {
      if (!item.soalId || typeof item.soalId !== "string") {
        res.status(400).json({ message: "Setiap item jawaban wajib memiliki soalId berupa string" });
        return;
      }
      if (!item.jawaban || !allowedAnswers.includes(item.jawaban)) {
        res.status(400).json({ message: "Setiap item jawaban wajib memiliki jawaban yang valid (A-E)" });
        return;
      }
    }

    const result = await LatihanService.submitSession({
      userId,
      sessionId: sessionId as string,
      jawabans,
    });

    if ("error" in result) {
      if (result.error === "session_not_found") {
        res.status(404).json({ message: "Sesi latihan tidak ditemukan" });
        return;
      }
      if (result.error === "unauthorized_session") {
        res.status(403).json({ message: "Anda tidak memiliki akses ke sesi ini" });
        return;
      }
      if (result.error === "session_already_completed") {
        res.status(400).json({ message: "Sesi latihan sudah selesai" });
        return;
      }
      if (result.error === "empty_answers") {
        res.status(400).json({ message: "Jawaban tidak boleh kosong" });
        return;
      }
      if (result.error && result.error.startsWith("soal_not_found")) {
        res.status(400).json({ message: "Beberapa Soal ID tidak valid atau tidak ditemukan" });
        return;
      }
      res.status(400).json({ message: result.error });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRiwayat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Token tidak valid" });
      return;
    }

    const result = await LatihanService.getRiwayat(userId);
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSessionDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Token tidak valid" });
      return;
    }

    const result = await LatihanService.getSessionDetail(userId, sessionId as string);

    if ("error" in result) {
      if (result.error === "session_not_found") {
        res.status(404).json({ message: "Sesi latihan tidak ditemukan" });
        return;
      }
      if (result.error === "unauthorized_session") {
        res.status(403).json({ message: "Anda tidak memiliki akses ke sesi ini" });
        return;
      }
      res.status(400).json({ message: result.error });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
