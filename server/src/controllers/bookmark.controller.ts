import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

function ensureCustomer(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: "Not authorized" });
    return false;
  }

  if (req.user.role !== "USER") {
    res.status(403).json({ message: "Bookmarks are available only for customer accounts" });
    return false;
  }

  return true;
}

export async function getMyBookmarks(req: Request, res: Response) {
  try {
    if (!ensureCustomer(req, res)) return;

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: req.user!.id,
        cabin: {
          status: "APPROVED",
        },
      },
      include: {
        cabin: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Bookmarks fetched successfully",
      bookmarks,
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);

    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getBookmarkStatus(req: Request<{ cabinId: string }>, res: Response) {
  try {
    if (!ensureCustomer(req, res)) return;

    const { cabinId } = req.params;

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_cabinId: {
          userId: req.user!.id,
          cabinId,
        },
      },
    });

    return res.status(200).json({
      message: "Bookmark status fetched successfully",
      bookmarked: Boolean(bookmark),
    });
  } catch (error) {
    console.error("Get bookmark status error:", error);

    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function addBookmark(req: Request<{ cabinId: string }>, res: Response) {
  try {
    if (!ensureCustomer(req, res)) return;

    const { cabinId } = req.params;

    const cabin = await prisma.cabin.findUnique({ where: { id: cabinId } });

    if (!cabin || cabin.status !== "APPROVED") {
      return res.status(404).json({ message: "Cabin not found or not approved yet" });
    }

    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_cabinId: {
          userId: req.user!.id,
          cabinId,
        },
      },
      update: {},
      create: {
        userId: req.user!.id,
        cabinId,
      },
      include: {
        cabin: true,
      },
    });

    return res.status(201).json({
      message: "Cabin added to bookmarks",
      bookmark,
      bookmarked: true,
    });
  } catch (error) {
    console.error("Add bookmark error:", error);

    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function removeBookmark(req: Request<{ cabinId: string }>, res: Response) {
  try {
    if (!ensureCustomer(req, res)) return;

    const { cabinId } = req.params;

    await prisma.bookmark.deleteMany({
      where: {
        userId: req.user!.id,
        cabinId,
      },
    });

    return res.status(200).json({
      message: "Cabin removed from bookmarks",
      bookmarked: false,
    });
  } catch (error) {
    console.error("Remove bookmark error:", error);

    return res.status(500).json({ message: "Internal server error" });
  }
}
