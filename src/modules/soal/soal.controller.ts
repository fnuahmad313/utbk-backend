import { Request, Response } from "express";
import * as SoalService from "./soal.service";

const allowedMapel = ["TPS", "TKA_SAINTEK", "TKA_SOSHUM"];
const allowedTingkat = ["mudah", "sedang", "sulit"];
const allowedJawaban = ["A", "B", "C", "D", "E"];

export const getSoal = async (req: Request, res: Response) => {
  try {
    const { mapel, tingkat } = req.query;

    if (mapel && !allowedMapel.includes(mapel as string)) {
      res.status(400).json({ message: "Mapel tidak valid" });
      return;
    }

    if (tingkat && !allowedTingkat.includes(tingkat as string)) {
      res.status(400).json({ message: "Tingkat tidak valid" });
      return;
    }

    const result = await SoalService.getSoal({
      mapel: mapel as string,
      tingkat: tingkat as string,
    });

    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSoalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await SoalService.getSoalById(id as string);

    if (!result) {
      res.status(404).json({ message: "Soal tidak ditemukan" });
      return;
    }

    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createSoal = async (req: Request, res: Response) => {
  try {
    const { pertanyaan, opsi, jawaban, pembahasan, mapel, tingkat } = req.body;

    if (!pertanyaan || typeof pertanyaan !== "string" || pertanyaan.trim() === "") {
      res.status(400).json({ message: "Pertanyaan harus diisi dan berupa string" });
      return;
    }

    if (!opsi || typeof opsi !== "object" || Array.isArray(opsi)) {
      res.status(400).json({ message: "Opsi harus berupa object" });
      return;
    }

    const keys = ["A", "B", "C", "D", "E"];
    for (const key of keys) {
      if (!opsi[key] || typeof opsi[key] !== "string" || opsi[key].trim() === "") {
        res.status(400).json({ message: `Opsi ${key} harus diisi dan berupa string` });
        return;
      }
    }

    if (!jawaban || !allowedJawaban.includes(jawaban)) {
      res.status(400).json({ message: "Jawaban tidak valid, harus A, B, C, D, atau E" });
      return;
    }

    if (!mapel || !allowedMapel.includes(mapel)) {
      res.status(400).json({ message: "Mapel tidak valid, harus TPS, TKA_SAINTEK, atau TKA_SOSHUM" });
      return;
    }

    if (!tingkat || !allowedTingkat.includes(tingkat)) {
      res.status(400).json({ message: "Tingkat tidak valid, harus mudah, sedang, atau sulit" });
      return;
    }

    const result = await SoalService.createSoal({
      pertanyaan,
      opsi,
      jawaban,
      pembahasan,
      mapel,
      tingkat,
    });

    res.status(201).json({ message: "Berhasil dibuat", data: result });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pertanyaan, opsi, jawaban, pembahasan, mapel, tingkat } = req.body;

    const updateData: any = {};

    if (pertanyaan !== undefined) {
      if (typeof pertanyaan !== "string" || pertanyaan.trim() === "") {
        res.status(400).json({ message: "Pertanyaan harus berupa string" });
        return;
      }
      updateData.pertanyaan = pertanyaan;
    }

    if (opsi !== undefined) {
      if (typeof opsi !== "object" || Array.isArray(opsi)) {
        res.status(400).json({ message: "Opsi harus berupa object" });
        return;
      }
      const keys = ["A", "B", "C", "D", "E"];
      for (const key of keys) {
        if (!opsi[key] || typeof opsi[key] !== "string" || opsi[key].trim() === "") {
          res.status(400).json({ message: `Opsi ${key} harus diisi dan berupa string` });
          return;
        }
      }
      updateData.opsi = opsi;
    }

    if (jawaban !== undefined) {
      if (!allowedJawaban.includes(jawaban)) {
        res.status(400).json({ message: "Jawaban tidak valid" });
        return;
      }
      updateData.jawaban = jawaban;
    }

    if (mapel !== undefined) {
      if (!allowedMapel.includes(mapel)) {
        res.status(400).json({ message: "Mapel tidak valid" });
        return;
      }
      updateData.mapel = mapel;
    }

    if (tingkat !== undefined) {
      if (!allowedTingkat.includes(tingkat)) {
        res.status(400).json({ message: "Tingkat tidak valid" });
        return;
      }
      updateData.tingkat = tingkat;
    }

    if (pembahasan !== undefined) {
      updateData.pembahasan = pembahasan;
    }

    const result = await SoalService.updateSoal(id as string, updateData);
    res.json({ data: result });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Soal tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteSoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await SoalService.deleteSoal(id as string);
    res.json({ data: result });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Soal tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
