import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../../config/supabase";
import { authenticate, AuthRequest } from "../../middlewares/auth.middleware";

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
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1]!;

    await supabaseAdmin.auth.admin.signOut(token);

    res.json({ message: "Logout berhasil" });
  },
);

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
