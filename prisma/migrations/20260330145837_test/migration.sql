/*
  Warnings:

  - You are about to drop the column `isPrimary` on the `ProductImage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "isPrimary";

-- CreateTable
CREATE TABLE "_Wishlist" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Wishlist_AB_unique" ON "_Wishlist"("A", "B");

-- CreateIndex
CREATE INDEX "_Wishlist_B_index" ON "_Wishlist"("B");

-- AddForeignKey
ALTER TABLE "_Wishlist" ADD CONSTRAINT "_Wishlist_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Wishlist" ADD CONSTRAINT "_Wishlist_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
