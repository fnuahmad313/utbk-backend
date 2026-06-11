import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '../../config/prisma'
import '../../config/env'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// ─────────────────────────────────────────────
// Helper: hitung statistik jawaban per mapel
// ─────────────────────────────────────────────
interface StatMapel {
    mapel: string
    total: number
    benar: number
    salah: number
    akurasi: number // 0–100
    perTingkat: {
        mudah: { total: number; benar: number }
        sedang: { total: number; benar: number }
        sulit: { total: number; benar: number }
    }
}

function hitungStatistik(
    jawabans: Array<{ benar: boolean; soal: { mapel: string; tingkat: string } }>
): StatMapel[] {
    const map = new Map<string, StatMapel>()

    for (const j of jawabans) {
        const { mapel, tingkat } = j.soal

        if (!map.has(mapel)) {
            map.set(mapel, {
                mapel,
                total: 0,
                benar: 0,
                salah: 0,
                akurasi: 0,
                perTingkat: {
                    mudah: { total: 0, benar: 0 },
                    sedang: { total: 0, benar: 0 },
                    sulit: { total: 0, benar: 0 },
                },
            })
        }

        const stat = map.get(mapel)!
        stat.total++
        if (j.benar) stat.benar++
        else stat.salah++

        const t = tingkat as 'mudah' | 'sedang' | 'sulit'
        if (stat.perTingkat[t]) {
            stat.perTingkat[t].total++
            if (j.benar) stat.perTingkat[t].benar++
        }
    }

    for (const stat of map.values()) {
        stat.akurasi = stat.total > 0 ? Math.round((stat.benar / stat.total) * 100) : 0
    }

    return Array.from(map.values()).sort((a, b) => a.akurasi - b.akurasi)
}

// ─────────────────────────────────────────────
// 1. Analisis kelemahan siswa
// ─────────────────────────────────────────────
export const analisisSiswa = async (userId: string) => {
    // Gabungkan jawaban dari latihan biasa + tryout
    const [jawabanLatihan, jawabanTryout] = await Promise.all([
        prisma.jawabanSiswa.findMany({
            where: { session: { userId } },
            include: { soal: { select: { mapel: true, tingkat: true } } },
        }),
        prisma.jawabanTryout.findMany({
            where: { sesi: { userId } },
            include: { soal: { select: { mapel: true, tingkat: true } } },
        }),
    ])

    const semuaJawaban = [
        ...jawabanLatihan.map((j) => ({ benar: j.benar, soal: j.soal })),
        ...jawabanTryout.map((j) => ({ benar: j.benar, soal: j.soal })),
    ]

    if (semuaJawaban.length === 0) {
        return {
            error: 'no_data',
            message: 'Belum ada data jawaban. Kerjakan latihan atau tryout terlebih dahulu.',
        }
    }

    const statistik = hitungStatistik(semuaJawaban)
    const totalSoal = semuaJawaban.length
    const totalBenar = semuaJawaban.filter((j) => j.benar).length
    const akurasiKeseluruhan = Math.round((totalBenar / totalSoal) * 100)

    // Kirim ke Gemini untuk analisis naratif
    const prompt = `
Kamu adalah AI tutor UTBK yang menganalisis performa siswa. Berikan analisis dalam Bahasa Indonesia yang jelas dan actionable.

Data performa siswa:
- Total soal dikerjakan: ${totalSoal}
- Akurasi keseluruhan: ${akurasiKeseluruhan}%
- Detail per mata pelajaran:
${statistik.map((s) => `  • ${s.mapel}: ${s.akurasi}% benar (${s.benar}/${s.total} soal) | Mudah: ${s.perTingkat.mudah.benar}/${s.perTingkat.mudah.total} | Sedang: ${s.perTingkat.sedang.benar}/${s.perTingkat.sedang.total} | Sulit: ${s.perTingkat.sulit.benar}/${s.perTingkat.sulit.total}`).join('\n')}

Berikan respons dalam format JSON berikut (hanya JSON, tanpa markdown):
{
  "ringkasan": "1-2 kalimat ringkasan performa keseluruhan",
  "topikLemah": ["mapel1", "mapel2", "mapel3"],
  "analisisPerMapel": [
    {
      "mapel": "nama mapel",
      "status": "lemah|cukup|baik",
      "catatan": "analisis singkat 1 kalimat",
      "saranBelajar": "saran spesifik 1-2 kalimat"
    }
  ],
  "prioritasBelajar": "Penjelasan 2-3 kalimat tentang apa yang harus difokuskan siswa minggu ini",
  "estimasiSkor": {
    "TPS": <estimasi 0-1000>,
    "TKA": <estimasi 0-1000>,
    "catatan": "1 kalimat penjelasan estimasi"
  }
}
`

    try {
        const result = await model.generateContent(prompt)
        const text = result.response.text().trim()

        // Bersihkan markdown fence jika ada
        const clean = text.replace(/```json|```/g, '').trim()
        const analisis = JSON.parse(clean)

        return {
            data: {
                statistik,
                totalSoal,
                akurasiKeseluruhan,
                analisis,
            },
        }
    } catch (err) {
        console.error('Gemini analisis error:', err)
        return {
            error: 'ai_error',
            message: 'Gagal menganalisis data. Coba lagi nanti.',
        }
    }
}

// ─────────────────────────────────────────────
// 2. Rekomendasi PTN berdasarkan performa
// ─────────────────────────────────────────────
export const rekomendasiPTN = async (userId: string) => {
    // Ambil skor tryout terakhir (paling representatif)
    const sesiTerakhir = await prisma.sesiTryout.findFirst({
        where: { userId, status: 'SUBMITTED' },
        orderBy: { selesaiAt: 'desc' },
        select: { skorTps: true, skorTka: true, skorTotal: true },
    })

    // Ambil juga statistik jawaban untuk tahu SAINTEK atau SOSHUM
    const jawabanTryout = await prisma.jawabanTryout.findMany({
        where: { sesi: { userId } },
        include: { soal: { select: { mapel: true } } },
        take: 200, // batasi untuk efisiensi
    })

    if (!sesiTerakhir && jawabanTryout.length === 0) {
        return {
            error: 'no_data',
            message: 'Belum ada data tryout. Ikuti tryout terlebih dahulu untuk mendapat rekomendasi PTN.',
        }
    }

    // Tentukan kelompok dominan (SAINTEK vs SOSHUM) dari jawaban
    const mapelSaintek = ['TKA_SAINTEK', 'Matematika', 'Fisika', 'Kimia', 'Biologi']
    const mapelSoshum = ['TKA_SOSHUM', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi']

    let countSaintek = 0
    let countSoshum = 0
    for (const j of jawabanTryout) {
        if (mapelSaintek.some((m) => j.soal.mapel.includes(m))) countSaintek++
        if (mapelSoshum.some((m) => j.soal.mapel.includes(m))) countSoshum++
    }
    const kelompok = countSaintek >= countSoshum ? 'SAINTEK' : 'SOSHUM'

    const skorEstimasi = sesiTerakhir?.skorTotal ?? null

    // Ambil jurusan yang passing grade-nya sesuai skor
    // Ambil range ±50 dari skor untuk rekomendasi yang realistis
    const whereJurusan: any = { kelompok }
    if (skorEstimasi) {
        whereJurusan.passingGrade = {
            gte: skorEstimasi - 80, // sedikit di bawah (masih bisa masuk)
            lte: skorEstimasi + 100, // sedikit di atas (target stretch)
        }
    }

    const kandidatJurusan = await prisma.jurusan.findMany({
        where: whereJurusan,
        include: {
            ptn: {
                select: { id: true, nama: true, singkatan: true, kota: true, provinsi: true, akreditasi: true, tipe: true },
            },
        },
        orderBy: { passingGrade: 'desc' },
        take: 30, // ambil 30 kandidat, biarkan AI pilih yang terbaik
    })

    if (kandidatJurusan.length === 0) {
        return {
            error: 'no_match',
            message: 'Tidak ditemukan jurusan yang sesuai dengan profil skor kamu.',
        }
    }

    const prompt = `
Kamu adalah konselor PTN yang membantu siswa UTBK memilih jurusan yang tepat.

Profil siswa:
- Kelompok ujian: ${kelompok}
- Skor tryout terakhir: ${skorEstimasi ?? 'belum ada data'}
- Skor TPS: ${sesiTerakhir?.skorTps ?? '-'}
- Skor TKA: ${sesiTerakhir?.skorTka ?? '-'}

Daftar jurusan yang tersedia (passing grade dalam rentang skor siswa):
${kandidatJurusan.map((j, i) => `${i + 1}. ${j.nama} — ${j.ptn.nama} (${j.ptn.singkatan}) | Passing Grade: ${j.passingGrade} | Akreditasi PTN: ${j.ptn.akreditasi} | Kota: ${j.ptn.kota}`).join('\n')}

Pilihkan 5 rekomendasi terbaik untuk siswa ini dengan strategi:
- 2 "aman" (passing grade di bawah skor siswa)
- 2 "target" (passing grade mendekati skor siswa)  
- 1 "impian" (passing grade sedikit di atas skor siswa)

Berikan respons dalam format JSON berikut (hanya JSON, tanpa markdown):
{
  "rekomendasi": [
    {
      "jurusanNama": "nama jurusan",
      "ptnNama": "nama PTN",
      "ptnSingkatan": "singkatan",
      "passingGrade": <angka>,
      "kategori": "aman|target|impian",
      "alasan": "alasan spesifik 1-2 kalimat mengapa jurusan ini cocok",
      "peluang": "tinggi|sedang|rendah"
    }
  ],
  "saranUmum": "2-3 kalimat saran umum untuk siswa ini dalam mempersiapkan UTBK"
}
`

    try {
        const result = await model.generateContent(prompt)
        const text = result.response.text().trim()
        const clean = text.replace(/```json|```/g, '').trim()
        const rekomendasi = JSON.parse(clean)

        return {
            data: {
                kelompok,
                skorEstimasi,
                rekomendasi,
            },
        }
    } catch (err) {
        console.error('Gemini rekomendasi error:', err)
        return {
            error: 'ai_error',
            message: 'Gagal membuat rekomendasi. Coba lagi nanti.',
        }
    }
}

// ─────────────────────────────────────────────
// 3. Chat dengan AI tutor (stateless per request)
// ─────────────────────────────────────────────
export interface ChatMessage {
    role: 'user' | 'model'
    content: string
}

export const chatTutor = async (userId: string, pesan: string, riwayatChat: ChatMessage[]) => {
    if (!pesan || pesan.trim() === '') {
        return { error: 'validation_error', message: 'Pesan tidak boleh kosong' }
    }

    if (pesan.length > 1000) {
        return { error: 'validation_error', message: 'Pesan terlalu panjang (maks 1000 karakter)' }
    }

    // Ambil konteks performa siswa untuk personalisasi jawaban
    const jawabanCount = await prisma.jawabanSiswa.count({
        where: { session: { userId } },
    })

    const systemInstruction = `Kamu adalah AI tutor UTBK bernama "Tuto" yang membantu siswa Indonesia mempersiapkan ujian UTBK/SNBT.

Kamu ahli dalam semua mata pelajaran UTBK:
- TPS (Tes Potensi Skolastik): Penalaran Umum, Kemampuan Kuantitatif, Pengetahuan & Pemahaman Umum, Kemampuan Memahami Bacaan & Menulis
- TKA Saintek: Matematika, Fisika, Kimia, Biologi
- TKA Soshum: Geografi, Sejarah, Sosiologi, Ekonomi

Aturan:
- Jawab selalu dalam Bahasa Indonesia yang ramah dan mudah dimengerti
- Jika ada soal yang ditanyakan, berikan penjelasan langkah per langkah
- Jika ada pertanyaan di luar UTBK/akademik, arahkan kembali ke topik belajar
- Siswa ini sudah mengerjakan ${jawabanCount} soal latihan

Jadilah suportif, motivatif, dan fokus pada pemahaman konsep, bukan sekadar jawaban.`

    try {
        const chat = model.startChat({
            systemInstruction,
            history: riwayatChat.map((m) => ({
                role: m.role,
                parts: [{ text: m.content }],
            })),
        })

        const result = await chat.sendMessage(pesan)
        const balasan = result.response.text()

        return {
            data: {
                balasan,
                role: 'model' as const,
            },
        }
    } catch (err) {
        console.error('Gemini chat error:', err)
        return {
            error: 'ai_error',
            message: 'Tuto sedang tidak tersedia. Coba lagi nanti.',
        }
    }
}
