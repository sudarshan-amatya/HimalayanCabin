import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/notification.js";
function calculateNights(checkInDate, checkOutDate) {
    const difference = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(difference / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
}
function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}
function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}
const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    profileImage: true,
    role: true,
};
const giftInclude = {
    sender: {
        select: userSelect,
    },
    recipient: {
        select: userSelect,
    },
    cabin: {
        include: {
            owner: {
                select: userSelect,
            },
        },
    },
    booking: {
        include: {
            cabin: true,
        },
    },
};
export async function createGift(_req, res) {
    return res.status(400).json({
        message: "Gift requests must be paid through eSewa first. Please use the Gift a Stay page to complete eSewa payment before the gift is created.",
    });
}
export async function getReceivedGifts(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        if (req.user.role !== "USER")
            return res.status(403).json({ message: "Only guests can receive gifts" });
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { email: true },
        });
        if (!currentUser)
            return res.status(404).json({ message: "User not found" });
        const gifts = await prisma.gift.findMany({
            where: {
                OR: [
                    { recipientId: req.user.id },
                    { recipientEmail: currentUser.email.toLowerCase() },
                ],
            },
            include: giftInclude,
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({
            message: "Received gifts fetched successfully",
            gifts,
        });
    }
    catch (error) {
        console.error("Get received gifts error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function getSentGifts(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        if (req.user.role !== "USER")
            return res.status(403).json({ message: "Only guests can send gifts" });
        const gifts = await prisma.gift.findMany({
            where: { senderId: req.user.id },
            include: giftInclude,
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ message: "Sent gifts fetched successfully", gifts });
    }
    catch (error) {
        console.error("Get sent gifts error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function acceptGift(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        if (req.user.role !== "USER")
            return res.status(403).json({ message: "Only guests can accept gifts" });
        const { id } = req.params;
        const result = await prisma.$transaction(async (tx) => {
            const gift = await tx.gift.findUnique({
                where: { id },
                include: giftInclude,
            });
            if (!gift) {
                throw new Error("Gift not found");
            }
            const user = await tx.user.findUnique({
                where: { id: req.user.id },
            });
            if (!user) {
                throw new Error("User not found");
            }
            if (gift.recipientId && gift.recipientId !== user.id) {
                throw new Error("This gift was sent to a different account");
            }
            if (!gift.recipientId && gift.recipientEmail !== user.email.toLowerCase()) {
                throw new Error("This gift was sent to a different email address");
            }
            if (gift.status !== "SENT") {
                throw new Error("Only sent gifts can be accepted");
            }
            if (gift.giftType === "VOUCHER") {
                const updatedUser = await tx.user.update({
                    where: { id: user.id },
                    data: {
                        giftCredit: {
                            increment: gift.amount || 0,
                        },
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        role: true,
                        giftCredit: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
                const updatedGift = await tx.gift.update({
                    where: { id },
                    data: {
                        status: "ACCEPTED",
                        acceptedAt: new Date(),
                    },
                    include: giftInclude,
                });
                return { gift: updatedGift, booking: null, user: updatedUser };
            }
            if (!gift.cabinId || !gift.checkInDate || !gift.checkOutDate || !gift.travellers || !gift.totalPrice) {
                throw new Error("Cabin gift details are incomplete");
            }
            const cabin = await tx.cabin.findUnique({ where: { id: gift.cabinId } });
            if (!cabin || cabin.status !== "APPROVED" || !cabin.isActive) {
                throw new Error("This cabin is no longer active or approved. Please contact support about this gift.");
            }
            if (!user.phone) {
                throw new Error("Please add your contact number in Profile before accepting a cabin gift");
            }
            const booking = await tx.booking.create({
                data: {
                    userId: user.id,
                    cabinId: gift.cabinId,
                    giftId: gift.id,
                    fullName: `${user.firstName} ${user.lastName}`.trim(),
                    phone: user.phone,
                    email: user.email,
                    checkInDate: gift.checkInDate,
                    checkOutDate: gift.checkOutDate,
                    travellers: gift.travellers,
                    specialRequest: gift.message ? `Gift booking message: ${gift.message}` : "Gift booking",
                    totalPrice: gift.totalPrice,
                    status: "CONFIRMED",
                    paymentMethod: "GIFT",
                    paymentStatus: "PAID",
                    paymentReference: `GIFT-${gift.id}`,
                    paidAt: new Date(),
                    isGift: true,
                },
                include: {
                    cabin: {
                        include: {
                            owner: { select: userSelect },
                        },
                    },
                    gift: true,
                },
            });
            const updatedGift = await tx.gift.update({
                where: { id },
                data: {
                    status: "ACCEPTED",
                    acceptedAt: new Date(),
                },
                include: giftInclude,
            });
            return { gift: updatedGift, booking, user: null };
        });
        await createNotification({
            userId: result.gift.senderId,
            title: "Gift accepted",
            message: `${result.gift.recipientName} accepted your ${result.gift.giftType.toLowerCase()} gift.`,
            type: "GIFT",
            link: "/my-gifts",
        });
        return res.status(200).json({
            message: result.booking
                ? "Cabin gift accepted. It has been added to My bookings."
                : "Voucher accepted. Gift credit has been added to your profile.",
            ...result,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Failed to accept gift";
        console.error("Accept gift error:", error);
        return res.status(message === "Gift not found" ? 404 : 400).json({ message });
    }
}
export async function declineGift(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        if (req.user.role !== "USER")
            return res.status(403).json({ message: "Only guests can decline gifts" });
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const gift = await prisma.gift.findUnique({ where: { id } });
        if (!gift)
            return res.status(404).json({ message: "Gift not found" });
        if (gift.recipientId && gift.recipientId !== user.id) {
            return res.status(403).json({ message: "This gift was sent to a different account" });
        }
        if (!gift.recipientId && gift.recipientEmail !== user.email.toLowerCase()) {
            return res.status(403).json({ message: "This gift was sent to a different email address" });
        }
        if (gift.status !== "SENT") {
            return res.status(400).json({ message: "Only sent gifts can be declined" });
        }
        const updatedGift = await prisma.gift.update({
            where: { id },
            data: {
                status: "DECLINED",
                declinedAt: new Date(),
            },
            include: giftInclude,
        });
        await createNotification({
            userId: updatedGift.senderId,
            title: "Gift declined",
            message: `${updatedGift.recipientName} declined your ${updatedGift.giftType.toLowerCase()} gift.`,
            type: "GIFT",
            link: "/my-gifts",
        });
        return res.status(200).json({ message: "Gift declined", gift: updatedGift });
    }
    catch (error) {
        console.error("Decline gift error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function getOwnerGiftRequests(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        const gifts = await prisma.gift.findMany({
            where: {
                giftType: "CABIN",
                cabin: {
                    ownerId: req.user.id,
                },
            },
            include: giftInclude,
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ message: "Owner gift requests fetched successfully", gifts });
    }
    catch (error) {
        console.error("Get owner gift requests error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function updateOwnerGiftStatus(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        const { id } = req.params;
        const { status } = req.body;
        if (status !== "SENT" && status !== "REJECTED") {
            return res.status(400).json({ message: "Gift status must be SENT or REJECTED" });
        }
        const gift = await prisma.gift.findFirst({
            where: {
                id,
                giftType: "CABIN",
                cabin: {
                    ownerId: req.user.id,
                },
            },
        });
        if (!gift) {
            return res.status(404).json({ message: "Gift request not found for your cabin" });
        }
        if (gift.status !== "PENDING_OWNER_CONFIRMATION") {
            return res.status(400).json({ message: "Only pending cabin gift requests can be changed" });
        }
        const updatedGift = await prisma.gift.update({
            where: { id },
            data: { status },
            include: giftInclude,
        });
        if (status === "SENT") {
            await createNotification({
                userId: updatedGift.recipientId,
                title: "Cabin gift received",
                message: `${updatedGift.senderName} sent you a cabin gift for ${updatedGift.cabin?.name || "a cabin stay"}.`,
                type: "GIFT",
                link: "/my-gifts",
            });
            await createNotification({
                userId: updatedGift.senderId,
                title: "Cabin gift confirmed",
                message: `The cabin owner confirmed your gift request for ${updatedGift.cabin?.name || "the cabin"}.`,
                type: "GIFT",
                link: "/my-gifts",
            });
        }
        else {
            await createNotification({
                userId: updatedGift.senderId,
                title: "Cabin gift rejected",
                message: `The cabin owner rejected your gift request for ${updatedGift.cabin?.name || "the cabin"}.`,
                type: "GIFT",
                link: "/my-gifts",
            });
        }
        return res.status(200).json({
            message: status === "SENT"
                ? "Cabin gift confirmed and sent to recipient"
                : "Cabin gift request rejected",
            gift: updatedGift,
        });
    }
    catch (error) {
        console.error("Update owner gift status error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
