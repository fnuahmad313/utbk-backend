import { Request, Response } from "express";
import * as SoalService from "./soal.service";

const allowedMapel = ["TPS", "TKA_SAINTEK", "TKA_SOSHUM"];
const allowedTingkat = ["mudah", "sedang", "sulit"];
const allowedTipeSoal = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"];
const allowedOpsiKey = ["A", "B", "C", "D", "E"];

const validateJawaban = (tipe: string, jawaban: any, opsi: any): string | null => {
  switch (tipe) {
    case "SINGLE_CHOICE":
      if (!jawaban || !allowedOpsiKey.includes(jawaban)) {
        return "Jawaban SINGLE_CHOICE harus berupa string A, B, C, D, atau E";
      }
      return null;

    case "MULTIPLE_CHOICE":
      if (!Array.isArray(jawaban) || jawaban.length === 0) {
        return "Jawaban MULTIPLE_CHOICE harus berupa array dan tidak boleh kosong";
      }
      for (const j of jawaban) {
        if (!allowedOpsiKey.includes(j)) {
          return "Setiap jawaban MULTIPLE_CHOICE harus A, B, C, D, atau E";
        }
      }
      return null;

    case "TRUE_FALSE":
      if (typeof jawaban !== "object" || Array.isArray(jawaban) || jawaban === null) {
        return "Jawaban TRUE_FALSE harus berupa object { '0': true, '1': false, ... }";
      }
      if (Object.keys(jawaban).length === 0) {
        return "Jawaban TRUE_FALSE tidak boleh kosong";
      }
      for (const val of Object.values(jawaban)) {
        if (typeof val !== "boolean") {
          return "Setiap nilai jawaban TRUE_FALSE harus berupa boolean";
        }
      }
      if (opsi && Object.keys(jawaban).length !== opsi.length) {
        return "Jumlah jawaban TRUE_FALSE harus sesuai dengan jumlah pernyataan di opsi";
      }
      return null;

    case "SHORT_ANSWER":
      if (jawaban === undefined || jawaban === null || String(jawaban).trim() === "") {
        return "Jawaban SHORT_ANSWER tidak boleh kosong";
      }
      return null;

    default:
      return "Tipe soal tidak valid";
  }
};

const validateOpsi = (tipe: string, opsi: any): string | null => {
  switch (tipe) {
    case "SINGLE_CHOICE":
    case "MULTIPLE_CHOICE":
      if (!opsi || typeof opsi !== "object" || Array.isArray(opsi)) {
        return "Opsi harus berupa object { A, B, C, D, E }";
      }
      for (const key of allowedOpsiKey) {
        if (!opsi[key] || typeof opsi[key] !== "string" || opsi[key].trim() === "") {
          return `Opsi ${key} harus diisi dan berupa string`;
        }
      }
      return null;

    case "TRUE_FALSE":
      if (!Array.isArray(opsi) || opsi.length === 0) {
        return "Opsi TRUE_FALSE harus berupa array pernyataan dan tidak boleh kosong";
      }
      for (const item of opsi) {
        if (typeof item !== "string" || item.trim() === "") {
          return "Setiap pernyataan di opsi TRUE_FALSE harus berupa string";
        }
      }
      return null;

    case "SHORT_ANSWER":
      if (opsi !== null && opsi !== undefined) {
        return "Opsi SHORT_ANSWER harus null atau tidak dikirim";
      }
      return null;

    default:
      return "Tipe soal tidak valid";
  }
};

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
    const { pertanyaan, tipe = "SINGLE_CHOICE", opsi = null, jawaban, pembahasan, mapel, tingkat } = req.body;

    if (!pertanyaan || typeof pertanyaan !== "string" || pertanyaan.trim() === "") {
      res.status(400).json({ message: "Pertanyaan harus diisi dan berupa string" });
      return;
    }

    if (!allowedTipeSoal.includes(tipe)) {
      res.status(400).json({ message: "Tipe soal tidak valid. Gunakan SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, atau SHORT_ANSWER" });
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

    const opsiError = validateOpsi(tipe, opsi);
    if (opsiError) {
      res.status(400).json({ message: opsiError });
      return;
    }

    const jawabanError = validateJawaban(tipe, jawaban, opsi);
    if (jawabanError) {
      res.status(400).json({ message: jawabanError });
      return;
    }

    const result = await SoalService.createSoal({
      pertanyaan,
      tipe,
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
    const { pertanyaan, tipe, opsi, jawaban, pembahasan, mapel, tingkat } = req.body;

    const updateData: any = {};

    if (pertanyaan !== undefined) {
      if (typeof pertanyaan !== "string" || pertanyaan.trim() === "") {
        res.status(400).json({ message: "Pertanyaan harus berupa string" });
        return;
      }
      updateData.pertanyaan = pertanyaan;
    }

    if (tipe !== undefined) {
      if (!allowedTipeSoal.includes(tipe)) {
        res.status(400).json({ message: "Tipe soal tidak valid" });
        return;
      }
      updateData.tipe = tipe;
    }

    const resolvedTipe = tipe ?? "SINGLE_CHOICE";
    const resolvedOpsi = opsi ?? null;

    if (opsi !== undefined) {
      const opsiError = validateOpsi(resolvedTipe, resolvedOpsi);
      if (opsiError) {
        res.status(400).json({ message: opsiError });
        return;
      }
      updateData.opsi = opsi;
    }

    if (jawaban !== undefined) {
      const jawabanError = validateJawaban(resolvedTipe, jawaban, resolvedOpsi);
      if (jawabanError) {
        res.status(400).json({ message: jawabanError });
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