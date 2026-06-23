import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/notification.js";

function calculateNights(checkInDate: Date, checkOutDate: Date) {
  const difference = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(difference / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type PaymentMethod = "PAY_AT_PROPERTY" | "GIFT_CREDIT" | "ESEWA";

const bookingStatuses: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
const paymentMethods: PaymentMethod[] = ["PAY_AT_PROPERTY", "GIFT_CREDIT", "ESEWA"];

function isValidBookingStatus(status: unknown): status is BookingStatus {
  return bookingStatuses.includes(status as BookingStatus);
}

function isValidPaymentMethod(method: unknown): method is PaymentMethod {
  return paymentMethods.includes(method as PaymentMethod);
}

async function markCompletedBookings() {
  const today = startOfDay(new Date());

  await prisma.$transaction([
    prisma.booking.updateMany({
      where: {
        status: "CONFIRMED",
        checkOutDate: { lt: today },
        paymentMethod: "UNPAID",
        paymentStatus: "UNPAID",
      },
      data: {
        status: "COMPLETED",
        paymentMethod: "PAY_AT_PROPERTY",
        paymentStatus: "PENDING",
        paymentReference: "AUTO-PAY-AT-PROPERTY",
      },
    }),
    prisma.booking.updateMany({
      where: {
        status: "CONFIRMED",
        checkOutDate: { lt: today },
      },
      data: { status: "COMPLETED" },
    }),
  ]);
}

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  profileImage: true,
  role: true,
} as const;

const cabinWithOwner = {
  include: {
    owner: {
      select: userSelect,
    },
  },
} as const;

const bookingInclude = {
  cabin: cabinWithOwner,
  user: { select: userSelect },
  gift: true,
} as const;

async function withSuccessfulBookingCounts<T extends { user?: { id: string } | null }>(bookings: T[]) {
  const userIds = Array.from(new Set(bookings.map((booking) => booking.user?.id).filter(Boolean))) as string[];

  if (userIds.length === 0) return bookings;

  const grouped = await prisma.booking.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      status: "COMPLETED",
    },
    _count: { _all: true },
  });

  const countMap = new Map(grouped.map((item) => [item.userId, (item._count as { _all: number })._all]));

  return bookings.map((booking) => ({
    ...booking,
    user: booking.user
      ? {
          ...booking.user,
          successfulBookings: countMap.get(booking.user.id) || 0,
        }
      : booking.user,
  }));
}

export async function createBooking(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    if (req.user.role !== "USER") {
      return res.status(403).json({ message: "Only customer accounts can book cabins" });
    }

    const { cabinId, fullName, phone, email, checkInDate, checkOutDate, travellers, specialRequest } = req.body;

    if (!cabinId || !fullName || !phone || !email || !checkInDate || !checkOutDate || !travellers) {
      return res.status(400).json({ message: "All required booking fields must be provided" });
    }

    const cabin = await prisma.cabin.findUnique({ where: { id: cabinId } });

    if (!cabin || cabin.status !== "APPROVED" || !cabin.isActive) {
      return res.status(404).json({ message: "Cabin not found, inactive, or not approved yet" });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return res.status(400).json({ message: "Invalid check-in or check-out date" });
    }

    const today = startOfDay(new Date());
    const checkInDay = startOfDay(checkIn);

    if (checkInDay < today) {
      return res.status(400).json({
        message: "Check-in date cannot be in the past. Please choose today or a future date.",
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: "Check-out date must be after check-in date" });
    }

    const people = Number(travellers);

    if (people < 1) return res.status(400).json({ message: "Travellers must be at least 1" });

    const nights = calculateNights(checkIn, checkOut);
    const totalPrice = cabin.price * people * nights;

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        cabinId,
        fullName: String(fullName).trim(),
        phone: String(phone).trim(),
        email: String(email).trim().toLowerCase(),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        travellers: people,
        specialRequest: specialRequest ? String(specialRequest).trim() : null,
        totalPrice,
      },
      include: bookingInclude,
    });

    if (booking.cabin.owner?.id) {
      await createNotification({
        userId: booking.cabin.owner.id,
        title: "New booking request",
        message: `${booking.fullName} requested ${booking.cabin.name} for ${booking.travellers} traveller(s).`,
        type: "BOOKING",
        link: `/owner/bookings/${booking.id}`,
      });
    }

    await createNotification({
      userId: req.user.id,
      title: "Booking request sent",
      message: `Your request for ${booking.cabin.name} is pending owner confirmation.`,
      type: "BOOKING",
      link: `/my-bookings/${booking.id}`,
    });

    return res.status(201).json({
      message: "Booking request sent successfully. The cabin owner will confirm availability.",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyBookings(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (req.user.role !== "USER") return res.status(403).json({ message: "Only customer accounts have personal bookings" });

    await markCompletedBookings();

    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: { cabin: cabinWithOwner, gift: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ message: "My bookings fetched successfully", bookings });
  } catch (error) {
    console.error("Get my bookings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyBookingById(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (req.user.role !== "USER") return res.status(403).json({ message: "Only customer accounts have personal bookings" });

    await markCompletedBookings();

    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { cabin: cabinWithOwner, gift: true },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    return res.status(200).json({ message: "Booking details fetched successfully", booking });
  } catch (error) {
    console.error("Get my booking details error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllBookings(_req: Request, res: Response) {
  try {
    await markCompletedBookings();

    const bookings = await prisma.booking.findMany({
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      message: "All bookings fetched successfully",
      bookings: await withSuccessfulBookingCounts(bookings),
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminBookingById(req: Request<{ id: string }>, res: Response) {
  try {
    await markCompletedBookings();

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: bookingInclude,
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const [bookingWithStats] = await withSuccessfulBookingCounts([booking]);

    return res.status(200).json({ message: "Booking details fetched successfully", booking: bookingWithStats });
  } catch (error) {
    console.error("Get admin booking details error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOwnerBookings(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    await markCompletedBookings();

    const bookings = await prisma.booking.findMany({
      where: { cabin: { ownerId: req.user.id } },
      include: {
        cabin: true,
        user: { select: userSelect },
        gift: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      message: "Owner bookings fetched successfully",
      bookings: await withSuccessfulBookingCounts(bookings),
    });
  } catch (error) {
    console.error("Get owner bookings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOwnerBookingById(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    await markCompletedBookings();

    const booking = await prisma.booking.findFirst({
      where: {
        id: req.params.id,
        cabin: { ownerId: req.user.id },
      },
      include: {
        cabin: true,
        user: { select: userSelect },
        gift: true,
      },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found for your cabins" });

    const [bookingWithStats] = await withSuccessfulBookingCounts([booking]);

    return res.status(200).json({ message: "Booking details fetched successfully", booking: bookingWithStats });
  } catch (error) {
    console.error("Get owner booking details error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBookingStatus(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidBookingStatus(status)) return res.status(400).json({ message: "Invalid booking status" });

    const bookingExists = await prisma.booking.findUnique({ where: { id } });
    if (!bookingExists) return res.status(404).json({ message: "Booking not found" });

    if (bookingExists.status === "COMPLETED" && status !== "COMPLETED") {
      return res.status(400).json({ message: "Completed bookings cannot be moved back to another status" });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: bookingInclude,
    });

    await createNotification({
      userId: booking.userId,
      title: status === "CONFIRMED" ? "Booking confirmed" : status === "CANCELLED" ? "Booking cancelled" : "Booking status updated",
      message: `${booking.cabin.name} is now ${status.toLowerCase()}.`,
      type: "BOOKING",
      link: `/my-bookings/${booking.id}`,
    });

    return res.status(200).json({ message: "Booking status updated successfully", booking });
  } catch (error) {
    console.error("Update booking status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateOwnerBookingStatus(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    const { id } = req.params;
    const { status } = req.body;

    if (!isValidBookingStatus(status)) return res.status(400).json({ message: "Invalid booking status" });
    if (status === "COMPLETED") {
      return res.status(400).json({ message: "Completed status is automatic after the check-out date passes" });
    }

    const bookingExists = await prisma.booking.findFirst({
      where: { id, cabin: { ownerId: req.user.id } },
    });

    if (!bookingExists) return res.status(404).json({ message: "Booking not found for your cabins" });
    if (bookingExists.status === "COMPLETED") return res.status(400).json({ message: "Completed bookings cannot be changed" });

    if (bookingExists.status === "CONFIRMED" && status !== "CONFIRMED") {
      return res.status(403).json({
        message: "Confirmed bookings are locked for owners. Please contact the main admin to cancel or move this booking back to pending.",
      });
    }

    if (bookingExists.status === "CANCELLED" && status === "PENDING") {
      return res.status(403).json({ message: "Cancelled bookings can only be restored by the main admin." });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        cabin: true,
        user: { select: userSelect },
        gift: true,
      },
    });

    await createNotification({
      userId: booking.userId,
      title: status === "CONFIRMED" ? "Booking confirmed" : status === "CANCELLED" ? "Booking cancelled" : "Booking status updated",
      message: `${booking.cabin.name} is now ${status.toLowerCase()}.`,
      type: "BOOKING",
      link: `/my-bookings/${booking.id}`,
    });

    return res.status(200).json({ message: "Booking status updated successfully", booking });
  } catch (error) {
    console.error("Update owner booking status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateMyBookingPayment(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (req.user.role !== "USER") return res.status(403).json({ message: "Only customer accounts can pay for bookings" });

    const { id } = req.params;
    const { paymentMethod } = req.body;

    if (!isValidPaymentMethod(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id, userId: req.user!.id },
        include: { cabin: cabinWithOwner, gift: true },
      });

      if (!booking) throw new Error("Booking not found");
      if (booking.status !== "CONFIRMED") throw new Error("Payment can be selected only after the owner confirms your booking");
      if (booking.paymentStatus === "PAID") throw new Error("This booking is already paid");

      if (paymentMethod === "PAY_AT_PROPERTY") {
        const updatedBooking = await tx.booking.update({
          where: { id },
          data: {
            paymentMethod: "PAY_AT_PROPERTY",
            paymentStatus: "PENDING",
            paymentReference: null,
            paidAt: null,
            giftCreditUsed: 0,
          },
          include: { cabin: cabinWithOwner, gift: true },
        });

        return { booking: updatedBooking, user: null, message: "Payment method set to Pay at Property." };
      }

      if (paymentMethod === "ESEWA") {
        throw new Error("Please use the eSewa payment button. It will redirect you to eSewa and verify the payment before marking it paid.");
      }

      const user = await tx.user.findUnique({ where: { id: req.user!.id } });
      if (!user) throw new Error("User not found");
      if (user.giftCredit < booking.totalPrice) {
        throw new Error(`Not enough gift credit. Available credit: Rs. ${user.giftCredit.toLocaleString()}`);
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { giftCredit: { decrement: booking.totalPrice } },
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

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          paymentMethod: "GIFT_CREDIT",
          paymentStatus: "PAID",
          paymentReference: `GIFT-CREDIT-${Date.now()}`,
          paidAt: new Date(),
          giftCreditUsed: booking.totalPrice,
        },
        include: { cabin: cabinWithOwner, gift: true },
      });

      return { booking: updatedBooking, user: updatedUser, message: "Booking paid using gift credit." };
    });

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment update failed";
    console.error("Update booking payment error:", error);
    return res.status(message === "Booking not found" ? 404 : 400).json({ message });
  }
}

export async function cancelMyBooking(req: Request<{ id: string }>, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (req.user.role !== "USER") return res.status(403).json({ message: "Only customer accounts can cancel personal bookings" });

    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.userId !== req.user.id) return res.status(403).json({ message: "You cannot cancel this booking" });
    if (booking.status === "COMPLETED") return res.status(400).json({ message: "Completed bookings cannot be cancelled" });
    if (booking.paymentStatus === "PAID" && booking.paymentMethod !== "GIFT_CREDIT") {
      return res.status(400).json({ message: "Paid bookings cannot be cancelled here. Please contact support." });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { cabin: cabinWithOwner, gift: true },
    });

    return res.status(200).json({ message: "Booking cancelled successfully", booking: updatedBooking });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
