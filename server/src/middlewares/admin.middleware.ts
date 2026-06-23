import type { NextFunction, Request, Response } from "express";

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Admin access only",
    });
  }

  next();
}
