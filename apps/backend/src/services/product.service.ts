import { prisma } from "../lib/prisma.js";
import { makeSlug } from "../lib/slug.js";

export type ProductFilters = {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  status?: string;
  page?: number;
  limit?: number;
};

export async function listProducts(filters: ProductFilters = {}) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
  const skip = (page - 1) * limit;

  const where: any = {
    isPublished: true,
    status: filters.status ? filters.status : "ACTIVE",
  };

  if (filters.category) {
    where.category = { slug: filters.category };
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { shortDescription: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) where.price.gte = filters.minPrice;
    if (filters.maxPrice) where.price.lte = filters.maxPrice;
  }

  if (typeof filters.featured === "boolean") {
    where.featured = filters.featured;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: true,
      reviews: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!product) {
    throw Object.assign(new Error("Product not found"), { statusCode: 404 });
  }

  return product;
}

export async function createProduct(input: any) {
  const slug = input.slug || makeSlug(input.name);
  const product = await prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      slug,
      shortDescription: input.shortDescription,
      description: input.description,
      price: Number(input.price),
      compareAtPrice: input.compareAtPrice ? Number(input.compareAtPrice) : null,
      costPrice: input.costPrice ? Number(input.costPrice) : null,
      stock: Number(input.stock || 0),
      status: input.status || "ACTIVE",
      featured: Boolean(input.featured),
      isPublished: input.isPublished !== false,
      categoryId: input.categoryId,
      tags: input.tags || [],
      images: {
        create: (input.images || []).map((img: any) => ({
          url: img.url,
          alt: img.alt,
          isPrimary: !!img.isPrimary,
        })),
      },
    },
    include: { images: true, category: true },
  });

  return product;
}

export async function updateProduct(id: string, input: any) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      sku: input.sku,
      name: input.name,
      slug: input.slug ? makeSlug(input.slug) : undefined,
      shortDescription: input.shortDescription,
      description: input.description,
      price: input.price !== undefined ? Number(input.price) : undefined,
      compareAtPrice: input.compareAtPrice !== undefined ? Number(input.compareAtPrice) : undefined,
      stock: input.stock !== undefined ? Number(input.stock) : undefined,
      status: input.status,
      featured: input.featured,
      isPublished: input.isPublished,
      categoryId: input.categoryId,
      tags: input.tags,
      images: input.images
        ? {
            deleteMany: {},
            create: input.images.map((img: any) => ({
              url: img.url,
              alt: img.alt,
              isPrimary: !!img.isPrimary,
            })),
          }
        : undefined,
    },
    include: { images: true, category: true },
  });

  return product;
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  return { success: true };
}
