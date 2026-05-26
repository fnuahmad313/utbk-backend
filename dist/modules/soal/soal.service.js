"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSoal = exports.updateSoal = exports.createSoal = exports.getSoalById = exports.getSoal = void 0;
const prisma_1 = require("../../config/prisma");
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
const getSoal = async (filter) => {
    return prisma_1.prisma.soal.findMany({
        where: {
            ...(filter.mapel ? { mapel: filter.mapel } : {}),
            ...(filter.tingkat ? { tingkat: filter.tingkat } : {}),
        },
        select: selectWithoutJawaban,
    });
};
exports.getSoal = getSoal;
const getSoalById = async (id) => {
    return prisma_1.prisma.soal.findUnique({
        where: { id },
        select: selectWithoutJawaban,
    });
};
exports.getSoalById = getSoalById;
const createSoal = async (data) => {
    const created = await prisma_1.prisma.soal.create({ data });
    const { jawaban, ...rest } = created;
    return rest;
};
exports.createSoal = createSoal;
const updateSoal = async (id, data) => {
    const updated = await prisma_1.prisma.soal.update({
        where: { id },
        data,
    });
    const { jawaban, ...rest } = updated;
    return rest;
};
exports.updateSoal = updateSoal;
const deleteSoal = async (id) => {
    const deleted = await prisma_1.prisma.soal.delete({
        where: { id },
    });
    const { jawaban, ...rest } = deleted;
    return rest;
};
exports.deleteSoal = deleteSoal;
