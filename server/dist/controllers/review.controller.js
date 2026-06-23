import { prisma } from "../config/prisma.js";
function ensureCustomer(req, res) {
    if (!req.user) {
        res.status(401).json({ message: "Not authorized" });
        return false;
    }
    if (req.user.role !== "USER") {
        res.status(403).json({ message: "Only customer accounts can rate and review cabins" });
        return false;
    }
    return true;
}
async function refreshCabinRating(cabinId) {
    const aggregate = await prisma.review.aggregate({
        where: { cabinId },
        _avg: { rating: true },
        _count: { rating: true },
    });
    const averageRating = aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0;
    const reviewCount = aggregate._count.rating;
    return prisma.cabin.update({
        where: { id: cabinId },
        data: {
            rating: averageRating,
            reviews: reviewCount,
        },
    });
}
export async function getCabinReviews(req, res) {
    try {
        const { cabinId } = req.params;
        const cabin = await prisma.cabin.findUnique({ where: { id: cabinId } });
        if (!cabin) {
            return res.status(404).json({ message: "Cabin not found" });
        }
        const reviews = await prisma.review.findMany({
            where: { cabinId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        return res.status(200).json({
            message: "Cabin reviews fetched successfully",
            reviews,
            rating: cabin.rating,
            reviewCount: cabin.reviews,
        });
    }
    catch (error) {
        console.error("Get cabin reviews error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function getMyCabinReview(req, res) {
    try {
        if (!ensureCustomer(req, res))
            return;
        const { cabinId } = req.params;
        const review = await prisma.review.findUnique({
            where: {
                userId_cabinId: {
                    userId: req.user.id,
                    cabinId,
                },
            },
        });
        return res.status(200).json({
            message: "My review fetched successfully",
            review,
        });
    }
    catch (error) {
        console.error("Get my cabin review error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function upsertCabinReview(req, res) {
    try {
        if (!ensureCustomer(req, res))
            return;
        const { cabinId } = req.params;
        const rating = Number(req.body.rating);
        const comment = req.body.comment !== undefined ? String(req.body.comment).trim() : "";
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be a number from 1 to 5" });
        }
        if (comment.length > 600) {
            return res.status(400).json({ message: "Review must be 600 characters or less" });
        }
        const cabin = await prisma.cabin.findUnique({ where: { id: cabinId } });
        if (!cabin || cabin.status !== "APPROVED") {
            return res.status(404).json({ message: "Cabin not found or not approved yet" });
        }
        const review = await prisma.review.upsert({
            where: {
                userId_cabinId: {
                    userId: req.user.id,
                    cabinId,
                },
            },
            update: {
                rating,
                comment: comment || null,
            },
            create: {
                userId: req.user.id,
                cabinId,
                rating,
                comment: comment || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        const updatedCabin = await refreshCabinRating(cabinId);
        return res.status(200).json({
            message: "Review saved successfully",
            review,
            cabin: updatedCabin,
        });
    }
    catch (error) {
        console.error("Upsert cabin review error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function deleteMyCabinReview(req, res) {
    try {
        if (!ensureCustomer(req, res))
            return;
        const { cabinId } = req.params;
        await prisma.review.deleteMany({
            where: {
                userId: req.user.id,
                cabinId,
            },
        });
        const updatedCabin = await refreshCabinRating(cabinId);
        return res.status(200).json({
            message: "Review removed successfully",
            review: null,
            cabin: updatedCabin,
        });
    }
    catch (error) {
        console.error("Delete cabin review error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
