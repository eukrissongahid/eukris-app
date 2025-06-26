// extensions/track-this-product-hn/tailwind.config.js
module.exports = {
  content: [
    './track-this-product-hn/snippets/**/*.liquid',
    './track-this-product-hn/blocks/**/*.liquid',
    './track-this-product-hn/assets/**/*.js',
  ],
  corePlugins: {
    preflight: false, // 👈 This prevents Tailwind from resetting global styles (which breaks Shopify layout)
  },
};