import { ActionFunction } from '@remix-run/node';

import {
  getTrackersByVariant,
  updateLastKnownPrice,
  updateLastKnownCompareAtPrice,
  updateLastInventory,
  updateLastKnownVariantCount,
} from '../models/trackedProduct.server';

import {
  buildBackInStockEmailBody,
  buildOnSaleEmailBody,
  buildPriceThresholdEmailBody,
  buildLowStockEmailBody,
  buildNewVariantEmailBody,
} from '../utils/emailTemplates.server';

import { authenticate } from '../shopify.server';
import { sendEmail } from '../utils/emailClient.server';
import { getProductById } from '../shopify/graphql/product';
import { getAdminGraphqlClient } from '../utils/shopify-admin';

export const action: ActionFunction = async ({ request }) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  switch (topic) {
    case 'PRODUCTS_UPDATE':
      if (session) {
        handleProductsUpdate(payload);
      }
      break;
    default:
      throw new Response('Unhandled webhook topic', { status: 404 });
  }

  throw new Response();
};

async function handleProductsUpdate(payload: any) {
  const { id: productId, variants } = payload;
  let product;
  try {
    const graphqlClient = await getAdminGraphqlClient(payload.shop);
    product = await getProductById(graphqlClient, productId);
  } catch (error) {
    console.log('❌ Error fetching product by ID:', error);
    return;
  }

  for (const variant of variants) {
    const { id: variantId, price, compare_at_price } = variant;
    const trackers = await getTrackersByVariant(String(variantId));
    const variantName = variant.title || 'this product';
    const options = variant.option_values
      ? variant.option_values.map((opt: any) => `${opt.name}: ${opt.value}`).join(', ')
      : '';
    const description = options ? `${variantName} (${options})` : variantName;

    for (const tracker of trackers) {
      if (
        tracker.trackInStock &&
        variant.inventory_quantity > 0 &&
        (tracker.lastInventory ?? 0) <= 0
      ) {
        await sendEmail({
          to: tracker.email,
          subject: `📦 Back in Stock - ${tracker.shop} | ${tracker.productInfo}`,
          html: buildBackInStockEmailBody(
            tracker,
            description,
            variant.inventory_quantity,
            product.handle,
          ),
        });
      }

      if (
        tracker.trackOnSale &&
        tracker.lastKnownPrice != price &&
        tracker.lastKnownPrice != compare_at_price
      ) {
        if (compare_at_price && parseFloat(compare_at_price) > parseFloat(price)) {
          await sendEmail({
            to: tracker.email,
            subject: `🎉 On Sale - ${tracker.shop} | ${tracker.productInfo}`,
            html: buildOnSaleEmailBody(
              tracker,
              description,
              price,
              compare_at_price,
              product.handle,
            ),
          });
        }
      }

      if (tracker.trackBelowThreshold && tracker.saleThreshold != null) {
        if (tracker.saleThreshold && parseFloat(price) <= tracker.saleThreshold) {
          await sendEmail({
            to: tracker.email,
            subject: `💸 Price Dropped Below Threshold - ${tracker.shop} | ${tracker.productInfo}`,
            html: buildPriceThresholdEmailBody(tracker, description, price, product.handle),
          });
        }
      }

      if (tracker.trackNewVariant) {
        const lastKnownVariantCount = tracker?.lastKnownVariantCount || 0;
        const currentVariantCount = payload.variants?.length || 0;
        if (currentVariantCount > lastKnownVariantCount) {
          await sendEmail({
            to: tracker.email,
            subject: `🆕 New Variant Added - ${tracker.shop} | ${tracker.productInfo}`,
            html: buildNewVariantEmailBody(
              tracker,
              lastKnownVariantCount,
              currentVariantCount,
              product.handle,
            ),
          });
        }
      }

      if (tracker.trackLowStock && tracker.lowStockLevel != null) {
        const available = variant.inventory_quantity;
        if (available < tracker.lowStockLevel) {
          await sendEmail({
            to: tracker.email,
            subject: `⚠️ Low Stock Warning - ${tracker.shop} | ${tracker.productInfo}`,
            html: buildLowStockEmailBody(tracker, description, available, product.handle),
          });
        }
      }

      await updateLastKnownPrice(tracker.id, parseFloat(price));
      await updateLastKnownCompareAtPrice(tracker.id, parseFloat(price));
      await updateLastInventory(tracker.id, variant.inventory_quantity);
      await updateLastKnownVariantCount(tracker.id, payload.variants?.length || 0);
    }
  }
}
