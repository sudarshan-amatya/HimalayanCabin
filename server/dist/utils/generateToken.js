import jwt from "jsonwebtoken";
export function generateToken(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is missing in .env file");
    }
    return jwt.sign(payload, secret, {
        expiresIn: "7d",
    });
}
