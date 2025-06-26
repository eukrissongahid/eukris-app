import { json, LoaderFunctionArgs } from "@remix-run/node";
import TrackedProductsPage from "./admin.tracked-products";
import { authenticate } from "app/shopify.server";
import { getTrackedProductsByShop } from "../models/trackedProduct.server";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const shopProducts = await getTrackedProductsByShop(shop);
  return json({ shopProducts });
};

export default function Index() {
  const { shopProducts } = useLoaderData<typeof loader>();
  return <TrackedProductsPage shopProducts={shopProducts} />;
}
