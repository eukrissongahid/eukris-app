import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  createOrUpdateTrackedProduct,
  getTrackedProduct,
} from "../models/trackedProduct.server";
import { getAdminGraphqlClient } from "../utils/shopify-admin";
import { getProductById } from "../shopify/graphql/product";

export const loader = async ({ request }: { request: Request }) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) {
    return json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "guest";
  const productId = url.searchParams.get("productId");
  const variantId = url.searchParams.get("variantId");

  if (!productId || !variantId) {
    return json(
      { success: false, message: "Missing productId or variantId" },
      { status: 400 },
    );
  }

  try {
    const tracker = await getTrackedProduct(userId, productId, variantId);

    return json({
      success: true,
      tracker,
    });
  } catch (error) {
    return json(
      { success: false, message: "Failed to fetch tracker" },
      { status: 500 },
    );
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
    console.log("✅ ✅ ✅ shop : ", shop);

    const graphqlClient = await getAdminGraphqlClient(shop);
    const product = await getProductById(graphqlClient, body.productId);

    function getVariantById(product: any, variantId: string) {
      if (!product?.variants?.edges) return undefined;

      const normalizedId = variantId.replace(
        /^gid:\/\/shopify\/ProductVariant\//,
        "",
      );

      return product.variants.edges.find((edge: any) => {
        const edgeId = edge.node.id.replace(
          /^gid:\/\/shopify\/ProductVariant\//,
          "",
        );
        return edgeId === normalizedId;
      })?.node;
    }

    const variant = getVariantById(product, body.variantId);
    console.log("✅ ✅ ✅ product: ", JSON.stringify(product, null, 2));
    console.log("✅ ✅ ✅ variant: ", JSON.stringify(variant, null, 2));

    await createOrUpdateTrackedProduct({
      email: body.email,
      shop,
      userId: body.userId,
      productId: body.productId,
      variantId: body.variantId,
      trackInStock: body.trackInStock === "on",
      trackOnSale: body.trackOnSale === "on",
      trackBelowThreshold: body.trackBelowThreshold === "on",
      saleThreshold: body.saleThreshold ? parseFloat(body.saleThreshold) : 0,
      trackLowStock: body.trackLowStock === "on",
      lowStockLevel: body.lowStockLevel ? parseInt(body.lowStockLevel) : 0,
      trackNewVariant: body.trackNewVariant === "on",
      lastKnownPrice: variant?.price ? parseFloat(variant.price) : 0,
      lastKnownCompareAtPrice: variant?.compareAtPrice
        ? parseFloat(variant.compareAtPrice)
        : 0,
      lastKnownVariantCount: product?.variants?.edges.length || 0,
      lastInventory: variant?.inventoryQuantity
        ? parseInt(variant.inventoryQuantity)
        : 0,
      productInfo: `${product?.title || ""} ${variant?.title || ""}`.trim(),
      variantImageUrl: variant?.image?.url || "",
    });

    return json({
      success: true,
      message: "Tracking saved successfully.",
      productInfo: product,
      variantInfo: variant,
    });
  } catch (error) {
    console.log("❌ Failed to create or update tracked product:", error);
    return json(
      { success: false, message: "Failed to save tracking." },
      { status: 500 },
    );
  }
};
