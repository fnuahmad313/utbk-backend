"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboard = exports.getSiswaDashboard = void 0;
const prisma_1 = require("../../config/prisma");
const round1 = (val) => Math.round(val * 10) / 10;
const getSiswaDashboard = async (userId) => {
    // === OVERVIEW ===
    const latihanSessions = await prisma_1.prisma.latihanSession.findMany({
        where: { userId },
        include: { jawabans: true },
    });
    const sesiTryouts = await prisma_1.prisma.sesiTryout.findMany({
        where: { userId },
        include: {
            tryout: true,
            jawabans: true,
        },
        orderBy: { mulaiAt: 'desc' },
    });
    const latihanSelesai = latihanSessions.filter((s) => s.selesai);
    const tryoutSelesai = sesiTryouts.filter((s) => (s.status === 'SUBMITTED' || s.status === 'EXPIRED'));
    const totalLatihan = latihanSelesai.length;
    const totalTryout = tryoutSelesai.length;
    const rataRataSkorLatihan = totalLatihan > 0
        ? round1(latihanSelesai.reduce((sum, s) => sum + (s.skor ?? 0), 0) / totalLatihan)
        : 0;
    const tryoutDenganSkor = tryoutSelesai.filter((s) => s.skorTotal != null);
    const rataRataSkorTryout = tryoutDenganSkor.length > 0
        ? round1(tryoutDenganSkor.reduce((sum, s) => sum + (s.skorTotal ?? 0), 0) /
            tryoutDenganSkor.length)
        : 0;
    const totalSoalDijawab = latihanSessions.reduce((sum, s) => sum + s.jawabans.length, 0) +
        sesiTryouts.reduce((sum, s) => sum + s.jawabans.length, 0);
    // === LATIHAN ANALYTICS ===
    const mapelGroups = {};
    for (const sesi of latihanSelesai) {
        if (!mapelGroups[sesi.mapel]) {
            mapelGroups[sesi.mapel] = { totalSesi: 0, skors: [], sesiList: [] };
        }
        const group = mapelGroups[sesi.mapel];
        group.totalSesi++;
        group.skors.push(sesi.skor ?? 0);
        group.sesiList.push({
            sesiId: sesi.id,
            skor: sesi.skor ?? 0,
            tanggal: sesi.createdAt.toISOString(),
        });
    }
    const perMapel = Object.entries(mapelGroups).map(([mapel, group]) => {
        const rataRataSkor = round1(group.skors.reduce((a, b) => a + b, 0) / group.skors.length);
        const skorTertinggi = Math.max(...group.skors);
        const skorTerendah = Math.min(...group.skors);
        // 5 sesi terakhir per mapel, urut dari terlama ke terbaru
        const trenSkor = group.sesiList
            .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
            .slice(-5);
        return {
            mapel,
            totalSesi: group.totalSesi,
            rataRataSkor,
            skorTertinggi,
            skorTerendah,
            trenSkor,
        };
    });
    let kelemahanMapel = null;
    if (perMapel.length > 0) {
        kelemahanMapel = perMapel.reduce((prev, curr) => curr.rataRataSkor < prev.rataRataSkor ? curr : prev).mapel;
    }
    // === TRYOUT ANALYTICS ===
    const riwayat = sesiTryouts.map((s) => ({
        sesiId: s.id,
        judulTryout: s.tryout.judul,
        skorTps: s.skorTps,
        skorTka: s.skorTka,
        skorTotal: s.skorTotal,
        status: s.status,
        tanggal: s.mulaiAt.toISOString(),
    }));
    // trenSkorTotal: 5 tryout terakhir dengan skorTotal != null, urut dari terlama ke terbaru
    const tryoutDenganSkorSorted = tryoutDenganSkor
        .sort((a, b) => a.mulaiAt.getTime() - b.mulaiAt.getTime());
    const trenSkorTotal = tryoutDenganSkorSorted.slice(-5).map((s) => ({
        sesiId: s.id,
        judulTryout: s.tryout.judul,
        skorTotal: s.skorTotal,
        tanggal: s.mulaiAt.toISOString(),
    }));
    // skorTerbaik
    let skorTerbaik = {
        sesiId: null,
        judulTryout: null,
        skorTotal: null,
    };
    if (tryoutDenganSkor.length > 0) {
        const best = tryoutDenganSkor.reduce((prev, curr) => (curr.skorTotal ?? 0) > (prev.skorTotal ?? 0) ? curr : prev);
        skorTerbaik = {
            sesiId: best.id,
            judulTryout: best.tryout.judul,
            skorTotal: best.skorTotal,
        };
    }
    // progressDariAwal
    let progressDariAwal = null;
    if (tryoutDenganSkorSorted.length >= 2) {
        const first = tryoutDenganSkorSorted[0];
        const last = tryoutDenganSkorSorted[tryoutDenganSkorSorted.length - 1];
        progressDariAwal = round1((last.skorTotal ?? 0) - (first.skorTotal ?? 0));
    }
    return {
        overview: {
            totalLatihan,
            totalTryout,
            rataRataSkorLatihan,
            rataRataSkorTryout,
            totalSoalDijawab,
        },
        latihanAnalytics: {
            perMapel,
            kelemahanMapel,
        },
        tryoutAnalytics: {
            riwayat,
            trenSkorTotal,
            skorTerbaik,
            progressDariAwal,
        },
    };
};
exports.getSiswaDashboard = getSiswaDashboard;
const getAdminDashboard = async () => {
    // === PLATFORM ===
    const [totalUser, totalSoal, totalPTN, totalJurusan, totalTryout, totalTryoutOngoing] = await Promise.all([
        prisma_1.prisma.user.count({ where: { role: 'SISWA' } }),
        prisma_1.prisma.soal.count(),
        prisma_1.prisma.pTN.count(),
        prisma_1.prisma.jurusan.count(),
        prisma_1.prisma.tryout.count(),
        prisma_1.prisma.tryout.count({ where: { status: 'ONGOING' } }),
    ]);
    // === AKTIVITAS BELAJAR ===
    const [totalSesiLatihan, totalSesiTryout] = await Promise.all([
        prisma_1.prisma.latihanSession.count(),
        prisma_1.prisma.sesiTryout.count(),
    ]);
    const latihanSelesaiAll = await prisma_1.prisma.latihanSession.findMany({
        where: { selesai: true },
        select: { skor: true },
    });
    const rataRataSkorLatihan = latihanSelesaiAll.length > 0
        ? round1(latihanSelesaiAll.reduce((sum, s) => sum + (s.skor ?? 0), 0) /
            latihanSelesaiAll.length)
        : 0;
    const tryoutSelesaiAll = await prisma_1.prisma.sesiTryout.findMany({
        where: {
            status: { in: ['SUBMITTED', 'EXPIRED'] },
            skorTotal: { not: null },
        },
        select: { skorTotal: true },
    });
    const rataRataSkorTryout = tryoutSelesaiAll.length > 0
        ? round1(tryoutSelesaiAll.reduce((sum, s) => sum + (s.skorTotal ?? 0), 0) /
            tryoutSelesaiAll.length)
        : 0;
    // === TRYOUT STATS ===
    const allTryouts = await prisma_1.prisma.tryout.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            sesi: {
                where: {
                    status: { in: ['SUBMITTED', 'EXPIRED'] },
                },
                select: { skorTotal: true },
            },
        },
    });
    const tryoutStats = allTryouts.map((t) => {
        const peserta = t.sesi;
        const pesertaDenganSkor = peserta.filter((s) => s.skorTotal != null);
        const skors = pesertaDenganSkor.map((s) => s.skorTotal);
        return {
            tryoutId: t.id,
            judul: t.judul,
            status: t.status,
            totalPeserta: peserta.length,
            rataRataSkorTotal: skors.length > 0
                ? round1(skors.reduce((a, b) => a + b, 0) / skors.length)
                : 0,
            skorTertinggi: skors.length > 0 ? Math.max(...skors) : null,
            skorTerendah: skors.length > 0 ? Math.min(...skors) : null,
        };
    });
    // === TOP SISWA ===
    const allSesiTryout = await prisma_1.prisma.sesiTryout.findMany({
        where: {
            status: { in: ['SUBMITTED', 'EXPIRED'] },
            skorTotal: { not: null },
        },
        select: {
            userId: true,
            skorTotal: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    const siswaMap = {};
    for (const sesi of allSesiTryout) {
        if (!siswaMap[sesi.userId]) {
            siswaMap[sesi.userId] = {
                userId: sesi.user.id,
                nama: sesi.user.name,
                email: sesi.user.email,
                skors: [],
            };
        }
        siswaMap[sesi.userId].skors.push(sesi.skorTotal);
    }
    const topSiswa = Object.values(siswaMap)
        .map((s) => ({
        userId: s.userId,
        nama: s.nama,
        email: s.email,
        totalTryout: s.skors.length,
        rataRataSkorTryout: round1(s.skors.reduce((a, b) => a + b, 0) / s.skors.length),
    }))
        .sort((a, b) => b.rataRataSkorTryout - a.rataRataSkorTryout)
        .slice(0, 10);
    return {
        platform: {
            totalUser,
            totalSoal,
            totalPTN,
            totalJurusan,
            totalTryout,
            totalTryoutOngoing,
        },
        aktivitasBelajar: {
            totalSesiLatihan,
            totalSesiTryout,
            rataRataSkorLatihan,
            rataRataSkorTryout,
        },
        tryoutStats,
        topSiswa,
    };
};
exports.getAdminDashboard = getAdminDashboard;
