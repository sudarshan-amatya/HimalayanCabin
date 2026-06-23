import jwt from "jsonwebtoken";
export function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized, token missing",
            });
        }
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                message: "JWT_SECRET is missing",
            });
        }
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({
            message: "Not authorized, token invalid",
        });
    }
}
