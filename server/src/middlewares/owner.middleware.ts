import type { NextFunction, Request, Response } from "express";

export function ownerOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "OWNER") {
    return res.status(403).json({
      message: "Owner access only",
    });
  }

  next();
}

export function ownerOrAdminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== "OWNER" && req.user.role !== "ADMIN")) {
    return res.status(403).json({
      message: "Owner or admin access only",
    });
  }

  next();
}
