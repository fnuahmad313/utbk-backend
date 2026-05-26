import '../src/config/env';
import { prisma } from '../src/config/prisma';
import { supabaseAdmin } from '../src/config/supabase';

async function main() {
  // const email = 'admin@utbk.dev';
  // const name = 'Super Admin';
  // const password = 'Admin123!';

  // 1. Check if user already exists in DB with role ADMIN
  // const dbUser = await prisma.user.findUnique({
  //   where: { email }
  // });

  // if (dbUser && dbUser.role === 'ADMIN') {
  //   console.log('User admin sudah ada di database.');
  //   return;
  // }

  // let userId: string;

  // 2. Create user in Supabase Auth
  // const { data, error } = await supabaseAdmin.auth.admin.createUser({
  //   email,
  //   password,
  //   email_confirm: true,
  //   user_metadata: { name }
  // });

  // if (error) {
  //   // If already exists, list users to retrieve id
  //   const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  //   if (listError) {
  //     throw new Error(`Gagal list users: ${listError.message}`);
  //   }
  //   const existingAuthUser = listData.users.find(u => u.email === email);
  //   if (!existingAuthUser) {
  //     throw new Error(`Gagal membuat user Supabase dan user tidak ditemukan: ${error.message}`);
  //   }
  //   userId = existingAuthUser.id;
  // } else {
  //   userId = data.user!.id;
  // }

  // 3. Upsert to Prisma DB
  // await prisma.user.upsert({
  //   where: { id: userId },
  //   update: {
  //     role: 'ADMIN',
  //     name
  //   },
  //   create: {
  //     id: userId,
  //     email,
  //     name,
  //     role: 'ADMIN'
  //   }
  // });

  // console.log('Seeder berhasil: Admin user siap digunakan.');

  // 4. Seed contoh soal untuk setiap tipe
  console.log("Seeding contoh soal...");

  const existingSoal = await prisma.soal.findFirst({
    where: { pertanyaan: { startsWith: "[SEED]" } }
  });

  if (!existingSoal) {
    await prisma.soal.createMany({
      data: [
        // SINGLE_CHOICE
        {
          pertanyaan: "[SEED] Manakah yang merupakan ibu kota Indonesia?",
          tipe: "SINGLE_CHOICE",
          opsi: { A: "Surabaya", B: "Bandung", C: "Jakarta", D: "Medan", E: "Makassar" },
          jawaban: "C",
          pembahasan: "Jakarta adalah ibu kota Indonesia sejak kemerdekaan.",
          mapel: "TPS",
          tingkat: "mudah",
        },

        // MULTIPLE_CHOICE
        {
          pertanyaan: "[SEED] Manakah yang termasuk bilangan prima di bawah 10?",
          tipe: "MULTIPLE_CHOICE",
          opsi: { A: "1", B: "2", C: "4", D: "5", E: "7" },
          jawaban: ["B", "D", "E"],
          pembahasan: "Bilangan prima di bawah 10 adalah 2, 5, dan 7.",
          mapel: "TKA_SAINTEK",
          tingkat: "mudah",
        },

        // TRUE_FALSE
        {
          pertanyaan: "[SEED] Tentukan benar atau salah pernyataan berikut tentang sistem tata surya.",
          tipe: "TRUE_FALSE",
          opsi: [
            "Matahari adalah bintang",
            "Bulan adalah planet",
            "Bumi mengelilingi Matahari",
            "Mars memiliki dua bulan"
          ],
          jawaban: { "0": true, "1": false, "2": true, "3": true },
          pembahasan: "Matahari adalah bintang, Bulan adalah satelit alami Bumi, Bumi mengelilingi Matahari, Mars memiliki dua bulan yaitu Phobos dan Deimos.",
          mapel: "TPS",
          tingkat: "sedang",
        },

        // SHORT_ANSWER
        {
          pertanyaan: "[SEED] Berapa hasil dari 15 x 4 - 20?",
          tipe: "SHORT_ANSWER",
          opsi: {},
          jawaban: "40",
          pembahasan: "15 x 4 = 60, kemudian 60 - 20 = 40.",
          mapel: "TKA_SAINTEK",
          tingkat: "mudah",
        },
      ],
    });
    console.log("Contoh soal berhasil di-seed.");
  } else {
    console.log("Contoh soal sudah ada, skip seeding soal.");
  }

  console.log('Seeding data PTN...')

  const existingPTN = await prisma.pTN.findFirst({
    where: { singkatan: 'UI' }
  })

  if (!existingPTN) {
    // UI
    const ui = await prisma.pTN.create({
      data: {
        nama: 'Universitas Indonesia',
        singkatan: 'UI',
        kota: 'Depok',
        provinsi: 'Jawa Barat',
        akreditasi: 'Unggul',
        tipe: 'Universitas',
        website: 'https://www.ui.ac.id',
        deskripsi: 'Universitas terkemuka di Indonesia yang berlokasi di Depok, Jawa Barat.'
      }
    })

    await prisma.jurusan.createMany({
      data: [
        {
          ptnId: ui.id,
          nama: 'Ilmu Komputer',
          kode: 'UI-IK',
          fakultas: 'Fakultas Ilmu Komputer',
          jenjang: 'S1',
          kelompok: 'SAINTEK',
          dayaTampung: 120,
          passingGrade: 750.5,
          deskripsi: 'Program studi yang mempelajari ilmu komputer dan pemrograman.',
          prospekKerja: 'Software Engineer, Data Scientist, AI Engineer'
        },
        {
          ptnId: ui.id,
          nama: 'Ilmu Hukum',
          kode: 'UI-IH',
          fakultas: 'Fakultas Hukum',
          jenjang: 'S1',
          kelompok: 'SOSHUM',
          dayaTampung: 200,
          passingGrade: 720.0,
          deskripsi: 'Program studi yang mempelajari ilmu hukum dan perundang-undangan.',
          prospekKerja: 'Pengacara, Notaris, Hakim, Konsultan Hukum'
        }
      ]
    })

    // ITB
    const itb = await prisma.pTN.create({
      data: {
        nama: 'Institut Teknologi Bandung',
        singkatan: 'ITB',
        kota: 'Bandung',
        provinsi: 'Jawa Barat',
        akreditasi: 'Unggul',
        tipe: 'Institut',
        website: 'https://www.itb.ac.id',
        deskripsi: 'Institut teknologi terbaik di Indonesia yang terletak di Bandung.'
      }
    })

    await prisma.jurusan.createMany({
      data: [
        {
          ptnId: itb.id,
          nama: 'Teknik Informatika',
          kode: 'ITB-IF',
          fakultas: 'Sekolah Teknik Elektro dan Informatika',
          jenjang: 'S1',
          kelompok: 'SAINTEK',
          dayaTampung: 100,
          passingGrade: 780.0,
          deskripsi: 'Program studi teknik informatika dengan fokus pada rekayasa perangkat lunak.',
          prospekKerja: 'Software Engineer, System Architect, Tech Lead'
        },
        {
          ptnId: itb.id,
          nama: 'Teknik Sipil',
          kode: 'ITB-SI',
          fakultas: 'Fakultas Teknik Sipil dan Lingkungan',
          jenjang: 'S1',
          kelompok: 'SAINTEK',
          dayaTampung: 130,
          passingGrade: 740.0,
          deskripsi: 'Program studi teknik sipil untuk pembangunan infrastruktur.',
          prospekKerja: 'Civil Engineer, Project Manager, Konsultan Konstruksi'
        }
      ]
    })

    // UGM
    const ugm = await prisma.pTN.create({
      data: {
        nama: 'Universitas Gadjah Mada',
        singkatan: 'UGM',
        kota: 'Yogyakarta',
        provinsi: 'Daerah Istimewa Yogyakarta',
        akreditasi: 'Unggul',
        tipe: 'Universitas',
        website: 'https://www.ugm.ac.id',
        deskripsi: 'Universitas negeri tertua di Indonesia yang berlokasi di Yogyakarta.'
      }
    })

    await prisma.jurusan.createMany({
      data: [
        {
          ptnId: ugm.id,
          nama: 'Kedokteran',
          kode: 'UGM-KU',
          fakultas: 'Fakultas Kedokteran, Kesehatan Masyarakat, dan Keperawatan',
          jenjang: 'S1',
          kelompok: 'SAINTEK',
          dayaTampung: 150,
          passingGrade: 800.0,
          deskripsi: 'Program studi kedokteran umum untuk mencetak dokter profesional.',
          prospekKerja: 'Dokter Umum, Dokter Spesialis, Peneliti Medis'
        },
        {
          ptnId: ugm.id,
          nama: 'Manajemen',
          kode: 'UGM-MN',
          fakultas: 'Fakultas Ekonomika dan Bisnis',
          jenjang: 'S1',
          kelompok: 'SOSHUM',
          dayaTampung: 180,
          passingGrade: 710.0,
          deskripsi: 'Program studi manajemen bisnis dan organisasi.',
          prospekKerja: 'Manajer, Business Analyst, Entrepreneur'
        }
      ]
    })

    // ITS
    const its = await prisma.pTN.create({
      data: {
        nama: 'Institut Teknologi Sepuluh Nopember',
        singkatan: 'ITS',
        kota: 'Surabaya',
        provinsi: 'Jawa Timur',
        akreditasi: 'Unggul',
        tipe: 'Institut',
        website: 'https://www.its.ac.id',
        deskripsi: 'Institut teknologi terkemuka di Indonesia Timur yang berlokasi di Surabaya.'
      }
    })

    await prisma.jurusan.createMany({
      data: [
        {
          ptnId: its.id,
          nama: 'Teknik Informatika',
          kode: 'ITS-IF',
          fakultas: 'Fakultas Teknologi Elektro dan Informatika Cerdas',
          jenjang: 'S1',
          kelompok: 'SAINTEK',
          dayaTampung: 110,
          passingGrade: 760.0,
          deskripsi: 'Program studi teknologi informasi dengan fokus kecerdasan buatan.',
          prospekKerja: 'AI Engineer, Software Developer, Data Scientist'
        }
      ]
    })

    // UNAIR
    const unair = await prisma.pTN.create({
      data: {
        nama: 'Universitas Airlangga',
        singkatan: 'UNAIR',
        kota: 'Surabaya',
        provinsi: 'Jawa Timur',
        akreditasi: 'Unggul',
        tipe: 'Universitas',
        website: 'https://www.unair.ac.id',
        deskripsi: 'Universitas negeri bergengsi di Surabaya dengan fokus pada kesehatan dan sains.'
      }
    })

    await prisma.jurusan.createMany({
      data: [
        {
          ptnId: unair.id,
          nama: 'Farmasi',
          kode: 'UNAIR-FA',
          fakultas: 'Fakultas Farmasi',
          jenjang: 'S1',
          kelompok: 'SAINTEK',
          dayaTampung: 100,
          passingGrade: 750.0,
          deskripsi: 'Program studi farmasi untuk mencetak apoteker profesional.',
          prospekKerja: 'Apoteker, Peneliti Farmasi, Quality Control'
        },
        {
          ptnId: unair.id,
          nama: 'Akuntansi',
          kode: 'UNAIR-AK',
          fakultas: 'Fakultas Ekonomi dan Bisnis',
          jenjang: 'S1',
          kelompok: 'SOSHUM',
          dayaTampung: 160,
          passingGrade: 695.0,
          deskripsi: 'Program studi akuntansi keuangan dan perpajakan.',
          prospekKerja: 'Akuntan, Auditor, Konsultan Pajak'
        }
      ]
    })

    console.log('Data PTN berhasil di-seed: UI, ITB, UGM, ITS, UNAIR')
  } else {
    console.log('Data PTN sudah ada, skip seeding PTN.')
  }

  console.log('Seeding kategori forum...')

  const existingKategori = await prisma.kategoriForumPost.findFirst({
    where: { slug: 'diskusi-soal' }
  })

  if (!existingKategori) {
    await prisma.kategoriForumPost.createMany({
      data: [
        { nama: 'Diskusi Soal', slug: 'diskusi-soal', deskripsi: 'Bahas soal UTBK yang sulit bersama' },
        { nama: 'Tips & Trik', slug: 'tips-trik', deskripsi: 'Bagikan strategi dan tips belajar efektif' },
        { nama: 'Tanya Jawab', slug: 'tanya-jawab', deskripsi: 'Tanya hal umum seputar UTBK dan persiapan' },
        { nama: 'Info PTN', slug: 'info-ptn', deskripsi: 'Diskusi seputar kampus, jurusan, dan kehidupan mahasiswa' },
        { nama: 'Curhat & Motivasi', slug: 'curhat-motivasi', deskripsi: 'Cerita pengalaman dan saling menyemangati' },
      ]
    })
    console.log('Kategori forum berhasil di-seed.')
  } else {
    console.log('Kategori forum sudah ada, skip seeding.')
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
