import { prisma } from "../config/prisma.js";
import { createNotification, notifyAdmins } from "../utils/notification.js";
const cabinStatuses = ["PENDING", "APPROVED", "REJECTED"];
function parseStringArray(value) {
    if (Array.isArray(value)) {
        return value.map(String).map((item) => item.trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return undefined;
}
function arraysEqual(first = [], second = []) {
    return first.length === second.length && first.every((item, index) => item === second[index]);
}
function parseCabinPayload(body) {
    const { name, location, price, image, images, description, rating, reviews, facilities, } = body;
    return {
        name: name !== undefined ? String(name).trim() : undefined,
        location: location !== undefined ? String(location).trim() : undefined,
        price: price !== undefined ? Number(price) : undefined,
        image: image !== undefined
            ? image !== null && String(image).trim()
                ? String(image).trim()
                : null
            : undefined,
        images: parseStringArray(images),
        description: description !== undefined ? String(description).trim() : undefined,
        rating: rating !== undefined ? Number(rating) : undefined,
        reviews: reviews !== undefined ? Number(reviews) : undefined,
        facilities: parseStringArray(facilities),
    };
}
export async function getCabins(req, res) {
    try {
        const { search, location } = req.query;
        const cabins = await prisma.cabin.findMany({
            where: {
                AND: [
                    { status: "APPROVED" },
                    { isActive: true },
                    search
                        ? {
                            OR: [
                                {
                                    name: {
                                        contains: String(search),
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    location: {
                                        contains: String(search),
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    description: {
                                        contains: String(search),
                                        mode: "insensitive",
                                    },
                                },
                            ],
                        }
                        : {},
                    location
                        ? {
                            location: {
                                contains: String(location),
                                mode: "insensitive",
                            },
                        }
                        : {},
                ],
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({
            message: "Cabins fetched successfully",
            cabins,
        });
    }
    catch (error) {
        console.error("Get cabins error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}
export async function getAdminCabins(_req, res) {
    try {
        const cabins = await prisma.cabin.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({
            message: "All cabins fetched successfully",
            cabins,
        });
    }
    catch (error) {
        console.error("Get admin cabins error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}
export async function getOwnerCabins(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const cabins = await prisma.cabin.findMany({
            where: {
                ownerId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({
            message: "Owner cabins fetched successfully",
            cabins,
        });
    }
    catch (error) {
        console.error("Get owner cabins error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}
export async function getCabinById(req, res) {
    try {
        const { id } = req.params;
        const cabin = await prisma.cabin.findUnique({
            where: {
                id,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });
        if (!cabin) {
            return res.status(404).json({
                message: "Cabin not found",
            });
        }
        const isPublic = cabin.status === "APPROVED" && cabin.isActive;
        const isAdmin = req.user?.role === "ADMIN";
        const isOwner = req.user?.role === "OWNER" && cabin.ownerId === req.user.id;
        if (!isPublic && !isAdmin && !isOwner) {
            return res.status(404).json({
                message: "Cabin not found",
            });
        }
        return res.status(200).json({
            message: "Cabin fetched successfully",
            cabin,
        });
    }
    catch (error) {
        console.error("Get cabin by id error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}
export async function createCabin(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        if (req.user.role !== "OWNER") {
            return res.status(403).json({
                message: "Only cabin owners can register new cabins. Main admin can only edit and approve cabins.",
            });
        }
        const payload = parseCabinPayload(req.body);
        if (!payload.name || !payload.location || !payload.price || !payload.description) {
            return res.status(400).json({
                message: "Name, location, price, and description are required",
            });
        }
        const cabin = await prisma.cabin.create({
            data: {
                name: payload.name,
                location: payload.location,
                price: payload.price,
                image: payload.image ?? null,
                images: payload.images ?? [],
                description: payload.description,
                rating: 0,
                reviews: 0,
                facilities: payload.facilities ?? [],
                ownerId: req.user.id,
                status: "PENDING",
                isActive: true,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });
        await notifyAdmins({
            title: "New cabin waiting approval",
            message: `${cabin.owner?.firstName || "An owner"} submitted ${cabin.name} for approval.`,
            type: "CABIN",
            link: "/admin/cabin-approvals",
        });
        await createNotification({
            userId: req.user.id,
            title: "Cabin submitted for approval",
            message: `${cabin.name} is waiting for main admin approval.`,
            type: "CABIN",
            link: "/owner/cabins",
        });
        return res.status(201).json({
            message: "Cabin submitted successfully. Main admin approval is required before it appears publicly.",
            cabin,
        });
    }
    catch (error) {
        console.error("Create cabin error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}
export async function updateCabin(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const { id } = req.params;
        const existingCabin = await prisma.cabin.findUnique({
            where: {
                id,
            },
        });
        if (!existingCabin) {
            return res.status(404).json({
                message: "Cabin not found",
            });
        }
        const isAdmin = req.user.role === "ADMIN";
        const isOwnerOfCabin = req.user.role === "OWNER" && existingCabin.ownerId === req.user.id;
        if (!isAdmin && !isOwnerOfCabin) {
            return res.status(403).json({
                message: "You can only manage your own cabins",
            });
        }
        const payload = parseCabinPayload(req.body);
        const isCabinDetailsChanged = (payload.name !== undefined && payload.name !== existingCabin.name) ||
            (payload.location !== undefined && payload.location !== existingCabin.location) ||
            (payload.price !== undefined && payload.price !== existingCabin.price) ||
            (payload.image !== undefined && payload.image !== existingCabin.image) ||
            (payload.description !== undefined && payload.description !== existingCabin.description) ||
            (payload.images !== undefined && !arraysEqual(payload.images, existingCabin.images)) ||
            (payload.facilities !== undefined && !arraysEqual(payload.facilities, existingCabin.facilities));
        const cabin = await prisma.cabin.update({
            where: {
                id,
            },
            data: {
                name: payload.name,
                location: payload.location,
                price: payload.price,
                image: payload.image,
                images: payload.images,
                description: payload.description,
                facilities: payload.facilities,
                status: isOwnerOfCabin && isCabinDetailsChanged ? "PENDING" : undefined,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });
        if (isOwnerOfCabin && isCabinDetailsChanged) {
            await notifyAdmins({
                title: "Cabin updated for approval",
                message: `${cabin.name} was edited by the owner and needs review again.`,
                type: "CABIN",
                link: "/admin/cabin-approvals",
            });
            await createNotification({
                userId: req.user.id,
                title: "Cabin sent for re-approval",
                message: `${cabin.name} is pending admin approval after your update.`,
                type: "CABIN",
                link: "/owner/cabins",
            });
        }
        return res.status(200).json({
            message: isOwnerOfCabin && isCabinDetailsChanged
                ? "Cabin details changed and sent back for admin approval"
                : "Cabin updated successfully",
            cabin,
        });
    }
    catch (error) {
        console.error("Update cabin error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}
export async function updateCabinStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!cabinStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid cabin status",
            });
        }
        const existingCabin = await prisma.cabin.findUnique({ where: { id } });
        if (!existingCabin) {
            return res.status(404).json({ message: "Cabin not found" });
        }
        const cabin = await prisma.cabin.update({
            where: { id },
            data: { status },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });
        if (cabin.ownerId) {
            await createNotification({
                userId: cabin.ownerId,
                title: status === "APPROVED" ? "Cabin approved" : status === "REJECTED" ? "Cabin rejected" : "Cabin set to pending",
                message: `${cabin.name} is now ${String(status).toLowerCase()}.`,
                type: "CABIN",
                link: "/owner/cabins",
            });
        }
        return res.status(200).json({
            message: "Cabin status updated successfully",
            cabin,
        });
    }
    catch (error) {
        console.error("Update cabin status error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}
export async function updateCabinActiveStatus(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const { id } = req.params;
        const { isActive } = req.body;
        if (typeof isActive !== "boolean") {
            return res.status(400).json({ message: "isActive must be true or false" });
        }
        const existingCabin = await prisma.cabin.findUnique({
            where: { id },
        });
        if (!existingCabin) {
            return res.status(404).json({ message: "Cabin not found" });
        }
        const isAdmin = req.user.role === "ADMIN";
        const isOwnerOfCabin = req.user.role === "OWNER" && existingCabin.ownerId === req.user.id;
        if (!isAdmin && !isOwnerOfCabin) {
            return res.status(403).json({ message: "You can only activate or deactivate your own cabins" });
        }
        const cabin = await prisma.cabin.update({
            where: { id },
            data: { isActive },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });
        if (isAdmin && cabin.ownerId) {
            await createNotification({
                userId: cabin.ownerId,
                title: isActive ? "Cabin activated" : "Cabin deactivated",
                message: `${cabin.name} has been ${isActive ? "activated" : "deactivated"} by the main admin.`,
                type: "CABIN",
                link: "/owner/cabins",
            });
        }
        return res.status(200).json({
            message: isActive
                ? "Cabin activated successfully. This does not require admin approval."
                : "Cabin deactivated successfully. This does not require admin approval.",
            cabin,
        });
    }
    catch (error) {
        console.error("Update cabin active status error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}
export async function deleteCabin(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const { id } = req.params;
        const existingCabin = await prisma.cabin.findUnique({
            where: {
                id,
            },
        });
        if (!existingCabin) {
            return res.status(404).json({
                message: "Cabin not found",
            });
        }
        const isOwnerOfCabin = req.user.role === "OWNER" && existingCabin.ownerId === req.user.id;
        if (!isOwnerOfCabin) {
            return res.status(403).json({
                message: "Only the cabin owner can delete their own cabin",
            });
        }
        await prisma.cabin.delete({
            where: {
                id,
            },
        });
        return res.status(200).json({
            message: "Cabin deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete cabin error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}
