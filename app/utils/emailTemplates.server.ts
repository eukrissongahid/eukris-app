export function buildBackInStockEmailBody(
  tracker: any,
  description: string,
  inventory: number,
  productHandle?: string,
) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f0f4f8;">
      <h2 style="color: #22c55e; text-align: center;">📦 ${tracker.productInfo} is Back in Stock!</h2>
      ${tracker.variantImageUrl ? `<img src="${tracker.variantImageUrl}" alt="${tracker.productInfo}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 6px;" />` : ''}
      <p style="margin-top: 16px; font-size: 16px;">
        Great news! The variant <strong>${description}</strong> is now available with <strong>${inventory}</strong> items in stock.
      </p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://${tracker.shop}/products/${productHandle}?variant=${tracker.variantId}" style="background-color: #22c55e; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">View in Store</a>
      </div>
    </div>
  `;
}

export function buildOnSaleEmailBody(
  tracker: any,
  description: string,
  price: number,
  compareAt: number,
  productHandle?: string,
) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #fdf2f8;">
      <h2 style="color: #ec4899; text-align: center;">🎉 Sale Alert: ${tracker.productInfo}</h2>
      ${tracker.variantImageUrl ? `<img src="${tracker.variantImageUrl}" alt="${tracker.productInfo}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 6px;" />` : ''}
      <p style="margin-top: 16px; font-size: 16px;">
        The variant <strong>${description}</strong> is now on sale!<br/>
        <strong>Now:</strong> ₱${price} <br/>
        <strong>Before:</strong> ₱${compareAt}
      </p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://${tracker.shop}/products/${productHandle}?variant=${tracker.variantId}" style="background-color: #ec4899; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">View in Store</a>
      </div>
    </div>
  `;
}

export function buildPriceThresholdEmailBody(
  tracker: any,
  description: string,
  price: number,
  productHandle?: string,
) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #fefce8;">
      <h2 style="color: #eab308; text-align: center;">💸 Price Drop: ${tracker.productInfo}</h2>
      ${tracker.variantImageUrl ? `<img src="${tracker.variantImageUrl}" alt="${tracker.productInfo}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 6px;" />` : ''}
      <p style="margin-top: 16px; font-size: 16px;">
        Your tracked variant <strong>${description}</strong> is now only <strong>₱${price}</strong>, which is below or equal your alert threshold of <strong>₱${tracker.saleThreshold}</strong>.
      </p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://${tracker.shop}/products/${productHandle}?variant=${tracker.variantId}" style="background-color: #eab308; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">View in Store</a>
      </div>
    </div>
  `;
}

export function buildLowStockEmailBody(
  tracker: any,
  description: string,
  quantity: number,
  productHandle?: string,
) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #fef2f2;">
      <h2 style="color: #dc2626; text-align: center;">⚠️ Low Stock Warning: ${tracker.productInfo}</h2>
      ${tracker.variantImageUrl ? `<img src="${tracker.variantImageUrl}" alt="${tracker.productInfo}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 6px;" />` : ''}
      <p style="margin-top: 16px; font-size: 16px;">
        The variant <strong>${description}</strong> is running low with only <strong>${quantity}</strong> items left in stock.
        <br/>Your alert level: <strong>${tracker.lowStockLevel}</strong>
      </p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://${tracker.shop}/products/${productHandle}?variant=${tracker.variantId}" style="background-color: #dc2626; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">View in Store</a>
      </div>
    </div>
  `;
}

export function buildNewVariantEmailBody(
  tracker: any,
  previousCount: number,
  currentCount: number,
  productHandle?: string,
  productTitle?: string,
  newVariants: any[] = [],
) {
  const newVariantsHTML = newVariants
    .map((v, i) => {
      const variantDisplay =
        v.title || [v.option1, v.option2, v.option3].filter(Boolean).join(' / ');
      return `
        <p style="margin: 8px 0; font-size: 15px;">
          <strong>${i + 1}.</strong> ${variantDisplay}
        </p>
      `;
    })
    .join('');

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #ecfdf5;">
      <h2 style="color: #10b981; text-align: center;">🆕 New Variant(s) Added to ${productTitle}</h2>

      <p style="font-size: 16px; margin-top: 16px;">
        <strong>Before:</strong> ${previousCount} variants<br/>
        <strong>Now:</strong> ${currentCount} variants
      </p>

      ${newVariantsHTML}

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://${tracker.shop}/products/${productHandle}" style="background-color: #10b981; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">View Product</a>
      </div>
    </div>
  `;
}
