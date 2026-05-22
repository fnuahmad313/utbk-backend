import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../../config/supabase";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(201).json({
    message: "Registrasi berhasil, cek email untuk verifikasi",
    user: data.user,
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.json({
    message: "Login berhasil",
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: data.user,
  });
});

router.post(
  "/logout",
  authenticate as any,
  async (req: AuthRequest, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1]!;

    await supabaseAdmin.auth.admin.signOut(token);

    res.json({ message: "Logout berhasil" });
  },
);

router.get("/me", authenticate as any, async (req: AuthRequest, res: Response) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  })

  if (!dbUser) {
    res.status(404).json({ message: 'User tidak ditemukan' })
    return
  }

  res.json({ data: dbUser })
})

// Hanya admin yang bisa ubah role user
router.patch('/role', requireRole(Role.ADMIN) as any, async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.body

  if (!userId || !role) {
    res.status(400).json({ message: 'userId dan role wajib diisi' })
    return
  }

  if (!Object.values(Role).includes(role)) {
    res.status(400).json({ message: 'Role tidak valid. Gunakan ADMIN atau SISWA' })
    return
  }

  const userExists = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!userExists) {
    res.status(404).json({ message: 'User tidak ditemukan di database' })
    return
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true }
  })

  res.json({ message: 'Role berhasil diubah', data: updated })
})

export default router;
