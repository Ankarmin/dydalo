# Auditoría de Secciones del Admin — Gaps vs Estándar del Mercado

> **Fecha:** 16 Jul 2026
> **Resultado:** 6 secciones auditadas. 4 gaps críticos, 18 altos, 15 medios, 14 bajos.

---

## Resumen por sección

| Sección | Estado | Gaps Críticos | Gaps Altos |
|---|---|---|---|
| Dashboard | Funcional | 0 | 3 (date range, comparación, gráfica revenue) |
| Productos | Funcional | 1 (paginación) | 5 (bulk, imagen real, descripción, sort, export) |
| Categorías | Funcional | 0 | 2 (contador real, drag-and-drop) |
| Pedidos | Funcional | 1 (paginación) | 6 (date range, pago, PDF, tracking, notas, search prod) |
| Clientes | Incompleto | 2 (detalle no existe, paginación) | 3 (search, link pedidos, CLV) |
| Configuración | Funcional | 0 | 5 (FAQ, logo, moneda, tax, envíos estructurados) |

---

## Prioridades de implementación

### Bloque 1 — Crítico (rompe funcionalidad)

| # | Gap | Sección | Archivos |
|---|---|---|---|
| 1 | **Página de detalle de cliente no existe** | Clientes | Crear `usuarios/[id]/page.tsx` + `usuario-detalle-client.tsx` |
| 2 | **Paginación en Productos** | Productos | Añadir paginación al `productos-client.tsx` (usar `pagination.tsx` existente) |
| 3 | **Paginación en Pedidos** | Pedidos | Añadir paginación al `pedidos-client.tsx` |

### Bloque 2 — Alto (experiencia incompleta)

| # | Gap | Sección |
|---|---|---|
| 4 | **FAQ editor en Configuración** | Configuración |
| 5 | **Contador real de productos por categoría** | Categorías |
| 6 | **Búsqueda/filtro en Clientes** | Clientes |
| 7 | **Tracking number + notas editables en Pedido** | Pedidos |
| 8 | **Date range filter en Pedidos** | Pedidos |
| 9 | **Método de pago y estado de pago en Pedido** | Pedidos |
| 10 | **Acciones en lote en Productos** (seleccionar, activar/desactivar en masa) | Productos |
| 11 | **Campo de descripción en Producto** | Productos |
| 12 | **Columna ordenable en tablas** | Productos, Pedidos |
| 13 | **Dashboard: comparación vs mes anterior** (% cambio) | Dashboard |

### Bloque 3 — Medio (deseable)

| # | Gap | Sección |
|---|---|---|
| 14 | Facebook en Configuración redes sociales | Configuración |
| 15 | WhatsApp en Configuración | Configuración |
| 16 | Borrado protegido de categorías (si tiene productos) | Categorías |
| 17 | Búsqueda de pedidos por nombre de producto | Pedidos |
| 18 | Razón de cancelación en Pedidos | Pedidos |
| 19 | Logo/favicon upload en Configuración | Configuración |
| 20 | Export CSV (Productos, Pedidos) | Productos, Pedidos |

### Bloque 4 — Bajo (nice to have)

| # | Gap |
|---|---|
| 21 | Drag-and-drop reorder de categorías |
| 22 | Imágenes múltiples por producto |
| 23 | SEO metadata por producto y categoría |
| 24 | Botón "Ver en tienda" desde admin producto |
| 25 | Métricas adicionales en Dashboard (tasa conversión, clientes nuevos) |

---

## Plan de acción inmediato (Bloque 1)

### 1. Detalle de Cliente

Crear `app/(admin)/admin/usuarios/[id]/`:

**Página:** `page.tsx` (server shell + metadata)
**Cliente:** `usuario-detalle-client.tsx`

Contenido:
- Datos del cliente: nombre, email, teléfono, fecha registro
- Tabla de pedidos del cliente (link a cada pedido)
- Stats: total gastado, cantidad de pedidos, último pedido
- Rol actual (solo lectura para admin)

### 2. Paginación en Productos

Añadir a `productos-client.tsx`:
- Estado `page` y `pageSize` (default 20)
- Usar `products.slice((page-1)*pageSize, page*pageSize)` para mostrar
- Componente `Pagination` del UI (ya existe `pagination.tsx`)
- Mantener búsqueda/filtros funcionando con paginación (filtrar primero, paginar después)

### 3. Paginación en Pedidos

Igual que Productos, en `pedidos-client.tsx`.

---

> **Siguiente paso:** Implementar Bloque 1 (detalle cliente + paginación productos + paginación pedidos). Luego Bloque 2 por orden de prioridad.
