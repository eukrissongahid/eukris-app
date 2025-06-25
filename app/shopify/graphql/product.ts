import type { GraphqlClient } from "@shopify/shopify-api";

type ProductQueryResponse = {
  body?: {
    data?: {
      product?: any;
    };
  };
};

export async function getProductById(client: GraphqlClient, productId: string) {
  const response: ProductQueryResponse = await client.query({
    data: {
      query: `#graphql
        query getProduct($id: ID!) {
          product(id: $id) {
            id
            title
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price
                  compareAtPrice
                  inventoryQuantity
                }
              }
            }
          }
        }`,
      variables: {
        id: `gid://shopify/Product/${productId}`,
      },
    },
  });

  return response.body?.data?.product;
}
