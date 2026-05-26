"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRekomendasiJurusan = void 0;
const prisma_1 = require("../../config/prisma");
const round1 = (val) => Math.round(val * 10) / 10;
const VALID_KELOMPOK = ['SAINTEK', 'SOSHUM', 'CAMPURAN'];
const getRekomendasiJurusan = async (userId, kelompok, limit = 10) => {
    // Validate kelompok if provided
    if (kelompok && !VALID_KELOMPOK.includes(kelompok)) {
        return { error: 'invalid_kelompok' };
    }
    // Clamp limit
    if (limit < 1)
        limit = 1;
    if (limit > 50)
        limit = 50;
    // 1. Get average skorTotal from completed tryout sessions
    const sesiTryouts = await prisma_1.prisma.sesiTryout.findMany({
        where: {
            userId,
            status: { in: ['SUBMITTED', 'EXPIRED'] },
            skorTotal: { not: null },
        },
        select: { skorTotal: true },
    });
    if (sesiTryouts.length === 0) {
        return { error: 'no_tryout_data' };
    }
    const rataRataSkorTotal = round1(sesiTryouts.reduce((sum, s) => sum + (s.skorTotal ?? 0), 0) / sesiTryouts.length);
    // 2. Get all jurusan with passingGrade
    const whereClause = { passingGrade: { not: null } };
    if (kelompok) {
        whereClause.kelompok = kelompok;
    }
    const jurusans = await prisma_1.prisma.jurusan.findMany({
        where: whereClause,
        include: {
            ptn: {
                select: {
                    id: true,
                    nama: true,
                    singkatan: true,
                    kota: true,
                },
            },
        },
    });
    // 3. Calculate selisih and categorize
    const rekomendasi = jurusans.map((j) => {
        const selisih = round1(j.passingGrade - rataRataSkorTotal);
        let kategori;
        if (selisih <= -20) {
            kategori = 'aman';
        }
        else if (selisih <= 10) {
            kategori = 'kompetitif';
        }
        else {
            kategori = 'tantangan';
        }
        return {
            jurusanId: j.id,
            namaJurusan: j.nama,
            fakultas: j.fakultas,
            jenjang: j.jenjang,
            kelompok: j.kelompok,
            ptn: j.ptn,
            passingGrade: j.passingGrade,
            selisih,
            kategori,
        };
    });
    // 4. Sort: aman first → kompetitif → tantangan, within each category sort by selisih ascending
    const kategoriOrder = { aman: 0, kompetitif: 1, tantangan: 2 };
    rekomendasi.sort((a, b) => {
        const orderDiff = kategoriOrder[a.kategori] - kategoriOrder[b.kategori];
        if (orderDiff !== 0)
            return orderDiff;
        return a.selisih - b.selisih;
    });
    // 5. Apply limit
    const limited = rekomendasi.slice(0, limit);
    return {
        data: {
            skorReferensi: rataRataSkorTotal,
            totalRekomendasi: limited.length,
            rekomendasi: limited,
        },
    };
};
exports.getRekomendasiJurusan = getRekomendasiJurusan;
