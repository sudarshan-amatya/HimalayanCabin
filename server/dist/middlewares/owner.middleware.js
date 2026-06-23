export function ownerOnly(req, res, next) {
    if (!req.user || req.user.role !== "OWNER") {
        return res.status(403).json({
            message: "Owner access only",
        });
    }
    next();
}
export function ownerOrAdminOnly(req, res, next) {
    if (!req.user || (req.user.role !== "OWNER" && req.user.role !== "ADMIN")) {
        return res.status(403).json({
            message: "Owner or admin access only",
        });
    }
    next();
}
