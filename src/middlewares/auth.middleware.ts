import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token tidak ditemukan" });
    return;
  }

  const token = authHeader.split(" ")[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ message: "Token tidak valid atau sudah expired" });
    return;
  }

  req.user = {
    id: data.user.id,
    email: data.user.email!,
  };

  next();
};
