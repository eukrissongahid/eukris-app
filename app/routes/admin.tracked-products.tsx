import {
  Page,
  Card,
  DataTable,
  Text,
  Button,
  Thumbnail,
  Modal,
  List,
} from "@shopify/polaris";
import { useEffect, useMemo, useState } from "react";
import { getTrackedProductsByShop } from "../models/trackedProduct.server";

type ShopProduct = Omit<
  Awaited<ReturnType<typeof getTrackedProductsByShop>>[number],
  "createdAt"
> & {
  createdAt: string;
};

type Props = {
  shopProducts: ShopProduct[];
};

type GroupedVariant = {
  variantId: string;
  productId: string;
  productInfo: string;
  variantImageUrl: string;
  shop: string;
  updatedAt: string;
  trackingTypes: string[];
  followerEmails: string[];
};

export default function TrackedProductsPage({ shopProducts }: Props) {
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  useEffect(() => {
    console.log("✅ Products from props:", shopProducts);
  }, [shopProducts]);

  const groupedVariants = useMemo(() => {
    const map = new Map<string, GroupedVariant>();

    for (const item of shopProducts) {
      const {
        variantId,
        productId,
        productInfo,
        variantImageUrl,
        updatedAt,
        shop,
        email,
        trackInStock,
        trackLowStock,
        trackOnSale,
        trackNewVariant,
      } = item;

      const trackingTypes = [
        trackInStock && "Back in Stock",
        trackLowStock && "Low Stock",
        trackOnSale && "Price Drop",
        trackNewVariant && "New Variant",
      ].filter(Boolean) as string[];

      if (!map.has(variantId)) {
        map.set(variantId, {
          variantId,
          productId,
          productInfo,
          variantImageUrl,
          shop,
          updatedAt,
          trackingTypes,
          followerEmails: email ? [email] : [],
        });
      } else {
        const existing = map.get(variantId)!;
        if (email && !existing.followerEmails.includes(email)) {
          existing.followerEmails.push(email);
        }
      }
    }

    return Array.from(map.values());
  }, [shopProducts]);

  const activeVariant = groupedVariants.find(
    (v) => v.variantId === activeVariantId
  );

  const rows = groupedVariants.map((variant) => [
    <div
      key={variant.variantId}
      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
    >
      <Thumbnail source={variant.variantImageUrl} alt={variant.productInfo} />
      <Text variant="bodyMd" fontWeight="medium" as="span">
        {variant.productInfo}
      </Text>
    </div>,

    <div style={{ textAlign: "center" }}>
      {variant.followerEmails.length}
    </div>,

    variant.trackingTypes.join(", "),

    new Date(variant.updatedAt).toLocaleDateString(),

    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button onClick={() => setActiveVariantId(variant.variantId)}>
        View Followers
      </Button>
    </div>,

    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button
        url={`https://${variant.shop}/admin/products/${variant.productId}/variants/${variant.variantId}`}
        target="_blank"
        variant="primary"
      >
        View in Product
      </Button>
    </div>,
  ]);

  return (
    <Page title="Tracked Products">
      <Card>
        <DataTable
          columnContentTypes={[
            "text",
            "numeric",
            "text",
            "text",
            "text",
            "text",
          ]}
          headings={[
            "Product Variant",
            <div style={{ textAlign: "center" }}>Followers</div>,
            "Tracking Types",
            <div style={{ textAlign: "center" }}>Last Updated</div>,
            <div style={{ textAlign: "center" }}>Followers</div>,
            <div style={{ textAlign: "center" }}>Product Link</div>,
          ]}
          rows={rows}
        />
      </Card>

      {activeVariant && (
        <Modal
          open
          onClose={() => setActiveVariantId(null)}
          title={`Followers for ${activeVariant.productInfo}`}
          primaryAction={{
            content: "Close",
            onAction: () => setActiveVariantId(null),
          }}
        >
          <Modal.Section>
            {activeVariant.followerEmails.length > 0 ? (
              <List type="bullet">
                {activeVariant.followerEmails.map((email, i) => (
                  <List.Item key={i}>{email}</List.Item>
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
