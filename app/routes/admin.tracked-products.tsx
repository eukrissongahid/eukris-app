import {
  Page,
  Card,
  DataTable,
  Text,
  Button,
  Thumbnail,
  Modal,
  List,
  Banner,
  Box,
  InlineStack,
} from '@shopify/polaris';
import { useEffect, useMemo, useState } from 'react';
import { useFetcher } from '@remix-run/react';

type ShopProduct = {
  variantId: string;
  productId: string;
  sku: string;
  productInfo: string;
  variantImageUrl: string;
  updatedAt: string;
  shop: string;
  email: string;
  userId: string;
  createdAt: string;
  trackInStock: boolean;
  trackLowStock: boolean;
  trackOnSale: boolean;
  trackNewVariant: boolean;
};

type Props = {
  shopProducts: ShopProduct[];
};

// type GroupedVariant = {
//   variantId: string;
//   productId: string;
//   sku: string;
//   productInfo: string;
//   variantImageUrl: string;
//   shop: string;
//   updatedAt: string;
//   trackingTypes: string[];
//   followers: { email: string; userId: string }[];
// };

type GroupedVariant = {
  variantId: string;
  productId: string;
  sku: string;
  productInfo: string;
  variantImageUrl: string;
  shop: string;
  updatedAt: string;
  trackingTypes: string[]; // keep if you still want aggregate/global display
  followers: {
    email: string;
    userId: string;
    trackingTypes: string[]; // <-- added per follower
  }[];
};

export default function TrackedProductsPage({ shopProducts }: Props) {
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (
        fetcher.data &&
        typeof fetcher.data === 'object' &&
        'success' in fetcher.data &&
        typeof (fetcher.data as any).success === 'boolean'
      ) {
        if ((fetcher.data as any).success) {
          setMessage('Successfully untracked.');
        } else {
          setMessage('Failed to untrack.');
        }

        const timer = setTimeout(() => setMessage(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [fetcher]);

  // const groupedVariants = useMemo(() => {
  //   const map = new Map<string, GroupedVariant>();

  //   for (const item of shopProducts) {
  //     const {
  //       variantId,
  //       productId,
  //       sku,
  //       productInfo,
  //       variantImageUrl,
  //       updatedAt,
  //       shop,
  //       email,
  //       userId,
  //       trackInStock,
  //       trackLowStock,
  //       trackOnSale,
  //       trackNewVariant,
  //     } = item;

  //     const trackingTypes = [
  //       trackInStock && 'Back in Stock',
  //       trackLowStock && 'Low Stock',
  //       trackOnSale && 'Price Drop',
  //       trackNewVariant && 'New Variant',
  //     ].filter(Boolean) as string[];

  //     if (!map.has(variantId)) {
  //       map.set(variantId, {
  //         variantId,
  //         productId,
  //         sku,
  //         productInfo,
  //         variantImageUrl,
  //         shop,
  //         updatedAt,
  //         trackingTypes,
  //         followers: email ? [{ email, userId }] : [],
  //       });
  //     } else {
  //       const existing = map.get(variantId)!;
  //       if (email && !existing.followers.find((f) => f.email === email)) {
  //         existing.followers.push({ email, userId });
  //       }
  //     }
  //   }

  //   return Array.from(map.values());
  // }, [shopProducts]);

  const groupedVariants = useMemo(() => {
    const map = new Map<string, GroupedVariant>();

    for (const item of shopProducts) {
      const {
        variantId,
        productId,
        sku,
        productInfo,
        variantImageUrl,
        updatedAt,
        shop,
        email,
        userId,
        trackInStock,
        trackLowStock,
        trackOnSale,
        trackNewVariant,
      } = item;

      const followerTrackingTypes = [
        trackInStock && 'Back in Stock',
        trackLowStock && 'Low Stock',
        trackOnSale && 'Price Drop',
        trackNewVariant && 'New Variant',
      ].filter(Boolean) as string[];

      if (!map.has(variantId)) {
        map.set(variantId, {
          variantId,
          productId,
          sku,
          productInfo,
          variantImageUrl,
          shop,
          updatedAt,
          trackingTypes: [], // remove global tracking here
          followers: email ? [{ email, userId, trackingTypes: followerTrackingTypes }] : [],
        });
      } else {
        const existing = map.get(variantId)!;
        if (email && !existing.followers.find((f) => f.email === email)) {
          existing.followers.push({ email, userId, trackingTypes: followerTrackingTypes });
        }
      }
    }

    return Array.from(map.values());
  }, [shopProducts]);

  const activeVariant = groupedVariants.find((v) => v.variantId === activeVariantId);

  const rows = groupedVariants.map((variant) => [
    <InlineStack align="start" gap="200" blockAlign="center" key={variant.variantId}>
      <Thumbnail source={variant.variantImageUrl} alt={variant.productInfo} size="small" />
      <Text variant="bodyMd" fontWeight="medium" as="span">
        {variant.productInfo}
      </Text>
    </InlineStack>,

    <Box>
      <Text as="span">{variant.followers.length}</Text>
    </Box>,

    <Box>
      <Text as="span">{variant.sku}</Text>
    </Box>,

    <InlineStack align="end" gap="200">
      <Button size="slim" onClick={() => setActiveVariantId(variant.variantId)}>
        View Followers
      </Button>
      <Button
        url={`https://${variant.shop}/admin/products/${variant.productId}/variants/${variant.variantId}`}
        target="_blank"
        variant="primary"
        size="slim"
      >
        View in Product
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page title="Tracked Products">
      {message && (
        <Box paddingBlockEnd="400">
          <Banner title={message} onDismiss={() => setMessage(null)} />
        </Box>
      )}

      <Card>
        {rows.length > 0 ? (
          <DataTable
            columnContentTypes={['text', 'numeric', 'text', 'text', 'text', 'text']}
            headings={[
              'Product Variant',
              'Followers',
              'SKU',
              // 'Last Updated',
              '',
            ]}
            rows={rows}
          />
        ) : (
          <Box padding="400">
            <Text variant="bodyMd" as="p">
              No tracked product records found.
            </Text>
          </Box>
        )}
      </Card>

      {activeVariant && (
        <Modal
          open
          onClose={() => setActiveVariantId(null)}
          title={`Followers for ${activeVariant.productInfo}`}
          primaryAction={{
            content: 'Close',
            onAction: () => setActiveVariantId(null),
          }}
        >
          <Modal.Section>
            {activeVariant.followers.length > 0 ? (
              <List type="bullet">
                {activeVariant.followers.map((follower, i) => (
                  <List.Item key={i}>
                    <InlineStack align="space-between" wrap={false}>
                      <Box>
                        <Text as="span" fontWeight="medium">
                          {follower.email}
                        </Text>
                        <Box paddingBlockStart="100">
                          {/* <Text as="p" variant="bodySm" tone="subdued">
                            Tracking:{' '}
                            {activeVariant.trackingTypes.length > 0
                              ? activeVariant.trackingTypes.join(', ')
                              : 'None'}
                          </Text> */}
                          <Text as="p" variant="bodySm" tone="subdued">
                            Tracking:{' '}
                            {follower.trackingTypes.length > 0
                              ? follower.trackingTypes.join(', ')
                              : 'None'}
                          </Text>
                        </Box>
                      </Box>
                      <Button
                        size="slim"
                        onClick={() => {
                          const formData = new FormData();
                          formData.append('userId', follower.userId);
                          formData.append('productId', activeVariant.productId);
                          formData.append('variantId', activeVariant.variantId);
                          fetcher.submit(formData, { method: 'post' });
                        }}
                      >
                        Untrack
                      </Button>
                    </InlineStack>
                  </List.Item>
                ))}
              </List>
            ) : (
              <Text as="span">No followers yet.</Text>
            )}
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
