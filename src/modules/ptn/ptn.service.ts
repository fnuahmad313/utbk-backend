import { prisma } from '../../config/prisma'

// Filter untuk query PTN
export interface PTNFilter {
  provinsi?: string
  tipe?: string
  akreditasi?: string
  search?: string  // cari by nama atau singkatan
}

// Filter untuk query Jurusan
export interface JurusanFilter {
  kelompok?: string  // SAINTEK | SOSHUM | CAMPURAN
  jenjang?: string   // S1 | D3 | D4
  search?: string    // cari by nama jurusan atau fakultas
}

// Input untuk create/update PTN
export interface PTNInput {
  nama: string
  singkatan: string
  kota: string
  provinsi: string
  akreditasi: string
  tipe: string
  website?: string
  logoUrl?: string
  deskripsi?: string
}

// Input untuk create/update Jurusan
export interface JurusanInput {
  ptnId: string
  nama: string
  kode: string
  fakultas: string
  jenjang: string
  kelompok: string
  dayaTampung?: number
  passingGrade?: number
  deskripsi?: string
  prospekKerja?: string
}

const ALLOWED_TIPES = ["Universitas", "Institut", "Politeknik", "Sekolah Tinggi"];
const ALLOWED_AKREDITASIS = ["Unggul", "Baik Sekali", "Baik", "A", "B", "C"];
const ALLOWED_JENJANGS = ["S1", "D3", "D4"];
const ALLOWED_KELOMPOKS = ["SAINTEK", "SOSHUM", "CAMPURAN"];

// getPTNList(filter: PTNFilter)
export const getPTNList = async (filter: PTNFilter) => {
  const whereClause: any = {};

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

  const result = await prisma.pTN.findMany({
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

// getPTNById(id: string)
export const getPTNById = async (id: string) => {
  const ptn = await prisma.pTN.findUnique({
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

// createPTN(data: PTNInput)
export const createPTN = async (data: PTNInput) => {
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

  const ptn = await prisma.pTN.create({
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

// updatePTN(id: string, data: Partial<PTNInput>)
export const updatePTN = async (id: string, data: Partial<PTNInput>) => {
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
    const ptn = await prisma.pTN.update({
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
  } catch (error: any) {
    if (error.code === 'P2025') {
      return { error: 'ptn_not_found' };
    }
    throw error;
  }
};

// deletePTN(id: string)
export const deletePTN = async (id: string) => {
  const ptn = await prisma.pTN.findUnique({
    where: { id }
  });

  if (!ptn) {
    return { error: 'ptn_not_found' };
  }

  await prisma.$transaction([
    prisma.jurusan.deleteMany({
      where: { ptnId: id }
    }),
    prisma.pTN.delete({
      where: { id }
    })
  ]);

  return { message: 'PTN dan semua jurusan berhasil dihapus' };
};

// getJurusanByPTN(ptnId: string, filter: JurusanFilter)
export const getJurusanByPTN = async (ptnId: string, filter: JurusanFilter) => {
  const ptn = await prisma.pTN.findUnique({
    where: { id: ptnId }
  });

  if (!ptn) {
    return { error: 'ptn_not_found' };
  }

  const whereClause: any = { ptnId };

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

  const result = await prisma.jurusan.findMany({
    where: whereClause,
    orderBy: {
      nama: 'asc'
    }
  });

  return { data: result };
};

// getJurusanList(filter: JurusanFilter)
export const getJurusanList = async (filter: JurusanFilter) => {
  const whereClause: any = {};

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

  const result = await prisma.jurusan.findMany({
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

// getJurusanById(id: string)
export const getJurusanById = async (id: string) => {
  const jurusan = await prisma.jurusan.findUnique({
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

// createJurusan(data: JurusanInput)
export const createJurusan = async (data: JurusanInput) => {
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
  const ptn = await prisma.pTN.findUnique({
    where: { id: ptnId }
  });

  if (!ptn) {
    return { error: 'ptn_not_found' };
  }

  const jurusan = await prisma.jurusan.create({
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

// updateJurusan(id: string, data: Partial<JurusanInput>)
export const updateJurusan = async (id: string, data: Partial<JurusanInput>) => {
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
    const ptn = await prisma.pTN.findUnique({
      where: { id: ptnId }
    });
    if (!ptn) {
      return { error: 'ptn_not_found' };
    }
  }

  // Check if Jurusan exists
  const existing = await prisma.jurusan.findUnique({
    where: { id }
  });
  if (!existing) {
    return { error: 'jurusan_not_found' };
  }

  const updated = await prisma.jurusan.update({
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

// deleteJurusan(id: string)
export const deleteJurusan = async (id: string) => {
  const existing = await prisma.jurusan.findUnique({
    where: { id }
  });
  if (!existing) {
    return { error: 'jurusan_not_found' };
  }

  await prisma.jurusan.delete({
    where: { id }
  });

  return { message: 'Jurusan berhasil dihapus' };
};
