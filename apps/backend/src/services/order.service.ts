import { prisma } from "../lib/prisma.js";

export async function createOrder(userId: string, payload: any) {
  const products = await Promise.all(
    payload.items.map(async (item: any) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw Object.assign(new Error(`Product not found: ${item.productId}`), { statusCode: 404 });
      }
      return { product, quantity: item.quantity };
    })
  );

  const subtotal = products.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 100 ? 0 : 12;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingFee + tax;

  const order = await prisma.order.create({
    data: {
      userId,
      orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      subtotal,
      shippingFee,
      tax,
      total,
      shippingAddress: payload.shippingAddress,
      billingAddress: payload.billingAddress || payload.shippingAddress,
      notes: payload.notes,
      status: "PENDING",
      items: {
        create: products.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  return order;
}

export async function getOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    throw Object.assign(new Error("Order not found"), { statusCode: 404 });
  }

  return order;
}

export async function listOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}
