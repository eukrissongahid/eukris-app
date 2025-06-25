import prisma from "../db.server";

export const createOrUpdateTrackedProduct = async (data: {
  email: string;
  shop: string;
  productId: string;
  variantId: string;
  userId?: string;
  trackInStock?: boolean;
  trackOnSale?: boolean;
  saleThreshold?: number;
  trackLowStock?: boolean;
  lowStockLevel?: number;
  trackNewVariant?: boolean;
  lastKnownPrice?: number;
  lastKnownCompareAtPrice?: number;
  lastKnownVariantCount?: number;
  lastInventory?: number;
}) => {
  const userId = data.userId ?? "guest";

  const preparedData = {
    ...data,
    userId,
    trackInStock: data.trackInStock ?? false,
    trackOnSale: data.trackOnSale ?? false,
    trackLowStock: data.trackLowStock ?? false,
    trackNewVariant: data.trackNewVariant ?? false,
  };

  let existing;

  if (userId === "guest") {
    existing = await prisma.trackedProduct.findFirst({
      where: {
        email: data.email,
        productId: data.productId,
        variantId: data.variantId,
      },
    });
  } else {
    existing = await prisma.trackedProduct.findUnique({
      where: {
        userId_productId_variantId: {
          userId,
          productId: data.productId,
          variantId: data.variantId,
        },
      },
    });
  }

  if (existing) {
    return prisma.trackedProduct.update({
      where: { id: existing.id },
      data: preparedData,
    });
  } else {
    return prisma.trackedProduct.create({ data: preparedData });
  }
};

export const getTrackedProduct = async (userId: string, productId: string, variantId: string) => {
  return prisma.trackedProduct.findUnique({
    where: {
      userId_productId_variantId: {
        userId,
        productId,
        variantId,
      },
    },
  });
};

export const getTrackersByVariant = (variantId: string) => {
  return prisma.trackedProduct.findMany({
    where: { variantId },
  });
};

export const getTrackersByProduct = (productId: string) => {
  return prisma.trackedProduct.findMany({
    where: { productId },
  });
};

export const updateLastKnownPrice = (id: string, price: number) => {
  return prisma.trackedProduct.update({
    where: { id },
    data: { lastKnownPrice: price },
  });
};

export const updateLastKnownCompareAtPrice = (id: string, price: number) => {
  return prisma.trackedProduct.update({
    where: { id },
    data: { lastKnownCompareAtPrice: price },
  });
};

export const updateLastInventory = (id: string, inventory: number) => {
  return prisma.trackedProduct.update({
    where: { id },
    data: { lastInventory: inventory },
  });
};

export const updateLastKnownVariantCount = (id: string, varaintCount: number) => {
  return prisma.trackedProduct.update({
    where: { id },
    data: { lastKnownVariantCount: varaintCount },
  });
};

export const getTrackedProductsByShop = (shop: string) => {
  return prisma.trackedProduct.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
};

export const deleteTrackedProduct = (id: string) => {
  return prisma.trackedProduct.delete({ where: { id } });
};
