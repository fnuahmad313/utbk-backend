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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
