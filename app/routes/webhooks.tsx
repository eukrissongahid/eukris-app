import {ActionFunction} from '@remix-run/node';

import {
  getTrackersByVariant,
  updateLastKnownPrice,
  updateLastKnownCompareAtPrice,
  updateLastInventory,
  updateLastKnownVariantCount,
} from '../models/trackedProduct.server';

import { authenticate } from '../shopify.server';
import { sendEmail } from '../utils/email.server';

export const action: ActionFunction = async ({request}) => {
  const {topic, shop, session, payload} = await authenticate.webhook(request);

  switch (topic) {
    case 'APP_UNINSTALLED':
      if (session) {
        console.log("✅ this is called uninstalled!");
      }
    case 'PRODUCTS_UPDATE':
      if (session) {
        handleProductsUpdate(payload);
        console.log("✅ this is called products update! --> ", JSON.stringify(payload, null, 2));
      }
      break;
    case 'INVENTORY_LEVELS_UPDATE':
      if (session) {
        console.log("✅ this is called inventory update! --> ", JSON.stringify(payload, null, 2));
      }
      break;
    default:
      throw new Response('Unhandled webhook topic', {status: 404});
  }

  throw new Response();
};

async function handleProductsUpdate(payload: any) {
  const { id: productId, variants } = payload;
  console.log("✅ ✅ ✅ webhook payload: ", JSON.stringify(payload, null, 2));
  for (const variant of variants) {
    const { id: variantId, price, compare_at_price } = variant;
    const trackers = await getTrackersByVariant(String(variantId));

    for (const tracker of trackers) {
      if (tracker.trackInStock && variant.inventory_quantity > 0 && (tracker.lastInventory ?? 0) <= 0) {
        const variantName = variant.title || "this product";
        const options = variant.option_values
          ? variant.option_values.map((opt: any) => `${opt.name}: ${opt.value}`).join(", ")
          : "";
        const description = options ? `${variantName} (${options})` : variantName;
        const message = `✅ Good news! "${description}" is now in stock with ${variant.inventory_quantity} available.`;
        await sendEmail({
          to: tracker.email,
          subject: '📦 Back in Stock Notification',
          html: `<p>${message}</p>`,
        });

      }

      if (tracker.trackOnSale && tracker.lastKnownPrice != price && tracker.lastKnownPrice != compare_at_price) {
        const variantName = variant.title || "this product";
        const options = variant.option_values
          ? variant.option_values.map((opt: any) => `${opt.name}: ${opt.value}`).join(", ")
          : "";
        const description = options ? `${variantName} (${options})` : variantName;

        if (tracker.saleThreshold && parseFloat(price) <= tracker.saleThreshold) {
          const message = `✅ Price dropped below threshold for "${description}": ${price} <= ${tracker.saleThreshold}`;
          await sendEmail({
            to: tracker.email,
            subject: '💸 Price Drop Alert',
            html: `<p>${message}</p>`,
          });
        } else if (compare_at_price && parseFloat(compare_at_price) > parseFloat(price)) {
          const message = `✅ Sale detected for "${description}": ${price} < ${compare_at_price}`;
          await sendEmail({
            to: tracker.email,
            subject: '🎉 Product On Sale',
            html: `<p>${message}</p>`,
          });
        }
      }

      if (tracker.trackNewVariant) {
        const lastKnownVariantCount = tracker?.lastKnownVariantCount || 0;
        const currentVariantCount = payload.variants?.length || 0;

        if (currentVariantCount > lastKnownVariantCount) {
          const message = `🆕 New variant(s) added for product ${productId}. Previous: ${lastKnownVariantCount}, Now: ${currentVariantCount}`

          await sendEmail({
            to: tracker.email,
            subject: '🆕 New Variant Released',
            html: `<p>${message}</p>`,
          });
        }
      }

      if (tracker.trackLowStock && tracker.lowStockLevel != null) {
        const available = variant.inventory_quantity;
        if (available < tracker.lowStockLevel) {
          const variantName = variant.title || "this product";
          const options = variant.option_values
            ? variant.option_values.map((opt: any) => `${opt.name}: ${opt.value}`).join(", ")
            : "";
          const description = options ? `${variantName} (${options})` : variantName;

          const message = `⚠️ Low stock alert for "${description}": Only ${available} left (Threshold: ${tracker.lowStockLevel})`;

          await sendEmail({
            to: tracker.email,
            subject: '⚠️ Low Stock Warning',
            html: `<p>${message}</p>`,
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
