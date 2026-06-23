export function userOnly(req, res, next) {
    if (!req.user || req.user.role !== "USER") {
        return res.status(403).json({
            message: "Customer access only",
        });
    }
    next();
}
