import Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});

export async function createCheckoutSession(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw Object.assign(new Error("Order not found"), { statusCode: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/checkout/cancel`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Order ${order.orderNumber}` },
          unit_amount: Math.round(order.total * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { orderId },
  });

  await prisma.payment.create({
    data: {
      orderId,
      provider: "stripe",
      sessionId: session.id,
      amount: order.total,
      currency: order.currency,
      status: "PENDING",
      metadata: { checkoutUrl: session.url },
    },
  });

  return { sessionId: session.id, url: session.url };
}

export async function verifyCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "paid") {
    await prisma.payment.updateMany({
      where: { sessionId },
      data: { status: "SUCCEEDED" },
    });

    await prisma.order.updateMany({
      where: { id: session.metadata?.orderId || "" },
      data: { status: "PAID" },
    });

    return { paid: true };
  }

  return { paid: false };
}
