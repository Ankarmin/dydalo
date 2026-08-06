import type { AdminProduct, Order, User } from "@/lib/stores/data-store.types";

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map((v) => escapeCSV(v)).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function downloadBlob(content: string, filename: string, mimeType: string = "text/csv;charset=utf-8;"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function exportProductsCSV(products: AdminProduct[]): void {
  const headers = ["Nombre", "SKU", "Categoria", "Precio", "Stock Total", "Variantes", "Descuento(%)", "Activo", "Destacado"];
  const rows = products.map((p) => [
    p.name,
    p.sku,
    p.category,
    p.price,
    p.stock,
    (p.variants ?? [])
      .map((variant) => `${variant.color}/${variant.size}:${variant.stock}${variant.active ? "" : " inactiva"}`)
      .join(" | "),
    p.discount ?? 0,
    p.active ? "Si" : "No",
    p.featured ? "Si" : "No",
  ]);
  const csv = buildCSV(headers, rows);
  downloadBlob(csv, `productos-dydalo-${todayStamp()}.csv`);
}

export function exportOrdersCSV(orders: Order[], users: User[]): void {
  const userMap = new Map(users.map((u) => [u.id, u]));
  const headers = [
    "ID", "Cliente", "Email", "Fecha", "Items", "Subtotal", "Envio", "Descuento", "Total", "Estado",
    "Direccion", "Distrito", "Provincia", "Departamento", "Telefono",
  ];
  const rows = orders.map((o) => {
    const user = userMap.get(o.userId);
    return [
      o.id,
      user?.name ?? "",
      user?.email ?? "",
      new Date(o.createdAt).toLocaleDateString("es-PE"),
      o.items.length,
      o.subtotal,
      o.shipping,
      o.discount,
      o.total,
      o.status,
      o.shippingAddressSnapshot.street,
      o.shippingAddressSnapshot.district ?? "",
      o.shippingAddressSnapshot.city,
      o.shippingAddressSnapshot.state,
      o.shippingAddressSnapshot.phone,
    ];
  });
  const csv = buildCSV(headers, rows);
  downloadBlob(csv, `pedidos-dydalo-${todayStamp()}.csv`);
}

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === "\n" || (char === "\r" && text[i + 1] === "\n")) {
        lines.push(current);
        current = "";
        if (char === "\r") i++;
      } else if (char === "\r") {
        lines.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  if (current.length > 0) lines.push(current);

  if (lines.length === 0) return { headers: [], rows: [] };

  const splitLine = (line: string): string[] => {
    const cols: string[] = [];
    let col = "";
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) {
        if (c === '"') {
          if (line[i + 1] === '"') {
            col += '"';
            i++;
          } else {
            quoted = false;
          }
        } else {
          col += c;
        }
      } else {
        if (c === '"') {
          quoted = true;
        } else if (c === ",") {
          cols.push(col.trim());
          col = "";
        } else {
          col += c;
        }
      }
    }
    cols.push(col.trim());
    return cols;
  };

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);

  return { headers, rows };
}

export function importProductsFromCSV(
  text: string,
  createProduct: (data: Omit<AdminProduct, "id" | "createdAt" | "updatedAt" | "slug">) => AdminProduct
): { created: number; errors: string[] } {
  const { headers, rows } = parseCSV(text);

  if (headers.length === 0) {
    return { created: 0, errors: ["Archivo CSV vacío"] };
  }

  const idx = () => {
    const map: Record<string, number> = {};
    headers.forEach((h, i) => {
      map[h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] = i;
    });
    return (name: string) => map[name] ?? -1;
  };

  const getIdx = idx();

  const errors: string[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nameCol = getIdx("nombre");
    const skuCol = getIdx("sku");
    const categoryCol = getIdx("categoria");
    const priceCol = getIdx("precio");
    const stockCol = getIdx("stock");

    if (nameCol === -1 || skuCol === -1 || categoryCol === -1 || priceCol === -1) {
      errors.push(`Fila ${i + 2}: Faltan columnas requeridas (Nombre, SKU, Categoria, Precio)`);
      continue;
    }

    const name = row[nameCol]?.trim();
    const sku = row[skuCol]?.trim();
    const category = row[categoryCol]?.trim();
    const price = parseFloat(row[priceCol]);
    const stock = stockCol >= 0 ? parseInt(row[stockCol]) || 0 : 0;

    if (!name || !sku || !category || isNaN(price)) {
      errors.push(`Fila ${i + 2}: Datos inválidos`);
      continue;
    }

    const discountCol = getIdx("descuento(%)");
    const activeCol = getIdx("activo");
    const featuredCol = getIdx("destacado");

    const discount = discountCol >= 0 ? parseFloat(row[discountCol]) || null : null;
    const active = activeCol >= 0 ? row[activeCol]?.toLowerCase() !== "no" : true;
    const featured = featuredCol >= 0 ? row[featuredCol]?.toLowerCase() === "si" : false;

    try {
      createProduct({
        name,
        sku,
        category,
        price: isNaN(price) ? 0 : price,
        stock: isNaN(stock) ? 0 : stock,
        discount: discount && discount > 0 ? discount : null,
        active,
        featured,
        image: "",
        sizes: ["Unica"],
        colors: [{ name: "Negro", hex: "#1a1a1a" }],
      });
      created++;
    } catch {
      errors.push(`Fila ${i + 2}: Error al crear "${name}"`);
    }
  }

  return { created, errors };
}
