import { TipeSoal } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface SoalFilter {
  mapel?: string;
  tingkat?: string;
}

export interface SoalInput {
  pertanyaan: string;
  tipe: TipeSoal;
  opsi: any;
  jawaban: any;
  pembahasan?: string;
  mapel: string;
  tingkat: string;
}

const selectWithoutJawaban = {
  id: true,
  pertanyaan: true,
  tipe: true,
  opsi: true,
  pembahasan: true,
  mapel: true,
  tingkat: true,
  createdAt: true,
};

export const getSoal = async (filter: SoalFilter) => {
  return prisma.soal.findMany({
    where: {
      ...(filter.mapel ? { mapel: filter.mapel } : {}),
      ...(filter.tingkat ? { tingkat: filter.tingkat } : {}),
    },
    select: selectWithoutJawaban,
  });
};

export const getSoalById = async (id: string) => {
  return prisma.soal.findUnique({
    where: { id },
    select: selectWithoutJawaban,
  });
};

export const createSoal = async (data: SoalInput) => {
  const created = await prisma.soal.create({ data });
  const { jawaban, ...rest } = created;
  return rest;
};

export const updateSoal = async (id: string, data: Partial<SoalInput>) => {
  const updated = await prisma.soal.update({
    where: { id },
    data,
  });
  const { jawaban, ...rest } = updated;
  return rest;
};

export const deleteSoal = async (id: string) => {
  const deleted = await prisma.soal.delete({
    where: { id },
  });
  const { jawaban, ...rest } = deleted;
  return rest;
};