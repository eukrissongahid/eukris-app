import { ActionFunction } from '@remix-run/node';

import {
  getTrackersByVariant,
  updateLastKnownPrice,
  updateLastKnownCompareAtPrice,
  updateLastInventory,
  updateLastKnownVariantCount,
  deleteTrackedByProductId,
  deleteTrackedByVariantIds,
  getTrackedVariantIdsByProductId,
  getGroupedTrackNewVariantTrackers,
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
    case 'PRODUCTS_DELETE':
      if (session) {
        handleProductDelete(payload);
      }
      break;
    default:
      throw new Response('Unhandled webhook topic', { status: 404 });
  }

  throw new Response();
};

async function handleProductsUpdate(payload: any) {
  const { id: productId, variants, title: productTitle } = payload;
  const currentVariantCount = variants.length;

  const newVariantIds = variants.map((v: any) => String(v.id));
  const existingVariantIds = await getTrackedVariantIdsByProductId(String(productId));
  const removedVariantIds = existingVariantIds.filter((id) => !newVariantIds.includes(id));
  if (removedVariantIds.length > 0) {
    await deleteTrackedByVariantIds(removedVariantIds);
  }

  // const oldVariantIds = new Set(existingVariantIds);
  // console.log('🆕 oldVariantIds:', oldVariantIds);
  // const newVariants = variants.filter((v: any) => !oldVariantIds.has(String(v.id)));
  // console.log('🆕 New Variants:', newVariants);

  let product;
  try {
    const graphqlClient = await getAdminGraphqlClient(payload.shop);
    product = await getProductById(graphqlClient, productId);
  } catch (error) {
    console.log('❌ Error fetching product by ID:', error);
    return;
  }

  const groupedTrackers = await getGroupedTrackNewVariantTrackers(String(productId));
  const grouped = groupNewVariantTrackers(groupedTrackers);

  // Loop through each group (email + product)
  for (const [, group] of grouped) {
    const previousCount = group.lastKnown;

    if (currentVariantCount > previousCount) {
      // Calculate the number of *new* variants
      const newCount = currentVariantCount - previousCount;

      // Get the last X variants from payload (they are ordered, latest last)
      const newVariants = variants.slice(-newCount);
      console.log('🆕 New Variants:', newVariants);

      await sendEmail({
        to: group.email,
        subject: `🆕 New Variant Added - ${group.shop} | ${productTitle}`,
        html: buildNewVariantEmailBody(
          group,
          previousCount,
          currentVariantCount,
          product.handle,
          newVariants, // ✅ only show new variants
        ),
      });

      await Promise.all(
        group.trackers.map((t) => updateLastKnownVariantCount(t.id, currentVariantCount)),
      );
    }
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
        tracker.lastKnownCompareAtPrice !== compare_at_price
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
        const priceNow = parseFloat(price);
        const lastPrice = tracker.lastKnownPrice ?? Number.MAX_VALUE;

        const justDroppedBelow =
          priceNow <= tracker.saleThreshold && lastPrice > tracker.saleThreshold;

        if (justDroppedBelow) {
          await sendEmail({
            to: tracker.email,
            subject: `💸 Price Dropped Below Threshold - ${tracker.shop} | ${tracker.productInfo}`,
            html: buildPriceThresholdEmailBody(tracker, description, priceNow, product.handle),
          });
        }
      }

      if (tracker.trackLowStock && tracker.lowStockLevel != null) {
        const available = variant.inventory_quantity;
        const lastInventory = tracker.lastInventory ?? 0;

        const justDroppedToOrBelow =
          available <= tracker.lowStockLevel && lastInventory > tracker.lowStockLevel;

        if (justDroppedToOrBelow) {
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

async function handleProductDelete(payload: any) {
  const productId = String(payload.id);
  await deleteTrackedByProductId(productId);
}

function groupNewVariantTrackers(
  trackers: Awaited<ReturnType<typeof getGroupedTrackNewVariantTrackers>>,
) {
  const groups: Map<
    string,
    {
      email: string;
      shop: string;
      productInfo: string;
      lastKnown: number;
      trackers: typeof trackers;
    }
  > = new Map();

  for (const tracker of trackers) {
    const key = `${tracker.productId}_${tracker.email}`;
    if (!groups.has(key)) {
      groups.set(key, {
        email: tracker.email,
        shop: tracker.shop,
        productInfo: tracker.productInfo || '',
        lastKnown: tracker.lastKnownVariantCount ?? 0,
        trackers: [],
      });
    }

    const group = groups.get(key)!;
    group.lastKnown = Math.max(group.lastKnown, tracker.lastKnownVariantCount ?? 0);
    group.trackers.push(tracker);
  }

  return groups;
}
