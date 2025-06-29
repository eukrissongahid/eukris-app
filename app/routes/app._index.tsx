import { json, LoaderFunctionArgs } from '@remix-run/node';
import TrackedProductsPage from './admin.tracked-products';
import { authenticate } from 'app/shopify.server';
import { getTrackedProductsByShop, deleteTrackedProduct } from '../models/trackedProduct.server';
import { useLoaderData } from '@remix-run/react';
import { ActionFunctionArgs } from '@remix-run/node';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const shopProducts = await getTrackedProductsByShop(shop);
  return json({ shopProducts });
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const userId = formData.get('userId') as string;
  const productId = formData.get('productId') as string;
  const variantId = formData.get('variantId') as string;

  if (!userId || !productId || !variantId) {
    return json({ error: 'Missing fields' }, { status: 400 });
  }

  await deleteTrackedProduct(userId, productId, variantId);

  return json({ success: true });
}

export default function Index() {
  const { shopProducts } = useLoaderData<typeof loader>();
  const shopProductsWithSku = shopProducts.map((product: any) => ({
    sku: product.sku ?? '',
    ...product,
  }));
  return <TrackedProductsPage shopProducts={shopProductsWithSku} />;
}
