import prisma from '../db.server';

export const createOrUpdateTrackedProduct = async (data: {
  email: string;
  shop: string;
  productId: string;
  variantId: string;
  userId: string;
  sku?: string;
  trackInStock?: boolean;
  trackOnSale?: boolean;
  trackBelowThreshold?: boolean;
  saleThreshold?: number;
  trackLowStock?: boolean;
  lowStockLevel?: number;
  trackNewVariant?: boolean;
  lastKnownPrice?: number;
  lastKnownCompareAtPrice?: number;
  lastKnownVariantCount?: number;
  lastInventory?: number;
  productInfo?: string;
  variantImageUrl?: string;
}) => {
  if (!data.userId) {
    throw new Error('User must be logged in to track a product.');
  }

  const preparedData = {
    ...data,
    trackInStock: data.trackInStock ?? false,
    trackOnSale: data.trackOnSale ?? false,
    trackLowStock: data.trackLowStock ?? false,
    trackNewVariant: data.trackNewVariant ?? false,
    trackBelowThreshold: data.trackBelowThreshold ?? false,
  };

  const existing = await prisma.trackedProduct.findUnique({
    where: {
      userId_productId_variantId: {
        userId: data.userId,
        productId: data.productId,
        variantId: data.variantId,
      },
    },
  });

  if (existing) {
    return prisma.trackedProduct.update({
      where: { id: existing.id },
      data: preparedData,
    });
  }

  return prisma.trackedProduct.create({ data: preparedData });
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

export const getTrackedVariantIdsByProductId = async (productId: string) => {
  const variants = await prisma.trackedProduct.findMany({
    where: { productId },
    select: { variantId: true },
  });

  return variants.map((v) => v.variantId);
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
    orderBy: { createdAt: 'desc' },
  });
};

export const deleteTrackedProduct = async (
  userId: string,
  productId: string,
  variantId: string,
) => {
  return prisma.trackedProduct.delete({
    where: {
      userId_productId_variantId: {
        userId,
        productId,
        variantId,
      },
    },
  });
};

export const deleteTrackedByProductId = async (productId: string) => {
  return prisma.trackedProduct.deleteMany({
    where: { productId },
  });
};

export const deleteTrackedByVariantIds = async (variantIds: string[]) => {
  return prisma.trackedProduct.deleteMany({
    where: {
      variantId: { in: variantIds },
    },
  });
};

export const getGroupedTrackNewVariantTrackers = async (productId: string) => {
  return prisma.trackedProduct.findMany({
    where: {
      productId,
      trackNewVariant: true,
    },
  });
};
