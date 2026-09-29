import { prisma } from "../lib/prisma.js";

export async function getCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: { images: true },
          },
        },
      },
    },
  });

  if (!cart) {
    return { items: [] };
  }

  return cart;
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  let cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (existingItem) {
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity,
    },
  });
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return null;

  return prisma.cartItem.update({
    where: { id: itemId, cartId: cart.id },
    data: { quantity },
  });
}

export async function removeFromCart(userId: string, itemId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return null;

  return prisma.cartItem.delete({
    where: { id: itemId, cartId: cart.id },
  });
}
