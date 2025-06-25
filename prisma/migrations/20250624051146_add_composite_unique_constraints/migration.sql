/*
  Warnings:

  - A unique constraint covering the columns `[email,productId,variantId]` on the table `TrackedProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TrackedProduct_email_productId_variantId_key" ON "TrackedProduct"("email", "productId", "variantId");
