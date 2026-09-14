// Clave estable de variante, idéntica a la del frontend
// (`getVariantKey` en `apps/web/src/lib/utils/inventory.ts`).
// El seed y el servicio deben generar la misma: fuente única aquí.
export function variantKey(size: string, color: string): string {
  return `${size.trim().toLowerCase()}|${color.trim().toLowerCase()}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
