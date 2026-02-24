import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../config/supabase.js";

export interface AuthRequest extends Request {
  auth: { userId: string; email: string };
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  (req as AuthRequest).auth = { userId: user.id, email: user.email! };
  next();
};
