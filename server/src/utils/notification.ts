import { prisma } from "../config/prisma.js";
import type { NotificationType } from "@prisma/client";

type NotifyInput = {
  userId?: string | null;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
};

export async function createNotification(input: NotifyInput) {
  if (!input.userId) return null;

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

export async function notifyUsers(inputs: NotifyInput[]) {
  const validInputs = inputs.filter((input) => Boolean(input.userId));
  if (validInputs.length === 0) return;

  await prisma.notification.createMany({
    data: validInputs.map((input) => ({
      userId: input.userId!,
      title: input.title,
      message: input.message,
      type: input.type || "SYSTEM",
      link: input.link || null,
    })),
  });
}

export async function notifyAdmins(input: Omit<NotifyInput, "userId">) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await notifyUsers(admins.map((admin: { id: string }) => ({ ...input, userId: admin.id })));
}
