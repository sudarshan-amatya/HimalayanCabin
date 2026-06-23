-- CreateEnum
CREATE TYPE "EsewaPaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('BOOKING', 'GIFT_VOUCHER', 'GIFT_CABIN');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'ESEWA';

-- AlterTable
ALTER TABLE "gifts" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ESEWA',
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAID';

-- CreateTable
CREATE TABLE "esewa_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "giftId" TEXT,
    "purpose" "PaymentPurpose" NOT NULL,
    "amount" INTEGER NOT NULL,
    "transactionUuid" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "status" "EsewaPaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "refId" TEXT,
    "transactionCode" TEXT,
    "rawResponse" JSONB,
    "giftDraft" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esewa_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "esewa_payments_transactionUuid_key" ON "esewa_payments"("transactionUuid");

-- AddForeignKey
ALTER TABLE "esewa_payments" ADD CONSTRAINT "esewa_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esewa_payments" ADD CONSTRAINT "esewa_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esewa_payments" ADD CONSTRAINT "esewa_payments_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
