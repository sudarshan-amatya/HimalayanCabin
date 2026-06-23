/*
  Warnings:

  - A unique constraint covering the columns `[giftId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "GiftType" AS ENUM ('VOUCHER', 'CABIN');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('PENDING_OWNER_CONFIRMATION', 'SENT', 'ACCEPTED', 'DECLINED', 'REJECTED');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "giftId" TEXT,
ADD COLUMN     "isGift" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "giftCredit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "gifts" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "giftType" "GiftType" NOT NULL,
    "amount" INTEGER,
    "cabinId" TEXT,
    "checkInDate" TIMESTAMP(3),
    "checkOutDate" TIMESTAMP(3),
    "travellers" INTEGER,
    "message" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "totalPrice" INTEGER,
    "status" "GiftStatus" NOT NULL DEFAULT 'SENT',
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_giftId_key" ON "bookings"("giftId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_cabinId_fkey" FOREIGN KEY ("cabinId") REFERENCES "cabins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
