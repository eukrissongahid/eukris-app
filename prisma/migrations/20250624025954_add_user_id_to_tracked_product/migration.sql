-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrackedProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT 'guest',
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_TrackedProduct" ("createdAt", "email", "id", "lastInventory", "lastKnownCompareAtPrice", "lastKnownPrice", "lastKnownVariantCount", "lowStockLevel", "productId", "saleThreshold", "shop", "trackInStock", "trackLowStock", "trackNewVariant", "trackOnSale", "variantId") SELECT "createdAt", "email", "id", "lastInventory", "lastKnownCompareAtPrice", "lastKnownPrice", "lastKnownVariantCount", "lowStockLevel", "productId", "saleThreshold", "shop", "trackInStock", "trackLowStock", "trackNewVariant", "trackOnSale", "variantId" FROM "TrackedProduct";
DROP TABLE "TrackedProduct";
ALTER TABLE "new_TrackedProduct" RENAME TO "TrackedProduct";
CREATE UNIQUE INDEX "TrackedProduct_userId_productId_variantId_key" ON "TrackedProduct"("userId", "productId", "variantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
