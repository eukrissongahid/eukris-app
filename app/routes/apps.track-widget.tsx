import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import {
  createOrUpdateTrackedProduct,
  getTrackedProduct,
  deleteTrackedProduct,
} from '../models/trackedProduct.server';
import { getAdminGraphqlClient } from '../utils/shopify-admin';
import { getProductById } from '../shopify/graphql/product';

export const loader = async ({ request }: { request: Request }) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) {
    return json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') ?? '';
  const productId = url.searchParams.get('productId');
  const variantId = url.searchParams.get('variantId');

  if (!productId || !variantId) {
    return json({ success: false, message: 'Missing productId or variantId' }, { status: 400 });
  }

  try {
    const tracker = await getTrackedProduct(userId, productId, variantId);

    return json({
      success: true,
      tracker,
    });
  } catch (error) {
    return json({ success: false, message: 'Failed to fetch tracker' }, { status: 500 });
  }
};

export const action = async ({ request }: { request: Request }) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session) {
    return json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const shop = session.shop;

  if (request.method === 'DELETE') {
    const { userId, productId, variantId } = await request.json();
    if (!userId || !productId || !variantId) {
      return json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    try {
      await deleteTrackedProduct(userId, productId, variantId);
      return json({ success: true, message: 'Product untracked successfully.' });
    } catch (error) {
      console.error('❌ Failed to delete tracked product:', error);
      return json({ success: false, message: 'Failed to untrack product.' }, { status: 500 });
    }
  }

  try {
    const body = await request.json();
    const graphqlClient = await getAdminGraphqlClient(shop);
    const product = await getProductById(graphqlClient, body.productId);
    const variant = getVariantById(product, body.variantId);

    await createOrUpdateTrackedProduct({
      email: body.email,
      shop,
      userId: body.userId,
      productId: body.productId,
      variantId: body.variantId,
      sku: variant?.sku || '',
      trackInStock: body.trackInStock === 'on',
      trackOnSale: body.trackOnSale === 'on',
      trackBelowThreshold: body.trackBelowThreshold === 'on',
      saleThreshold: body.saleThreshold ? parseFloat(body.saleThreshold) : 0,
      trackLowStock: body.trackLowStock === 'on',
      lowStockLevel: body.lowStockLevel ? parseInt(body.lowStockLevel) : 0,
      trackNewVariant: body.trackNewVariant === 'on',
      lastKnownPrice: variant?.price ? parseFloat(variant.price) : 0,
      lastKnownCompareAtPrice: variant?.compareAtPrice ? parseFloat(variant.compareAtPrice) : 0,
      lastKnownVariantCount: product?.variants?.edges.length || 0,
      lastInventory: variant?.inventoryQuantity ? parseInt(variant.inventoryQuantity) : 0,
      productInfo: `${product?.title || ''} ${variant?.title || ''}`.trim(),
      variantImageUrl: variant?.image?.url || '',
    });

    return json({
      success: true,
      message: 'Tracking saved successfully.',
      productInfo: product,
      variantInfo: variant,
    });
  } catch (error) {
    console.log('❌ Failed to create or update tracked product:', error);
    return json({ success: false, message: 'Failed to save tracking.' }, { status: 500 });
  }
};

function getVariantById(product: any, variantId: string) {
  if (!product?.variants?.edges) return undefined;

  const normalizedId = variantId.replace(/^gid:\/\/shopify\/ProductVariant\//, '');

  return product.variants.edges.find((edge: any) => {
    const edgeId = edge.node.id.replace(/^gid:\/\/shopify\/ProductVariant\//, '');
    return edgeId === normalizedId;
  })?.node;
}
