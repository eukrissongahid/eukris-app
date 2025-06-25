import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { createOrUpdateTrackedProduct, getTrackedProduct } from "../models/trackedProduct.server";
import { getAdminGraphqlClient } from "../utils/shopify-admin";
import { getProductById } from "../shopify/graphql/product";

export const loader = async ({ request }: { request: Request }) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) {
    return json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "guest";
  console.log("✅ ✅ ✅ userId: ", userId);
  const productId = url.searchParams.get("productId");
  console.log("✅ ✅ ✅ productId: ", productId);
  const variantId = url.searchParams.get("variantId");
  console.log("✅ ✅ ✅ variantId: ", variantId);

  if (!productId || !variantId) {
    return json({ success: false, message: "Missing productId or variantId" }, { status: 400 });
  }

  try {
    const tracker = await getTrackedProduct(userId, productId, variantId);

    return json({
      success: true,
      tracker,
    });
  } catch (error) {
    console.error("❌ Failed to fetch tracker:", error);
    return json({ success: false, message: "Failed to fetch tracker" }, { status: 500 });
  }
};

export const action = async ({ request }: { request: Request }) => {
  const { session: proxySession } = await authenticate.public.appProxy(request);
  if (!proxySession) {
    return json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const shop = proxySession.shop;

  try {
    const body = await request.json();

    console.log("✅ ✅ ✅ proxy body: ", JSON.stringify(body, null, 2));

    const graphqlClient = await getAdminGraphqlClient(shop);
    const product = await getProductById(graphqlClient, body.productId);

    function getVariantById(product: any, variantId: string) {
      if (!product?.variants?.edges) return undefined;
      return product.variants.edges.find(
        (edge: any) => edge.node.id === variantId
      )?.node;
    }

    const variant = getVariantById(product, body.variantId);

    await createOrUpdateTrackedProduct({
      email: body.email,
      shop,
      userId: body.userId || "guest",
      productId: body.productId,
      variantId: body.variantId,
      trackInStock: body.trackInStock === "on",
      trackOnSale: body.trackOnSale === "on",
      saleThreshold: body.saleThreshold
        ? parseFloat(body.saleThreshold)
        : undefined,
      trackLowStock: body.trackLowStock === "on",
      lowStockLevel: body.lowStockLevel
        ? parseInt(body.lowStockLevel)
        : undefined,
      trackNewVariant: body.trackNewVariant === "on",
      lastKnownPrice: variant?.price
        ? parseFloat(variant.price) : 0,
      lastKnownCompareAtPrice: variant?.compareAtPrice
        ? parseFloat(variant.compareAtPrice) : 0,
      lastKnownVariantCount: product?.variants?.edges.length || 0,
      lastInventory: variant?.inventoryQuantity
        ? parseInt(variant.inventoryQuantity) : 0,
    });

    return json({
      success: true,
      message: "Tracking saved successfully.",
      productInfo: product,
      variantInfo: variant,
    });
  } catch (error) {
    console.error("App Proxy Error:", error);
    return json(
      { success: false, message: "Failed to save tracking." },
      { status: 500 },
    );
  }
};
