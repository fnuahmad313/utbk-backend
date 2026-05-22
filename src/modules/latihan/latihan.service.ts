import { TipeSoal } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface StartSessionInput {
  userId: string;
  mapel: string;
  jumlah: number;
}

export interface SubmitAnswer {
  soalId: string;
  jawaban: any;
}

export interface SubmitSessionInput {
  userId: string;
  sessionId: string;
  jawabans: SubmitAnswer[];
}

const hitungBenar = (tipe: TipeSoal, kunci: any, jawaban: any): boolean => {
  switch (tipe) {
    case TipeSoal.SINGLE_CHOICE:
      return String(kunci).trim() === String(jawaban).trim()

    case TipeSoal.MULTIPLE_CHOICE:
      if (!Array.isArray(kunci) || !Array.isArray(jawaban)) return false
      if (kunci.length !== jawaban.length) return false
      const kunciSorted = [...kunci].sort()
      const jawabanSorted = [...jawaban].sort()
      return JSON.stringify(kunciSorted) === JSON.stringify(jawabanSorted)

    case TipeSoal.TRUE_FALSE:
      if (typeof kunci !== "object" || typeof jawaban !== "object") return false
      if (Array.isArray(kunci) || Array.isArray(jawaban)) return false
      return JSON.stringify(kunci) === JSON.stringify(jawaban)

    case TipeSoal.SHORT_ANSWER:
      return String(kunci).trim().toLowerCase() === String(jawaban).trim().toLowerCase()

    default:
      return false
  }
}

export const startSession = async (input: StartSessionInput) => {
  const { userId, mapel, jumlah } = input;

  const allSoal = await prisma.soal.findMany({
    where: { mapel },
    select: { id: true },
  });

  if (allSoal.length === 0) {
    return { error: "no_questions_found" };
  }

  const shuffled = [...allSoal];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const finalCount = Math.min(jumlah, shuffled.length);
  const selectedIds = shuffled.slice(0, finalCount).map((s) => s.id);

  const soalList = await prisma.soal.findMany({
    where: { id: { in: selectedIds } },
    select: {
      id: true,
      pertanyaan: true,
      tipe: true,
      opsi: true,
      pembahasan: true,
      mapel: true,
      tingkat: true,
      createdAt: true,
    },
  });

  const session = await prisma.latihanSession.create({
    data: {
      userId,
      mapel,
      selesai: false,
    },
  });

  return {
    data: {
      id: session.id,
      mapel: session.mapel,
      selesai: session.selesai,
      createdAt: session.createdAt,
      soal: soalList,
    },
  };
};

export const submitSession = async (input: SubmitSessionInput) => {
  const { userId, sessionId, jawabans } = input;

  const session = await prisma.latihanSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return { error: "session_not_found" };
  }

  if (session.userId !== userId) {
    return { error: "unauthorized_session" };
  }

  if (session.selesai) {
    return { error: "session_already_completed" };
  }

  const totalSoal = jawabans.length;
  if (totalSoal === 0) {
    return { error: "empty_answers" };
  }

  const soalIds = jawabans.map((j) => j.soalId);
  const soals = await prisma.soal.findMany({
    where: { id: { in: soalIds } },
  });

  const soalMap = new Map(soals.map((s) => [s.id, s]));

  let jumlahBenar = 0;
  const jawabanSiswaData = [];

  for (const item of jawabans) {
    const soal = soalMap.get(item.soalId);
    if (!soal) {
      return { error: `soal_not_found_${item.soalId}` };
    }

    const benar = hitungBenar(soal.tipe as TipeSoal, soal.jawaban, item.jawaban)
    if (benar) jumlahBenar++

    jawabanSiswaData.push({
      sessionId,
      soalId: item.soalId,
      jawaban: item.jawaban,
      benar,
    });
  }

  const skor = Math.round((jumlahBenar / totalSoal) * 100);

  await prisma.$transaction([
    prisma.jawabanSiswa.createMany({
      data: jawabanSiswaData,
    }),
    prisma.latihanSession.update({
      where: { id: sessionId },
      data: {
        skor,
        selesai: true,
      },
    }),
  ]);

  return {
    data: {
      skor,
      jumlahBenar,
      jumlahSalah: totalSoal - jumlahBenar,
      totalSoal,
    },
  };
};

export const getRiwayat = async (userId: string) => {
  return prisma.latihanSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getSessionDetail = async (userId: string, sessionId: string) => {
  const session = await prisma.latihanSession.findUnique({
    where: { id: sessionId },
    include: {
      jawabans: {
        include: {
          soal: true,
        },
      },
    },
  });

  if (!session) {
    return { error: "session_not_found" };
  }

  if (session.userId !== userId) {
    return { error: "unauthorized_session" };
  }

  const formattedJawabans = session.jawabans.map((j) => ({
    id: j.id,
    soalId: j.soalId,
    jawabanUser: j.jawaban,
    kunciJawaban: j.soal.jawaban,
    benar: j.benar,
    soal: {
      id: j.soal.id,
      pertanyaan: j.soal.pertanyaan,
      tipe: j.soal.tipe,
      opsi: j.soal.opsi,
      pembahasan: j.soal.pembahasan,
      mapel: j.soal.mapel,
      tingkat: j.soal.tingkat,
    },
  }));

  return {
    data: {
      id: session.id,
      mapel: session.mapel,
      skor: session.skor,
      selesai: session.selesai,
      createdAt: session.createdAt,
      jawabans: formattedJawabans,
    },
  };
};
