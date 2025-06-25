import { json } from "@remix-run/node";
import { createOrUpdateTrackedProduct } from "../models/trackedProduct.server";

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomData() {
  const randomNum = getRandomInt(100000, 999999);
  return {
    shop: "dev.myshopify.com",
    email: `user${randomNum}@example.com`,
    productId: "10653414850863",
    variantId: "51521682243887",
    trackInStock: true,
    trackOnSale: true,
    trackLowStock: true,
    trackNewVariant: true,
    saleThreshold: 200,
    lowStockLevel: 5,
    lastKnownPrice: 300,
    lastKnownCompareAtPrice: 499,
    lastInventory: 0,
    lastKnownVariantCount: 0,
  };
}

export const loader = async () => {
  const result = await createOrUpdateTrackedProduct(generateRandomData());
  return json({ result });
};
