import jwt from "jsonwebtoken";

type Role = "USER" | "OWNER" | "ADMIN";

type TokenPayload = {
  id: string;
  email: string;
  role: Role;
};

export function generateToken(payload: TokenPayload) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing in .env file");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "7d",
  });
}
