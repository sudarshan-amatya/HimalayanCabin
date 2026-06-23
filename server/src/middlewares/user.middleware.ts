import type { NextFunction, Request, Response } from "express";

export function userOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "USER") {
    return res.status(403).json({
      message: "Customer access only",
    });
  }

  next();
}
