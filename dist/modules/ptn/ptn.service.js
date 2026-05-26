"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJurusan = exports.updateJurusan = exports.createJurusan = exports.getJurusanById = exports.getJurusanList = exports.getJurusanByPTN = exports.deletePTN = exports.updatePTN = exports.createPTN = exports.getPTNById = exports.getPTNList = void 0;
const prisma_1 = require("../../config/prisma");
const ALLOWED_TIPES = ["Universitas", "Institut", "Politeknik", "Sekolah Tinggi"];
const ALLOWED_AKREDITASIS = ["Unggul", "Baik Sekali", "Baik", "A", "B", "C"];
const ALLOWED_JENJANGS = ["S1", "D3", "D4"];
const ALLOWED_KELOMPOKS = ["SAINTEK", "SOSHUM", "CAMPURAN"];
// getPTNList(filter: PTNFilter)
const getPTNList = async (filter) => {
    const whereClause = {};
    if (filter.provinsi) {
        whereClause.provinsi = filter.provinsi;
    }
    if (filter.tipe) {
        whereClause.tipe = filter.tipe;
    }
    if (filter.akreditasi) {
        whereClause.akreditasi = filter.akreditasi;
    }
    if (filter.search) {
        whereClause.OR = [
            { nama: { contains: filter.search, mode: 'insensitive' } },
            { singkatan: { contains: filter.search, mode: 'insensitive' } }
        ];
    }
    const result = await prisma_1.prisma.pTN.findMany({
        where: whereClause,
        include: {
            _count: {
                select: { jurusans: true }
            }
        },
        orderBy: {
            nama: 'asc'
        }
    });
    return { data: result };
};
exports.getPTNList = getPTNList;
// getPTNById(id: string)
const getPTNById = async (id) => {
    const ptn = await prisma_1.prisma.pTN.findUnique({
        where: { id },
        include: {
            jurusans: true
        }
    });
    if (!ptn) {
        return { error: 'ptn_not_found' };
    }
    return { data: ptn };
};
exports.getPTNById = getPTNById;
// createPTN(data: PTNInput)
const createPTN = async (data) => {
    const { nama, singkatan, kota, provinsi, akreditasi, tipe, website, logoUrl, deskripsi } = data;
    // Validasi field wajib
    if (!nama || !singkatan || !kota || !provinsi || !akreditasi || !tipe) {
        return { error: 'validation_error', message: 'Field nama, singkatan, kota, provinsi, akreditasi, dan tipe wajib diisi' };
    }
    // Validasi tipe
    if (!ALLOWED_TIPES.includes(tipe)) {
        return { error: 'validation_error', message: 'Tipe PTN tidak valid' };
    }
    // Validasi akreditasi
    if (!ALLOWED_AKREDITASIS.includes(akreditasi)) {
        return { error: 'validation_error', message: 'Akreditasi PTN tidak valid' };
    }
    const ptn = await prisma_1.prisma.pTN.create({
        data: {
            nama,
            singkatan,
            kota,
            provinsi,
            akreditasi,
            tipe,
            website,
            logoUrl,
            deskripsi
        }
    });
    return { data: ptn };
};
exports.createPTN = createPTN;
// updatePTN(id: string, data: Partial<PTNInput>)
const updatePTN = async (id, data) => {
    const { nama, singkatan, kota, provinsi, akreditasi, tipe, website, logoUrl, deskripsi } = data;
    // Validasi field yang diisi
    if (nama !== undefined && (!nama || nama.trim() === '')) {
        return { error: 'validation_error', message: 'Nama tidak boleh kosong' };
    }
    if (singkatan !== undefined && (!singkatan || singkatan.trim() === '')) {
        return { error: 'validation_error', message: 'Singkatan tidak boleh kosong' };
    }
    if (kota !== undefined && (!kota || kota.trim() === '')) {
        return { error: 'validation_error', message: 'Kota tidak boleh kosong' };
    }
    if (provinsi !== undefined && (!provinsi || provinsi.trim() === '')) {
        return { error: 'validation_error', message: 'Provinsi tidak boleh kosong' };
    }
    if (tipe !== undefined) {
        if (!ALLOWED_TIPES.includes(tipe)) {
            return { error: 'validation_error', message: 'Tipe PTN tidak valid' };
        }
    }
    if (akreditasi !== undefined) {
        if (!ALLOWED_AKREDITASIS.includes(akreditasi)) {
            return { error: 'validation_error', message: 'Akreditasi PTN tidak valid' };
        }
    }
    try {
        const ptn = await prisma_1.prisma.pTN.update({
            where: { id },
            data: {
                nama,
                singkatan,
                kota,
                provinsi,
                akreditasi,
                tipe,
                website,
                logoUrl,
                deskripsi
            }
        });
        return { data: ptn };
    }
    catch (error) {
        if (error.code === 'P2025') {
            return { error: 'ptn_not_found' };
        }
        throw error;
    }
};
exports.updatePTN = updatePTN;
// deletePTN(id: string)
const deletePTN = async (id) => {
    const ptn = await prisma_1.prisma.pTN.findUnique({
        where: { id }
    });
    if (!ptn) {
        return { error: 'ptn_not_found' };
    }
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.jurusan.deleteMany({
            where: { ptnId: id }
        }),
        prisma_1.prisma.pTN.delete({
            where: { id }
        })
    ]);
    return { message: 'PTN dan semua jurusan berhasil dihapus' };
};
exports.deletePTN = deletePTN;
// getJurusanByPTN(ptnId: string, filter: JurusanFilter)
const getJurusanByPTN = async (ptnId, filter) => {
    const ptn = await prisma_1.prisma.pTN.findUnique({
        where: { id: ptnId }
    });
    if (!ptn) {
        return { error: 'ptn_not_found' };
    }
    const whereClause = { ptnId };
    if (filter.kelompok) {
        whereClause.kelompok = filter.kelompok;
    }
    if (filter.jenjang) {
        whereClause.jenjang = filter.jenjang;
    }
    if (filter.search) {
        whereClause.OR = [
            { nama: { contains: filter.search, mode: 'insensitive' } },
            { fakultas: { contains: filter.search, mode: 'insensitive' } }
        ];
    }
    const result = await prisma_1.prisma.jurusan.findMany({
        where: whereClause,
        orderBy: {
            nama: 'asc'
        }
    });
    return { data: result };
};
exports.getJurusanByPTN = getJurusanByPTN;
// getJurusanList(filter: JurusanFilter)
const getJurusanList = async (filter) => {
    const whereClause = {};
    if (filter.kelompok) {
        whereClause.kelompok = filter.kelompok;
    }
    if (filter.jenjang) {
        whereClause.jenjang = filter.jenjang;
    }
    if (filter.search) {
        whereClause.OR = [
            { nama: { contains: filter.search, mode: 'insensitive' } },
            { fakultas: { contains: filter.search, mode: 'insensitive' } }
        ];
    }
    const result = await prisma_1.prisma.jurusan.findMany({
        where: whereClause,
        include: {
            ptn: {
                select: {
                    id: true,
                    nama: true,
                    singkatan: true,
                    kota: true
                }
            }
        },
        orderBy: {
            nama: 'asc'
        }
    });
    return { data: result };
};
exports.getJurusanList = getJurusanList;
// getJurusanById(id: string)
const getJurusanById = async (id) => {
    const jurusan = await prisma_1.prisma.jurusan.findUnique({
        where: { id },
        include: {
            ptn: true
        }
    });
    if (!jurusan) {
        return { error: 'jurusan_not_found' };
    }
    return { data: jurusan };
};
exports.getJurusanById = getJurusanById;
// createJurusan(data: JurusanInput)
const createJurusan = async (data) => {
    const { ptnId, nama, kode, fakultas, jenjang, kelompok, dayaTampung, passingGrade, deskripsi, prospekKerja } = data;
    // Validasi field wajib
    if (!ptnId || !nama || !kode || !fakultas || !jenjang || !kelompok) {
        return { error: 'validation_error', message: 'Field ptnId, nama, kode, fakultas, jenjang, dan kelompok wajib diisi' };
    }
    // Validasi jenjang
    if (!ALLOWED_JENJANGS.includes(jenjang)) {
        return { error: 'validation_error', message: 'Jenjang tidak valid' };
    }
    // Validasi kelompok
    if (!ALLOWED_KELOMPOKS.includes(kelompok)) {
        return { error: 'validation_error', message: 'Kelompok tidak valid' };
    }
    // Validasi PTN exist
    const ptn = await prisma_1.prisma.pTN.findUnique({
        where: { id: ptnId }
    });
    if (!ptn) {
        return { error: 'ptn_not_found' };
    }
    const jurusan = await prisma_1.prisma.jurusan.create({
        data: {
            ptnId,
            nama,
            kode,
            fakultas,
            jenjang,
            kelompok,
            dayaTampung: dayaTampung !== undefined ? Number(dayaTampung) : null,
            passingGrade: passingGrade !== undefined ? Number(passingGrade) : null,
            deskripsi,
            prospekKerja
        }
    });
    return { data: jurusan };
};
exports.createJurusan = createJurusan;
// updateJurusan(id: string, data: Partial<JurusanInput>)
const updateJurusan = async (id, data) => {
    const { ptnId, nama, kode, fakultas, jenjang, kelompok, dayaTampung, passingGrade, deskripsi, prospekKerja } = data;
    // Validasi field yang diisi
    if (nama !== undefined && (!nama || nama.trim() === '')) {
        return { error: 'validation_error', message: 'Nama tidak boleh kosong' };
    }
    if (kode !== undefined && (!kode || kode.trim() === '')) {
        return { error: 'validation_error', message: 'Kode tidak boleh kosong' };
    }
    if (fakultas !== undefined && (!fakultas || fakultas.trim() === '')) {
        return { error: 'validation_error', message: 'Fakultas tidak boleh kosong' };
    }
    if (jenjang !== undefined) {
        if (!ALLOWED_JENJANGS.includes(jenjang)) {
            return { error: 'validation_error', message: 'Jenjang tidak valid' };
        }
    }
    if (kelompok !== undefined) {
        if (!ALLOWED_KELOMPOKS.includes(kelompok)) {
            return { error: 'validation_error', message: 'Kelompok tidak valid' };
        }
    }
    if (ptnId !== undefined) {
        if (!ptnId || ptnId.trim() === '') {
            return { error: 'validation_error', message: 'ptnId tidak boleh kosong' };
        }
        const ptn = await prisma_1.prisma.pTN.findUnique({
            where: { id: ptnId }
        });
        if (!ptn) {
            return { error: 'ptn_not_found' };
        }
    }
    // Check if Jurusan exists
    const existing = await prisma_1.prisma.jurusan.findUnique({
        where: { id }
    });
    if (!existing) {
        return { error: 'jurusan_not_found' };
    }
    const updated = await prisma_1.prisma.jurusan.update({
        where: { id },
        data: {
            ptnId,
            nama,
            kode,
            fakultas,
            jenjang,
            kelompok,
            dayaTampung: dayaTampung !== undefined ? (dayaTampung === null ? null : Number(dayaTampung)) : undefined,
            passingGrade: passingGrade !== undefined ? (passingGrade === null ? null : Number(passingGrade)) : undefined,
            deskripsi,
            prospekKerja
        }
    });
    return { data: updated };
};
exports.updateJurusan = updateJurusan;
// deleteJurusan(id: string)
const deleteJurusan = async (id) => {
    const existing = await prisma_1.prisma.jurusan.findUnique({
        where: { id }
    });
    if (!existing) {
        return { error: 'jurusan_not_found' };
    }
    await prisma_1.prisma.jurusan.delete({
        where: { id }
    });
    return { message: 'Jurusan berhasil dihapus' };
};
exports.deleteJurusan = deleteJurusan;
