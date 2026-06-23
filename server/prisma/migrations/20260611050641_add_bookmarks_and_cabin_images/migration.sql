-- AlterTable
ALTER TABLE "cabins" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "facilities" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cabinId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_cabinId_key" ON "bookmarks"("userId", "cabinId");

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_cabinId_fkey" FOREIGN KEY ("cabinId") REFERENCES "cabins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
