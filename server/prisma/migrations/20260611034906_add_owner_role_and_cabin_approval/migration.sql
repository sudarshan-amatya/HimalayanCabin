-- CreateEnum
CREATE TYPE "CabinStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OWNER';

-- AlterTable
ALTER TABLE "cabins" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "status" "CabinStatus" NOT NULL DEFAULT 'APPROVED';

-- AddForeignKey
ALTER TABLE "cabins" ADD CONSTRAINT "cabins_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
