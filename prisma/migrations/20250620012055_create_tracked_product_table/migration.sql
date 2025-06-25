-- CreateTable
CREATE TABLE "TrackedProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
