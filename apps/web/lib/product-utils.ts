interface ProductLike {
  category: string;
}

export function getCategoryProductCount(products: ProductLike[], slug: string): number {
  return products.filter((p) => p.category === slug).length;
}
