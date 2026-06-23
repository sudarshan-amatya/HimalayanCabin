import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

type Role = "USER" | "OWNER" | "ADMIN";

type TokenPayload = {
  id: string;
  email: string;
  role: Role;
};

export function generateToken(payload: TokenPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: "7d",
  });
}
