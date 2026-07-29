export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDisplayPrice(product: { price: number; discount: number | null | undefined }) {
  const original = product.price;
  const discount = product.discount ?? 0;
  const final = discount > 0 ? original * (1 - discount / 100) : original;
  return { final, original, hasDiscount: discount > 0 };
}
