/*
  Warnings:

  - Made the column `updatedAt` on table `TrackedProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrackedProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT DEFAULT 'guest',
    "shop" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "trackInStock" BOOLEAN NOT NULL,
    "trackOnSale" BOOLEAN NOT NULL,
    "saleThreshold" REAL,
    "trackLowStock" BOOLEAN NOT NULL,
    "lowStockLevel" INTEGER,
    "trackNewVariant" BOOLEAN NOT NULL,
    "lastKnownPrice" REAL,
    "lastInventory" INTEGER,
    "lastKnownCompareAtPrice" REAL,
    "lastKnownVariantCount" INTEGER,
    "productInfo" TEXT,
    "variantImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TrackedProduct" ("createdAt", "email", "id", "lastInventory", "lastKnownCompareAtPrice", "lastKnownPrice", "lastKnownVariantCount", "lowStockLevel", "productId", "productInfo", "saleThreshold", "shop", "trackInStock", "trackLowStock", "trackNewVariant", "trackOnSale", "updatedAt", "userId", "variantId", "variantImageUrl") SELECT "createdAt", "email", "id", "lastInventory", "lastKnownCompareAtPrice", "lastKnownPrice", "lastKnownVariantCount", "lowStockLevel", "productId", "productInfo", "saleThreshold", "shop", "trackInStock", "trackLowStock", "trackNewVariant", "trackOnSale", "updatedAt", "userId", "variantId", "variantImageUrl" FROM "TrackedProduct";
DROP TABLE "TrackedProduct";
ALTER TABLE "new_TrackedProduct" RENAME TO "TrackedProduct";
CREATE UNIQUE INDEX "TrackedProduct_userId_productId_variantId_key" ON "TrackedProduct"("userId", "productId", "variantId");
CREATE UNIQUE INDEX "TrackedProduct_email_productId_variantId_key" ON "TrackedProduct"("email", "productId", "variantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
