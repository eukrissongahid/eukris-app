// import {
//   Page,
//   Card,
//   DataTable,
//   Text,
//   Button,
//   Thumbnail,
//   Modal,
//   List,
// } from "@shopify/polaris";
// import { useState } from "react";

// export default function TrackedProductsPage() {
//   const [activeProductId, setActiveProductId] = useState<string | null>(null);

//   const products = [
//     {
//       id: "1",
//       title: "Premium Leather Wallet",
//       variantTitle: "Brown",
//       sku: "WL-BRN-01",
//       followers: 42,
//       followerEmails: ["alice@example.com", "bob@example.com", "carla@example.com"],
//       trackingTypes: ["Back in Stock", "Price Drop < ₱1,000"],
//       lastActivity: "2025-06-20",
//       image: "https://cdn.shopify.com/s/files/1/0533/2089/files/leather-wallet.jpg",
//       storeAdminUrl: "https://yourstore.myshopify.com/admin/products/123456789",
//     },
//     {
//       id: "2",
//       title: "Eco Bamboo Toothbrush",
//       variantTitle: "",
//       sku: "TB-100",
//       followers: 18,
//       followerEmails: ["dan@example.com", "erika@example.com"],
//       trackingTypes: ["New Variant", "Low Stock < 20"],
//       lastActivity: "2025-06-18",
//       image: "https://cdn.shopify.com/s/files/1/0533/2089/files/bamboo-toothbrush.jpg",
//       storeAdminUrl: "https://yourstore.myshopify.com/admin/products/987654321",
//     },
//     {
//       id: "3",
//       title: "Wireless Earbuds",
//       variantTitle: "Black / 128GB",
//       sku: "EB-BLK-128",
//       followers: 64,
//       followerEmails: ["frank@example.com", "grace@example.com", "harry@example.com"],
//       trackingTypes: ["Back in Stock", "On Sale"],
//       lastActivity: "2025-06-21",
//       image: "https://cdn.shopify.com/s/files/1/0533/2089/files/earbuds.jpg",
//       storeAdminUrl: "https://yourstore.myshopify.com/admin/products/567890123",
//     },
//   ];

//   const activeProduct = products.find((p) => p.id === activeProductId);

//   const rows = products.map((product) => [
//     <div key={product.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
//       <Thumbnail source={product.image} alt={product.title} />
//       <Text variant="bodyMd" fontWeight="medium" as="span">
//         {product.title}
//         {product.variantTitle ? ` (${product.variantTitle})` : ""}
//       </Text>
//     </div>,
//     product.sku,
//     <div style={{ textAlign: "center" }}>{product.followers}</div>,
//     product.trackingTypes.join(", "),
//     <div style={{ textAlign: "center" }}>{product.lastActivity}</div>,
//     <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
//       <Button onClick={() => setActiveProductId(product.id)}>View Followers</Button>
//     </div>,
//     <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
//       <Button url={product.storeAdminUrl} target="_blank" variant="primary">
//         View in Store
//       </Button>
//     </div>,
//   ]);

//   return (
//     <Page title="Tracked Products">
//       <Card>
//         <DataTable
//           columnContentTypes={[
//             "text", "text", "numeric", "text", "text", "text", "text"
//           ]}
//           headings={[
//             "Product",
//             "SKU",
//             <div style={{ textAlign: "center" }}>Followers</div>,
//             "Tracking Types",
//             <div style={{ textAlign: "center" }}>Last Updated</div>,
//             <div style={{ textAlign: "center" }}>Followers</div>,
//             <div style={{ textAlign: "center" }}>Store Link</div>,
//           ]}
//           rows={rows}
//         />
//       </Card>

//       {activeProduct && (
//         <Modal
//           open
//           onClose={() => setActiveProductId(null)}
//           title={`Followers for ${activeProduct.title}`}
//           primaryAction={{
//             content: "Close",
//             onAction: () => setActiveProductId(null),
//           }}
//         >
//           <Modal.Section>
//             {activeProduct.followerEmails.length > 0 ? (
//               <List type="bullet">
//                 {activeProduct.followerEmails.map((email, i) => (
//                   <List.Item key={i}>{email}</List.Item>
//                 ))}
//               </List>
//             ) : (
//               <Text as="span">No followers yet.</Text>
//             )}
//           </Modal.Section>
//         </Modal>
//       )}
//     </Page>
//   );
// }

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
import { useState } from "react";

export default function TrackedProductsPage() {
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  // Generate dummy data
  const generateEmails = (count: number) =>
    Array.from({ length: count }, (_, i) => `user${i + 1}@example.com`);

  const generateProducts = (count: number) =>
    Array.from({ length: count }, (_, i) => {
      const id = (i + 1).toString();
      return {
        id,
        title: `Product ${i + 1}`,
        variantTitle: i % 2 === 0 ? `Variant ${i + 1}` : "",
        sku: `SKU-${i + 1}`,
        followers: 20,
        followerEmails: generateEmails(20),
        trackingTypes: ["Back in Stock", "Low Stock", "Price Drop"],
        lastActivity: "2025-06-24",
        image: "https://cdn.shopify.com/s/files/1/0533/2089/files/earbuds.jpg",
        storeAdminUrl: `https://yourstore.myshopify.com/admin/products/00000${i + 1}`,
      };
    });

  const products = generateProducts(20);
  const activeProduct = products.find((p) => p.id === activeProductId);

  const rows = products.map((product) => [
    <div key={product.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <Thumbnail source={product.image} alt={product.title} />
      <Text variant="bodyMd" fontWeight="medium" as="span">
        {product.title}
        {product.variantTitle ? ` (${product.variantTitle})` : ""}
      </Text>
    </div>,
    product.sku,
    <div style={{ textAlign: "center" }}>{product.followers}</div>,
    product.trackingTypes.join(", "),
    <div style={{ textAlign: "center" }}>{product.lastActivity}</div>,
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button onClick={() => setActiveProductId(product.id)}>View Followers</Button>
    </div>,
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button url={product.storeAdminUrl} target="_blank" variant="primary">
        View in Store
      </Button>
    </div>,
  ]);

  return (
    <Page title="Tracked Products">
      <Card>
        <DataTable
          columnContentTypes={[
            "text", "text", "numeric", "text", "text", "text", "text"
          ]}
          headings={[
            "Product",
            "SKU",
            <div style={{ textAlign: "center" }}>Followers</div>,
            "Tracking Types",
            <div style={{ textAlign: "center" }}>Last Updated</div>,
            <div style={{ textAlign: "center" }}>Followers</div>,
            <div style={{ textAlign: "center" }}>Store Link</div>,
          ]}
          rows={rows}
        />
      </Card>

      {activeProduct && (
        <Modal
          open
          onClose={() => setActiveProductId(null)}
          title={`Followers for ${activeProduct.title}`}
          large
          primaryAction={{
            content: "Close",
            onAction: () => setActiveProductId(null),
          }}
        >
          <Modal.Section>
            {activeProduct.followerEmails.length > 0 ? (
              <List type="bullet">
                {activeProduct.followerEmails.map((email, i) => (
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
