import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/notification.js";
import { checkEsewaStatus, createEsewaFormPayload, decodeEsewaData, generateTransactionUuid, getEsewaConfig, getFrontendUrl, verifyEsewaResponseSignature, } from "../utils/esewa.js";
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
function redirect(res, path) {
    return res.redirect(`${getFrontendUrl()}${path}`);
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
    sender: { select: userSelect },
    recipient: { select: userSelect },
    cabin: { include: { owner: { select: userSelect } } },
    booking: { include: { cabin: true } },
};
function buildPaymentResponse(amount, transactionUuid) {
    return {
        actionUrl: getEsewaConfig().formUrl,
        payload: createEsewaFormPayload(amount, transactionUuid),
    };
}
export async function initiateBookingEsewaPayment(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        if (req.user.role !== "USER")
            return res.status(403).json({ message: "Only guest accounts can pay for bookings" });
        const booking = await prisma.booking.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!booking)
            return res.status(404).json({ message: "Booking not found" });
        if (booking.status !== "CONFIRMED") {
            return res.status(400).json({ message: "eSewa payment can be made only after the owner confirms your booking" });
        }
        if (booking.paymentStatus === "PAID") {
            return res.status(400).json({ message: "This booking is already paid" });
        }
        const transactionUuid = generateTransactionUuid("BOOKING");
        await prisma.$transaction(async (tx) => {
            await tx.esewaPayment.create({
                data: {
                    userId: req.user.id,
                    bookingId: booking.id,
                    purpose: "BOOKING",
                    amount: booking.totalPrice,
                    transactionUuid,
                    productCode: getEsewaConfig().productCode,
                    status: "INITIATED",
                },
            });
            await tx.booking.update({
                where: { id: booking.id },
                data: {
                    paymentMethod: "ESEWA",
                    paymentStatus: "PENDING",
                    paymentReference: transactionUuid,
                    giftCreditUsed: 0,
                    paidAt: null,
                },
            });
        });
        return res.status(200).json({
            message: "Redirecting to eSewa payment gateway.",
            ...buildPaymentResponse(booking.totalPrice, transactionUuid),
        });
    }
    catch (error) {
        console.error("Initiate booking eSewa error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function initiateGiftEsewaPayment(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        if (req.user.role !== "USER")
            return res.status(403).json({ message: "Only guest accounts can send gifts" });
        const { giftType, recipientName, recipientEmail, senderName, amount, cabinId, checkInDate, checkOutDate, travellers, message, deliveryDate, } = req.body;
        if (!recipientName || !recipientEmail || !senderName || !giftType) {
            return res.status(400).json({ message: "Recipient name, recipient email, sender name, and gift type are required" });
        }
        const normalizedRecipientEmail = normalizeEmail(recipientEmail);
        if (!normalizedRecipientEmail.includes("@"))
            return res.status(400).json({ message: "Please enter a valid recipient email" });
        const recipient = await prisma.user.findUnique({ where: { email: normalizedRecipientEmail }, select: userSelect });
        if (!recipient || recipient.role !== "USER") {
            return res.status(404).json({
                message: "Recipient user is not registered in our system as a guest account. Gifts can only be sent to registered guest users.",
            });
        }
        if (recipient.id === req.user.id)
            return res.status(400).json({ message: "You cannot send a gift to yourself" });
        let paymentAmount = 0;
        const draft = {
            giftType,
            recipientName: String(recipientName).trim(),
            recipientEmail: normalizedRecipientEmail,
            recipientId: recipient.id,
            senderName: String(senderName).trim(),
            message: message ? String(message).trim() : null,
            deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        };
        if (giftType === "VOUCHER") {
            const voucherAmount = Number(amount);
            if (!voucherAmount || voucherAmount < 1000)
                return res.status(400).json({ message: "Voucher amount should be at least Rs. 1,000" });
            paymentAmount = voucherAmount;
            draft.amount = voucherAmount;
        }
        else if (giftType === "CABIN") {
            if (!cabinId || !checkInDate || !checkOutDate || !travellers) {
                return res.status(400).json({ message: "Cabin, check-in, check-out, and travellers are required for cabin gifts" });
            }
            const cabin = await prisma.cabin.findUnique({ where: { id: cabinId } });
            if (!cabin || cabin.status !== "APPROVED" || !cabin.isActive)
                return res.status(404).json({ message: "Cabin not found, inactive, or not approved yet" });
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);
            if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()))
                return res.status(400).json({ message: "Invalid check-in or check-out date" });
            if (startOfDay(checkIn) < startOfDay(new Date()))
                return res.status(400).json({ message: "Check-in date cannot be in the past" });
            if (checkOut <= checkIn)
                return res.status(400).json({ message: "Check-out date must be after check-in date" });
            const people = Number(travellers);
            if (people < 1)
                return res.status(400).json({ message: "Travellers must be at least 1" });
            paymentAmount = cabin.price * people * calculateNights(checkIn, checkOut);
            draft.cabinId = cabinId;
            draft.checkInDate = checkIn.toISOString();
            draft.checkOutDate = checkOut.toISOString();
            draft.travellers = people;
            draft.totalPrice = paymentAmount;
        }
        else {
            return res.status(400).json({ message: "Invalid gift type" });
        }
        const transactionUuid = generateTransactionUuid(giftType === "VOUCHER" ? "GIFT-VOUCHER" : "GIFT-CABIN");
        await prisma.esewaPayment.create({
            data: {
                userId: req.user.id,
                purpose: giftType === "VOUCHER" ? "GIFT_VOUCHER" : "GIFT_CABIN",
                amount: paymentAmount,
                transactionUuid,
                productCode: getEsewaConfig().productCode,
                status: "INITIATED",
                giftDraft: draft,
            },
        });
        return res.status(200).json({
            message: "Please complete eSewa payment first. The gift will be created only after payment success.",
            ...buildPaymentResponse(paymentAmount, transactionUuid),
        });
    }
    catch (error) {
        console.error("Initiate gift eSewa error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function esewaSuccess(req, res) {
    try {
        const decoded = decodeEsewaData(req.query.data);
        if (!verifyEsewaResponseSignature(decoded)) {
            return redirect(res, "/payment/failure?reason=invalid-signature");
        }
        const transactionUuid = String(decoded.transaction_uuid || "");
        const responseAmount = Number(decoded.total_amount || 0);
        const cleanResponse = JSON.parse(JSON.stringify(decoded));
        if (!transactionUuid || !responseAmount) {
            return redirect(res, "/payment/failure?reason=missing-payment-data");
        }
        const payment = await prisma.esewaPayment.findUnique({ where: { transactionUuid } });
        if (!payment)
            return redirect(res, "/payment/failure?reason=payment-not-found");
        if (payment.amount !== responseAmount) {
            return redirect(res, "/payment/failure?reason=amount-mismatch");
        }
        const statusResult = await checkEsewaStatus(payment.transactionUuid, payment.amount);
        const status = statusResult.status || decoded.status;
        const refId = statusResult.ref_id || String(decoded.transaction_code || "");
        if (status !== "COMPLETE") {
            await prisma.esewaPayment.update({
                where: { id: payment.id },
                data: { status: status === "PENDING" ? "PENDING" : "FAILED", rawResponse: cleanResponse },
            });
            return redirect(res, `/payment/failure?reason=${encodeURIComponent(String(status || "not-complete"))}`);
        }
        const result = await prisma.$transaction(async (tx) => {
            const existingPayment = await tx.esewaPayment.findUnique({ where: { id: payment.id } });
            if (!existingPayment)
                throw new Error("Payment not found");
            if (existingPayment.status === "COMPLETE") {
                return { bookingId: existingPayment.bookingId, giftId: existingPayment.giftId, purpose: existingPayment.purpose };
            }
            await tx.esewaPayment.update({
                where: { id: existingPayment.id },
                data: {
                    status: "COMPLETE",
                    refId,
                    transactionCode: String(decoded.transaction_code || refId || ""),
                    rawResponse: cleanResponse,
                },
            });
            if (existingPayment.purpose === "BOOKING") {
                if (!existingPayment.bookingId)
                    throw new Error("Booking missing for payment");
                const booking = await tx.booking.update({
                    where: { id: existingPayment.bookingId },
                    data: {
                        paymentMethod: "ESEWA",
                        paymentStatus: "PAID",
                        paymentReference: refId || existingPayment.transactionUuid,
                        paidAt: new Date(),
                        giftCreditUsed: 0,
                    },
                });
                return { bookingId: booking.id, giftId: null, purpose: existingPayment.purpose };
            }
            const draft = existingPayment.giftDraft;
            if (!draft)
                throw new Error("Gift draft missing for payment");
            const gift = await tx.gift.create({
                data: {
                    senderId: existingPayment.userId,
                    recipientId: draft.recipientId,
                    recipientName: draft.recipientName,
                    recipientEmail: draft.recipientEmail,
                    senderName: draft.senderName,
                    giftType: draft.giftType,
                    amount: draft.giftType === "VOUCHER" ? draft.amount : null,
                    cabinId: draft.giftType === "CABIN" ? draft.cabinId : null,
                    checkInDate: draft.checkInDate ? new Date(draft.checkInDate) : null,
                    checkOutDate: draft.checkOutDate ? new Date(draft.checkOutDate) : null,
                    travellers: draft.travellers || null,
                    message: draft.message || null,
                    deliveryDate: draft.deliveryDate ? new Date(draft.deliveryDate) : null,
                    totalPrice: draft.totalPrice || null,
                    status: draft.giftType === "CABIN" ? "PENDING_OWNER_CONFIRMATION" : "SENT",
                    paymentMethod: "ESEWA",
                    paymentStatus: "PAID",
                    paymentReference: refId || existingPayment.transactionUuid,
                    paidAt: new Date(),
                },
                include: giftInclude,
            });
            await tx.esewaPayment.update({ where: { id: existingPayment.id }, data: { giftId: gift.id } });
            return { bookingId: null, giftId: gift.id, purpose: existingPayment.purpose };
        });
        if (result.purpose === "BOOKING") {
            if (result.bookingId) {
                const booking = await prisma.booking.findUnique({ where: { id: result.bookingId }, include: { cabin: true } });
                if (booking) {
                    await createNotification({
                        userId: booking.userId,
                        title: "eSewa payment successful",
                        message: `Your payment for ${booking.cabin.name} was verified successfully.`,
                        type: "PAYMENT",
                        link: `/my-bookings/${booking.id}`,
                    });
                }
            }
            return redirect(res, `/payment/success?type=booking&bookingId=${result.bookingId}`);
        }
        if (result.giftId) {
            const gift = await prisma.gift.findUnique({
                where: { id: result.giftId },
                include: { recipient: true, cabin: { include: { owner: true } } },
            });
            if (gift?.giftType === "VOUCHER") {
                await createNotification({
                    userId: gift.recipientId,
                    title: "Gift voucher received",
                    message: `${gift.senderName} sent you a Rs. ${(gift.amount || 0).toLocaleString()} gift voucher.`,
                    type: "GIFT",
                    link: "/my-gifts",
                });
            }
            if (gift?.giftType === "CABIN") {
                await createNotification({
                    userId: gift.cabin?.ownerId,
                    title: "Cabin gift needs approval",
                    message: `${gift.senderName} paid for a cabin gift. Please confirm availability before it is sent.`,
                    type: "GIFT",
                    link: "/owner/bookings",
                });
            }
        }
        return redirect(res, `/payment/success?type=gift&giftId=${result.giftId}`);
    }
    catch (error) {
        console.error("eSewa success error:", error);
        return redirect(res, "/payment/failure?reason=server-error");
    }
}
export async function esewaFailure(_req, res) {
    return redirect(res, "/payment/failure?reason=cancelled-or-failed");
}
