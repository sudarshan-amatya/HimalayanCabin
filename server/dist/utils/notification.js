import { prisma } from "../config/prisma.js";
export async function createNotification(input) {
    if (!input.userId)
        return null;
    return prisma.notification.create({
        data: {
            userId: input.userId,
            title: input.title,
            message: input.message,
            type: input.type || "SYSTEM",
            link: input.link || null,
        },
    });
}
export async function notifyUsers(inputs) {
    const validInputs = inputs.filter((input) => Boolean(input.userId));
    if (validInputs.length === 0)
        return;
    await prisma.notification.createMany({
        data: validInputs.map((input) => ({
            userId: input.userId,
            title: input.title,
            message: input.message,
            type: input.type || "SYSTEM",
            link: input.link || null,
        })),
    });
}
export async function notifyAdmins(input) {
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
    });
    if (admins.length === 0)
        return;
    await notifyUsers(admins.map((admin) => ({ ...input, userId: admin.id })));
}
