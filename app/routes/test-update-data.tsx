import { json } from "@remix-run/node";
import { Prisma } from "@prisma/client";
import prisma from "../db.server";

export const action = async ({ request }: { request: Request }) => {
  const body = await request.json();

  const { productId, variantId, ...updatePayload } = body;

  if (!productId && !variantId) {
    return json(
      { error: "Must provide either productId or variantId" },
      { status: 400 },
    );
  }

  const disallowedKeys = ["id", "email", "productId", "variantId"];
  for (const key of disallowedKeys) {
    delete updatePayload[key];
  }

  const where: Prisma.TrackedProductWhereInput = productId
    ? { productId }
    : { variantId };

  const updated = await prisma.trackedProduct.updateMany({
    where,
    data: updatePayload,
  });

  return json({ success: true, updated: updated.count });
};
