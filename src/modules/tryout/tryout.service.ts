import { TipeSoal, StatusTryout, StatusSesiTryout } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { createNotifikasi, createNotifikasiBulk } from '../notifikasi/notifikasi.service';

export interface CreateTryoutInput {
  judul: string;
  deskripsi?: string;
  mulaiAt: string;
  selesaiAt: string;
  durasiTps: number;
  durasiTka: number;
}

export interface AddSoalSubtesInput {
  mapel: string;
  soalIds: string[];
}

export interface SubmitAnswersInput {
  jawabans: {
    soalId: string;
    jawaban: any;
  }[];
}

const allowedTransitions: Record<string, string[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['ONGOING'],
  ONGOING: ['ENDED'],
};

export const hitungBenar = (
  tipe: TipeSoal,
  kunci: any,
  jawaban: any
): boolean => {
  switch (tipe) {
    case TipeSoal.SINGLE_CHOICE:
      return String(kunci).trim() === String(jawaban).trim();

    case TipeSoal.MULTIPLE_CHOICE:
      if (!Array.isArray(kunci) || !Array.isArray(jawaban)) return false;
      if (kunci.length !== jawaban.length) return false;
      const kunciSorted = [...kunci].sort();
      const jawabanSorted = [...jawaban].sort();
      return JSON.stringify(kunciSorted) === JSON.stringify(jawabanSorted);

    case TipeSoal.TRUE_FALSE:
      if (typeof kunci !== 'object' || typeof jawaban !== 'object')
        return false;
      if (Array.isArray(kunci) || Array.isArray(jawaban)) return false;
      return JSON.stringify(kunci) === JSON.stringify(jawaban);

    case TipeSoal.SHORT_ANSWER:
      return (
        String(kunci).trim().toLowerCase() ===
        String(jawaban).trim().toLowerCase()
      );

    default:
      return false;
  }
};

export const createTryout = async (input: CreateTryoutInput) => {
  const { judul, deskripsi, mulaiAt, selesaiAt, durasiTps, durasiTka } = input;

  if (!judul || typeof judul !== 'string' || judul.trim() === '') {
    return { error: 'judul_invalid' };
  }
  const start = new Date(mulaiAt);
  const end = new Date(selesaiAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: 'date_invalid' };
  }
  if (end <= start) {
    return { error: 'selesai_at_before_mulai_at' };
  }
  if (
    durasiTps === undefined ||
    typeof durasiTps !== 'number' ||
    durasiTps <= 0 ||
    !Number.isInteger(durasiTps)
  ) {
    return { error: 'durasi_tps_invalid' };
  }
  if (
    durasiTka === undefined ||
    typeof durasiTka !== 'number' ||
    durasiTka <= 0 ||
    !Number.isInteger(durasiTka)
  ) {
    return { error: 'durasi_tka_invalid' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const tryout = await tx.tryout.create({
      data: {
        judul,
        deskripsi,
        mulaiAt: start,
        selesaiAt: end,
        durasiTps,
        durasiTka,
        status: 'DRAFT',
      },
    });

    await tx.subtesTryout.createMany({
      data: [
        {
          tryoutId: tryout.id,
          mapel: 'TPS',
          urutan: 1,
          durasi: durasiTps,
        },
        {
          tryoutId: tryout.id,
          mapel: 'TKA_SAINTEK', // default TKA Saintek as required by addendum
          urutan: 2,
          durasi: durasiTka,
        },
      ],
    });

    return tx.tryout.findUnique({
      where: { id: tryout.id },
      include: { subtes: true },
    });
  });

  return { data: result };
};

export const updateStatus = async (id: string, newStatus: string) => {
  const tryout = await prisma.tryout.findUnique({
    where: { id },
    include: {
      subtes: {
        include: {
          _count: {
            select: { soals: true },
          },
        },
      },
    },
  });

  if (!tryout) {
    return { error: 'tryout_not_found' };
  }

  const validTransitions = allowedTransitions[tryout.status] || [];
  if (!validTransitions.includes(newStatus)) {
    return { error: 'invalid_status_transition' };
  }

  if (newStatus === 'PUBLISHED') {
    const subtesTps = tryout.subtes.find((s) => s.urutan === 1);
    const subtesTka = tryout.subtes.find((s) => s.urutan === 2);
    if (!subtesTps || subtesTps._count.soals === 0) {
      return { error: 'tps_subtes_empty' };
    }
    if (!subtesTka || subtesTka._count.soals === 0) {
      return { error: 'tka_subtes_empty' };
    }
  }

  const updated = await prisma.tryout.update({
    where: { id },
    data: { status: newStatus as StatusTryout },
    include: { subtes: true },
  });

  if (newStatus === 'ONGOING') {
    const semuaSiswa = await prisma.user.findMany({
      where: { role: 'SISWA' },
      select: { id: true }
    });

    await createNotifikasiBulk(
      semuaSiswa.map(siswa => ({
        userId: siswa.id,
        judul: 'Tryout Dimulai',
        pesan: `Tryout "${updated.judul}" sudah dimulai. Segera kerjakan sebelum waktu habis!`,
        tipe: 'tryout_started',
        data: { tryoutId: id }
      }))
    );
  }

  return { data: updated };
};

export const addSoalSubtes = async (
  tryoutId: string,
  mapel: string,
  soalIds: string[]
) => {
  if (!['TPS', 'TKA_SAINTEK', 'TKA_SOSHUM'].includes(mapel)) {
    return { error: 'invalid_mapel' };
  }
  if (!Array.isArray(soalIds) || soalIds.length === 0) {
    return { error: 'empty_soal_ids' };
  }

  const tryout = await prisma.tryout.findUnique({
    where: { id: tryoutId },
    include: { subtes: true },
  });

  if (!tryout) {
    return { error: 'tryout_not_found' };
  }

  if (tryout.status !== 'DRAFT') {
    return { error: 'tryout_not_draft' };
  }

  // Verify all soalIds exist in DB
  const existCount = await prisma.soal.count({
    where: { id: { in: soalIds } },
  });
  if (existCount !== soalIds.length) {
    return { error: 'some_soal_ids_invalid' };
  }

  let subtes =
    mapel === 'TPS'
      ? tryout.subtes.find((s) => s.urutan === 1)
      : tryout.subtes.find((s) => s.urutan === 2);

  if (!subtes) {
    return { error: 'subtes_not_found' };
  }

  // Update mapel of the subtest if it differs
  if (subtes.mapel !== mapel) {
    subtes = await prisma.subtesTryout.update({
      where: { id: subtes.id },
      data: { mapel },
    });
  }

  // Perform inside a transaction
  await prisma.$transaction(async (tx) => {
    // Delete existing SubtesSoal
    await tx.subtesSoal.deleteMany({
      where: { subtesId: subtes.id },
    });

    // Create new SubtesSoal
    const data = soalIds.map((soalId, index) => ({
      subtesId: subtes.id,
      soalId,
      nomorSoal: index + 1,
    }));

    await tx.subtesSoal.createMany({ data });
  });

  return { message: 'Soal berhasil ditambahkan ke subtes' };
};

export const deleteTryout = async (id: string) => {
  const tryout = await prisma.tryout.findUnique({
    where: { id },
    include: { subtes: true },
  });

  if (!tryout) {
    return { error: 'tryout_not_found' };
  }

  if (tryout.status !== 'DRAFT') {
    return { error: 'tryout_not_draft' };
  }

  const subtesIds = tryout.subtes.map((s) => s.id);

  await prisma.$transaction([
    prisma.subtesSoal.deleteMany({
      where: { subtesId: { in: subtesIds } },
    }),
    prisma.subtesTryout.deleteMany({
      where: { tryoutId: id },
    }),
    prisma.tryout.delete({
      where: { id },
    }),
  ]);

  return { message: 'Tryout berhasil dihapus' };
};

export const getTryoutList = async () => {
  const now = new Date();

  // Auto-update status
  await prisma.tryout.updateMany({
    where: {
      status: 'PUBLISHED',
      mulaiAt: { lte: now },
    },
    data: { status: 'ONGOING' },
  });

  await prisma.tryout.updateMany({
    where: {
      status: 'ONGOING',
      selesaiAt: { lte: now },
    },
    data: { status: 'ENDED' },
  });

  // Fetch only PUBLISHED or ONGOING
  const tryouts = await prisma.tryout.findMany({
    where: {
      status: { in: ['PUBLISHED', 'ONGOING'] },
    },
    include: {
      subtes: {
        include: {
          _count: {
            select: { soals: true },
          },
        },
      },
    },
  });

  const formatted = tryouts.map((t) => {
    const subtesTps = t.subtes.find((s) => s.urutan === 1);
    const subtesTka = t.subtes.find((s) => s.urutan === 2);
    return {
      id: t.id,
      judul: t.judul,
      deskripsi: t.deskripsi,
      status: t.status,
      mulaiAt: t.mulaiAt,
      selesaiAt: t.selesaiAt,
      durasiTps: t.durasiTps,
      durasiTka: t.durasiTka,
      totalSoalTps: subtesTps?._count.soals || 0,
      totalSoalTka: subtesTka?._count.soals || 0,
      mapelTka: subtesTka?.mapel || 'TKA_SAINTEK', // As required by addendum!
    };
  });

  return { data: formatted };
};

export const getTryoutById = async (id: string, role: string) => {
  const tryout = await prisma.tryout.findUnique({
    where: { id },
    include: {
      subtes: {
        include: {
          _count: {
            select: { soals: true },
          },
        },
      },
    },
  });

  if (!tryout) {
    return { error: 'tryout_not_found' };
  }

  return { data: tryout };
};

export const startSesiTryout = async (tryoutId: string, userId: string) => {
  const tryout = await prisma.tryout.findUnique({
    where: { id: tryoutId },
    include: { subtes: true },
  });

  if (!tryout) {
    return { error: 'tryout_not_found' };
  }

  if (tryout.status !== 'ONGOING') {
    return { error: 'tryout_not_ongoing' };
  }

  const now = new Date();
  if (now > tryout.selesaiAt) {
    return { error: 'tryout_already_ended' };
  }

  // Check if user already has an IN_PROGRESS session
  const existingSesi = await prisma.sesiTryout.findFirst({
    where: {
      tryoutId,
      userId,
      status: 'IN_PROGRESS',
    },
  });

  if (existingSesi) {
    return { error: 'already_has_active_session' };
  }

  const tpsSubtes = tryout.subtes.find((s) => s.urutan === 1);
  if (!tpsSubtes) {
    return { error: 'tps_subtes_not_found' };
  }

  const deadline = new Date(now.getTime() + tpsSubtes.durasi * 60 * 1000);

  const sesi = await prisma.sesiTryout.create({
    data: {
      tryoutId,
      userId,
      status: 'IN_PROGRESS',
      subtesAktif: tpsSubtes.id,
      subtesDeadline: deadline,
      mulaiAt: now,
    },
  });

  // Get all questions for TPS
  const subtesSoals = await prisma.subtesSoal.findMany({
    where: { subtesId: tpsSubtes.id },
    orderBy: { nomorSoal: 'asc' },
    include: {
      soal: {
        select: {
          id: true,
          pertanyaan: true,
          tipe: true,
          opsi: true,
        },
      },
    },
  });

  const formattedSoal = subtesSoals.map((ss) => ({
    id: ss.soal.id,
    nomorSoal: ss.nomorSoal,
    pertanyaan: ss.soal.pertanyaan,
    tipe: ss.soal.tipe,
    opsi: ss.soal.opsi,
  }));

  return {
    data: {
      sesiId: sesi.id,
      tryoutId: tryout.id,
      subtesAktif: {
        id: tpsSubtes.id,
        mapel: tpsSubtes.mapel,
        urutan: tpsSubtes.urutan,
        durasi: tpsSubtes.durasi,
        deadline,
      },
      soal: formattedSoal,
    },
  };
};

export const submitSubtes = async (
  sesiId: string,
  userId: string,
  jawabans: { soalId: string; jawaban: any }[]
) => {
  const sesi = await prisma.sesiTryout.findUnique({
    where: { id: sesiId },
    include: {
      tryout: {
        include: {
          subtes: true,
        },
      },
    },
  });

  if (!sesi) {
    return { error: 'session_not_found' };
  }

  if (sesi.userId !== userId) {
    return { error: 'unauthorized' };
  }

  if (sesi.status !== 'IN_PROGRESS' && sesi.status !== 'EXPIRED') {
    return { error: 'session_not_active' };
  }

  if (!sesi.subtesAktif) {
    return { error: 'no_active_subtest' };
  }

  const currentSubtes = sesi.tryout.subtes.find(
    (s) => s.id === sesi.subtesAktif
  );
  if (!currentSubtes) {
    return { error: 'active_subtest_not_found' };
  }

  const now = new Date();
  const isExpired = sesi.subtesDeadline ? now > sesi.subtesDeadline : false;
  const isSesiExpired = sesi.status === 'EXPIRED' || isExpired;

  // Fetch all questions for active subtest
  const subtesSoals = await prisma.subtesSoal.findMany({
    where: { subtesId: currentSubtes.id },
    include: { soal: true },
  });

  const totalSoal = subtesSoals.length;
  let jumlahBenar = 0;
  const jawabanData = [];

  for (const ss of subtesSoals) {
    const userAns = jawabans.find((j) => j.soalId === ss.soalId);
    const ansValue = userAns ? userAns.jawaban : null;
    const benar = userAns
      ? hitungBenar(ss.soal.tipe, ss.soal.jawaban, ansValue)
      : false;
    if (benar) jumlahBenar++;

    jawabanData.push({
      sesiId,
      soalId: ss.soalId,
      jawaban: ansValue ?? ({} as any),
      benar,
    });
  }

  const skor = totalSoal > 0 ? Math.round((jumlahBenar / totalSoal) * 100) : 0;

  // Get next subtest
  const nextSubtes = sesi.tryout.subtes.find(
    (s) => s.urutan === currentSubtes.urutan + 1
  );

  if (nextSubtes) {
    const deadline = new Date(now.getTime() + nextSubtes.durasi * 60 * 1000);

    await prisma.$transaction([
      prisma.jawabanTryout.createMany({ data: jawabanData }),
      prisma.sesiTryout.update({
        where: { id: sesiId },
        data: {
          subtesAktif: nextSubtes.id,
          subtesDeadline: deadline,
          skorTps: skor,
          status: isSesiExpired ? 'EXPIRED' : 'IN_PROGRESS',
        },
      }),
    ]);

    // Fetch TKA questions
    const nextSubtesSoals = await prisma.subtesSoal.findMany({
      where: { subtesId: nextSubtes.id },
      orderBy: { nomorSoal: 'asc' },
      include: {
        soal: {
          select: {
            id: true,
            pertanyaan: true,
            tipe: true,
            opsi: true,
          },
        },
      },
    });

    const formattedSoal = nextSubtesSoals.map((ss) => ({
      id: ss.soal.id,
      nomorSoal: ss.nomorSoal,
      pertanyaan: ss.soal.pertanyaan,
      tipe: ss.soal.tipe,
      opsi: ss.soal.opsi,
    }));

    return {
      data: {
        skorSubtesTps: skor,
        subtesBerikutnya: {
          id: nextSubtes.id,
          mapel: nextSubtes.mapel,
          urutan: nextSubtes.urutan,
          durasi: nextSubtes.durasi,
          deadline,
        },
        soal: formattedSoal,
      },
    };
  } else {
    // No next subtest - should go to `/selesai`
    await prisma.$transaction([
      prisma.jawabanTryout.createMany({ data: jawabanData }),
      prisma.sesiTryout.update({
        where: { id: sesiId },
        data: {
          skorTps: skor,
          status: isSesiExpired ? 'EXPIRED' : 'IN_PROGRESS',
        },
      }),
    ]);

    return {
      message: 'Subtes selesai, lanjutkan ke /selesai',
    };
  }
};

export const selesaiTryout = async (
  sesiId: string,
  userId: string,
  jawabans: { soalId: string; jawaban: any }[]
) => {
  const sesi = await prisma.sesiTryout.findUnique({
    where: { id: sesiId },
    include: {
      tryout: {
        include: {
          subtes: true,
        },
      },
    },
  });

  if (!sesi) {
    return { error: 'session_not_found' };
  }

  if (sesi.userId !== userId) {
    return { error: 'unauthorized' };
  }

  if (sesi.status !== 'IN_PROGRESS' && sesi.status !== 'EXPIRED') {
    return { error: 'session_not_active' };
  }

  if (!sesi.subtesAktif) {
    return { error: 'no_active_subtest' };
  }

  const currentSubtes = sesi.tryout.subtes.find(
    (s) => s.id === sesi.subtesAktif
  );
  if (!currentSubtes) {
    return { error: 'active_subtest_not_found' };
  }

  // Ensure currentSubtes is the last one (urutan 2)
  const maxUrutan = Math.max(...sesi.tryout.subtes.map((s) => s.urutan));
  if (currentSubtes.urutan !== maxUrutan) {
    return { error: 'not_the_last_subtest' };
  }

  const now = new Date();
  const isExpired = sesi.subtesDeadline ? now > sesi.subtesDeadline : false;
  const isSesiExpired = sesi.status === 'EXPIRED' || isExpired;
  const finalStatus = isSesiExpired ? 'EXPIRED' : 'SUBMITTED';

  // Score TKA questions
  const subtesSoals = await prisma.subtesSoal.findMany({
    where: { subtesId: currentSubtes.id },
    include: { soal: true },
  });

  const totalSoal = subtesSoals.length;
  let jumlahBenar = 0;
  const jawabanData = [];

  for (const ss of subtesSoals) {
    const userAns = jawabans.find((j) => j.soalId === ss.soalId);
    const ansValue = userAns ? userAns.jawaban : null;
    const benar = userAns
      ? hitungBenar(ss.soal.tipe, ss.soal.jawaban, ansValue)
      : false;
    if (benar) jumlahBenar++;

    jawabanData.push({
      sesiId,
      soalId: ss.soalId,
      jawaban: ansValue ?? ({} as any),
      benar,
    });
  }

  const skorTka =
    totalSoal > 0 ? Math.round((jumlahBenar / totalSoal) * 100) : 0;
  const skorTps = sesi.skorTps || 0;
  const skorTotal = Math.round((skorTps + skorTka) / 2);

  await prisma.$transaction([
    prisma.jawabanTryout.createMany({ data: jawabanData }),
    prisma.sesiTryout.update({
      where: { id: sesiId },
      data: {
        skorTka,
        skorTotal,
        status: finalStatus as StatusSesiTryout,
        selesaiAt: now,
        subtesAktif: null,
        subtesDeadline: null,
      },
    }),
  ]);

  await createNotifikasi({
    userId,
    judul: 'Hasil Tryout Tersedia',
    pesan: `Hasil tryout kamu sudah bisa dilihat. Skor total: ${skorTotal}`,
    tipe: 'tryout_result',
    data: { sesiId, tryoutId: sesi.tryoutId }
  });

  return {
    data: {
      sesiId,
      skorTps,
      skorTka,
      skorTotal,
      selesaiAt: now,
    },
  };
};

export const getHasilSesi = async (sesiId: string, userId: string) => {
  const sesi = await prisma.sesiTryout.findUnique({
    where: { id: sesiId },
    include: {
      tryout: {
        include: {
          subtes: {
            include: {
              soals: {
                include: {
                  soal: true,
                },
              },
            },
          },
        },
      },
      jawabans: true,
    },
  });

  if (!sesi) {
    return { error: 'session_not_found' };
  }

  if (sesi.userId !== userId) {
    return { error: 'unauthorized' };
  }

  if (sesi.status === 'IN_PROGRESS') {
    return { error: 'session_still_in_progress' };
  }

  const detailSubtes = sesi.tryout.subtes.map((sub) => {
    const subtesSoalIds = sub.soals.map((s) => s.soalId);
    const subJawabans = sesi.jawabans.filter((j) =>
      subtesSoalIds.includes(j.soalId)
    );
    const totalSoal = sub.soals.length;
    const jumlahBenar = subJawabans.filter((j) => j.benar).length;
    const jumlahSalah = totalSoal - jumlahBenar;
    const skor = sub.urutan === 1 ? sesi.skorTps || 0 : sesi.skorTka || 0;

    return {
      mapel: sub.mapel,
      totalSoal,
      usingCustomBenarCount: true, // internal check
      jumlahBenar,
      jumlahSalah,
      skor,
    };
  });

  return {
    data: {
      sesiId: sesi.id,
      tryout: {
        id: sesi.tryout.id,
        judul: sesi.tryout.judul,
      },
      status: sesi.status,
      skorTps: sesi.skorTps,
      skorTka: sesi.skorTka,
      skorTotal: sesi.skorTotal,
      mulaiAt: sesi.mulaiAt,
      selesaiAt: sesi.selesaiAt,
      detailSubtes,
    },
  };
};

export const getRiwayatSesi = async (userId: string) => {
  const sessions = await prisma.sesiTryout.findMany({
    where: { userId },
    orderBy: { mulaiAt: 'desc' },
    include: {
      tryout: {
        select: {
          id: true,
          judul: true,
          status: true,
        },
      },
    },
  });

  const formatted = sessions.map((s) => ({
    sesiId: s.id,
    tryout: {
      id: s.tryout.id,
      judul: s.tryout.judul,
    },
    status: s.status,
    skorTps: s.skorTps,
    skorTka: s.skorTka,
    skorTotal: s.skorTotal,
    mulaiAt: s.mulaiAt,
    selesaiAt: s.selesaiAt,
  }));

  return { data: formatted };
};
