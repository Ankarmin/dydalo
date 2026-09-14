// Slug estable para URLs (/producto/:slug, /catalogo/:slug, /blog/:slug).
// Sin el prefijo de id del seed histórico: los nuevos usan nombre limpio.
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
