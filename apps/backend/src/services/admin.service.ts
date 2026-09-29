import { prisma } from "../lib/prisma.js";

export async function getDashboardStats() {
  const [orders, products, customers, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.aggregate({ _sum: { total: true } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  return {
    metrics: {
      orders,
      products,
      customers,
      revenue: revenue._sum.total ?? 0,
    },
    recentOrders,
  };
}

export async function getAdminOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      items: { include: { product: true } },
    },
  });
}
