import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import shopify from "../shopify.server";

export async function getAdminGraphqlClient(shop: string) {
  const [adminSession] =
    (await shopify.sessionStorage.findSessionsByShop(shop)) || [];

  // if (!adminSession) throw new Error("Admin session not found");
  if (!adminSession) {
    console.error("❌ No admin session found for shop:", shop);
    throw new Error("Admin session not found");
  }

  console.log("🔍 Found session for shop:", shop);
  console.log("🔑 Access token:", adminSession.accessToken);
  console.log("📅 Expires at:", adminSession.expires); // if applicable

  const shopifyAdmin = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    apiVersion: ApiVersion.January25,
    hostName: process.env.SHOPIFY_APP_URL?.replace(/^https?:\/\//, "") || "",
    isEmbeddedApp: true,
  });

  return new shopifyAdmin.clients.Graphql({ session: adminSession });
}
