import '../src/config/env';
import { prisma } from '../src/config/prisma';
import { supabaseAdmin } from '../src/config/supabase';

async function main() {
  const email = 'admin@utbk.dev';
  const name = 'Super Admin';
  const password = 'Admin123!';

  // 1. Check if user already exists in DB with role ADMIN
  const dbUser = await prisma.user.findUnique({
    where: { email }
  });

  if (dbUser && dbUser.role === 'ADMIN') {
    console.log('User admin sudah ada di database.');
    return;
  }

  let userId: string;

  // 2. Create user in Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (error) {
    // If already exists, list users to retrieve id
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Gagal list users: ${listError.message}`);
    }
    const existingAuthUser = listData.users.find(u => u.email === email);
    if (!existingAuthUser) {
      throw new Error(`Gagal membuat user Supabase dan user tidak ditemukan: ${error.message}`);
    }
    userId = existingAuthUser.id;
  } else {
    userId = data.user!.id;
  }

  // 3. Upsert to Prisma DB
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      role: 'ADMIN',
      name
    },
    create: {
      id: userId,
      email,
      name,
      role: 'ADMIN'
    }
  });

  console.log('Seeder berhasil: Admin user siap digunakan.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
