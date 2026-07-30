# Backlog Funcional DYDALO

Documento vivo de funciones faltantes para evaluar, priorizar y actualizar conforme avance el ecommerce.

Ultima actualizacion: 2026-07-30

## Leyenda

| Prioridad | Significado |
| --- | --- |
| Alta | Necesaria para operar, vender o evitar errores criticos |
| Media | Mejora conversion, control o eficiencia |
| Baja | Optimiza experiencia o escalabilidad, pero no bloquea operacion inicial |

| Estado | Significado |
| --- | --- |
| Pendiente | No implementado |
| Parcial | Existe base, falta completar |
| Hecho | Implementado y validado |

## Resumen Ejecutivo

| Area | Prioridad | Estado | Nota |
| --- | --- | --- | --- |
| Historial de movimientos de stock | Alta | Pendiente | Clave para Diego/logistica |
| Auditoria por admin | Alta | Pendiente | Clave para ambos socios |
| SEO tecnico base | Alta | Pendiente | Sitemap, robots, canonicals, JSON-LD |
| Costo/proveedor/margen | Alta | Pendiente | Necesario para utilidad real |
| Tracking/courier | Alta | Pendiente | Necesario para despacho real |
| Pagos/comprobantes | Alta | Pendiente | Necesario para produccion |
| Backend real | Alta | Pendiente | Necesario para multiusuario real |
| Campos SEO admin | Alta | Pendiente | Necesario para escalar contenido |
| Cupones | Media | Pendiente | Campanas y conversion |
| Reviews | Media | Pendiente | Confianza y SEO |
| Carrito abandonado | Media | Pendiente | Recuperacion de ventas |

## 1. Admin Logistico: Historial De Movimientos De Stock

### Objetivo

Registrar cada cambio de stock por variante para saber entradas, ventas, ajustes, devoluciones y responsable.

### Alcance

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Modelo `StockMovement` | Alta | Pendiente | Tipo central para registrar eventos de inventario |
| Store local de movimientos | Alta | Pendiente | `data-store.stock-movements.ts` mientras no haya backend |
| Registro por venta checkout | Alta | Pendiente | Movimiento `sale` por cada item vendido |
| Registro por pedido admin | Alta | Pendiente | Movimiento `sale` con `createdBy` admin |
| Registro por cancelacion | Alta | Pendiente | Movimiento `order_cancelled` que devuelve stock |
| Registro por devolucion | Alta | Pendiente | Movimiento `return` que reingresa stock |
| Ajuste manual | Alta | Pendiente | Sumar/restar stock con motivo obligatorio |
| Historial en producto | Alta | Pendiente | Ver movimientos por producto/variante |
| Historial global | Media | Pendiente | Pagina admin con todos los movimientos |
| Exportar CSV | Media | Pendiente | Control externo de inventario |
| Filtros avanzados | Media | Pendiente | Fecha, producto, variante, tipo, admin |

### Tipos De Movimiento

| Tipo | Direccion | Uso |
| --- | --- | --- |
| `purchase` | Entrada | Compra o reposicion de mercaderia |
| `manual_adjustment` | Entrada/salida | Correccion por conteo fisico |
| `sale` | Salida | Venta desde checkout o pedido admin |
| `order_cancelled` | Entrada | Cancelacion que devuelve stock |
| `return` | Entrada | Producto devuelto y reingresado |
| `damage` | Salida | Producto danado o no vendible |
| `reservation` | Salida/bloqueo | Reserva temporal con pagos reales |
| `release_reservation` | Entrada/liberacion | Pago fallido o reserva liberada |

### Modelo Propuesto

```ts
type StockMovement = {
  id: string;
  productId: number;
  productName: string;
  variantId: string;
  size: string;
  color: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  referenceType?: "order" | "purchase" | "manual" | "return";
  referenceId?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
};
```

### Buenas Practicas

- No editar movimientos historicos.
- Si hay error, crear un nuevo ajuste compensatorio.
- Guardar `stockBefore` y `stockAfter`.
- Guardar snapshot de producto y variante para mantener contexto aunque se renombre.
- Exigir motivo para ajustes manuales y bajas por dano.
- No permitir stock negativo.
- Integrar con auditoria admin.

## 2. Admin Socios: Auditoria Por Admin

### Objetivo

Registrar acciones importantes hechas por Diego y David para saber quien creo, edito, desconto, elimino o cambio estados.

### Alcance

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Modelo `AuditLog` | Alta | Pendiente | Tipo central de auditoria |
| Store local de auditoria | Alta | Pendiente | `data-store.audit-logs.ts` |
| Helper `recordAuditLog` | Alta | Pendiente | Centralizar escritura de logs |
| Auditoria productos | Alta | Pendiente | Crear, editar, activar, destacar, precio, descuento |
| Auditoria inventario | Alta | Pendiente | Ajustes, entradas, salidas, variantes activas |
| Auditoria pedidos | Alta | Pendiente | Crear, editar, cambiar estado, cancelar, devolver |
| Auditoria categorias | Media | Pendiente | Crear, editar, activar/desactivar |
| Auditoria blog | Media | Pendiente | Crear, editar, publicar/despublicar |
| Pagina `/admin/actividad` | Alta | Pendiente | Timeline filtrable de acciones |
| Actividad por socio | Media | Pendiente | Filtrar Diego/David |
| Exportar auditoria | Media | Pendiente | CSV para control externo |

### Acciones A Auditar

| Modulo | Acciones |
| --- | --- |
| Productos | Crear, editar, activar/desactivar, eliminar, cambiar precio, cambiar descuento, destacar |
| Inventario | Entrada, salida, ajuste, activar/desactivar variante |
| Pedidos | Crear pedido admin, cambiar estado, cancelar, devolver, editar datos |
| Categorias | Crear, editar, activar/desactivar |
| Blog | Crear, editar, publicar/despublicar |
| Clientes | Crear cliente desde pedido, editar datos, crear direccion |
| Descuentos | Aplicar descuento masivo, quitar descuento |

### Modelo Propuesto

```ts
type AuditLog = {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  changes?: Array<{
    field: string;
    before: unknown;
    after: unknown;
  }>;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
```

### Buenas Practicas

- No guardar contrasenas ni datos sensibles innecesarios.
- No auditar cada tecla, solo submit/cambio real.
- Guardar cambios relevantes con `before`, `after` y `changes`.
- Para acciones automaticas, usar `system` o el admin que disparo el flujo.
- Los logs no deben poder editarse desde UI.
- Los cambios de stock deben crear `AuditLog` y `StockMovement`.

## 3. SEO Tecnico Y Ecommerce

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| `app/sitemap.ts` | Alta | Pendiente | Home, catalogo, categorias, productos activos, blog y paginas utiles |
| `app/robots.ts` | Alta | Pendiente | Bloquear rutas privadas y declarar sitemap |
| Canonicals | Alta | Pendiente | Evitar duplicados en home, catalogo, categorias, productos y blog |
| Product JSON-LD | Alta | Pendiente | `Product`, `Offer`, `priceCurrency: PEN`, `availability`, `sku`, `brand` |
| Organization JSON-LD | Alta | Pendiente | Marca, logo, URL, redes y contacto |
| Article JSON-LD | Media | Pendiente | Blog posts con autor, fechas, imagen y publisher |
| Campos SEO producto | Alta | Pendiente | `metaTitle`, `metaDescription`, `ogImage`, `seoDescription` |
| Campos SEO categoria | Alta | Pendiente | Titulo SEO, descripcion SEO, texto largo |
| Vista previa SEO | Media | Pendiente | Preview de Google/social en admin |
| Redirecciones 301 | Media | Pendiente | Necesario si se cambian slugs |
| Feed Google Merchant | Media | Pendiente | Catalogo para Shopping/Merchant Center |
| Feed Meta/TikTok | Media | Pendiente | Catalogos para pauta |

## 4. Cliente Y Checkout

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Seguimiento de pedido | Alta | Pendiente | Estado, direccion, productos, tracking y guia |
| Email/WhatsApp confirmacion | Alta | Pendiente | Notificacion post-compra |
| Comprobante de pago | Alta | Pendiente | Subida o registro de comprobante si pago manual |
| Pago real | Alta | Pendiente | Culqi, Niubiz, Mercado Pago, Izipay u otro |
| Webhooks de pago | Alta | Pendiente | Confirmar pagos y evitar manipulacion client-side |
| Cupones | Media | Pendiente | Codigo, vigencia, limite de uso, monto minimo |
| Solicitud de devolucion | Media | Pendiente | Flujo postventa controlado |
| Reviews reales | Media | Pendiente | Confianza y posible SEO |
| Guia de tallas contextual | Media | Pendiente | Por categoria/producto |
| Wishlist por usuario backend | Baja | Pendiente | Hoy favoritos son client-side |

## 5. Logistica, Proveedores Y Margen

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Proveedores | Alta | Pendiente | Nombre, contacto, notas, productos asociados |
| Compras/reposiciones | Alta | Pendiente | Registrar entradas con costo y proveedor |
| Costo por producto | Alta | Pendiente | Base para margen |
| Costo por variante | Media | Pendiente | Si aplica por talla/color |
| Margen bruto | Alta | Pendiente | Precio venta - costo |
| Utilidad por pedido | Alta | Pendiente | Margen total por pedido |
| Productos sin rotacion | Media | Parcial | Existe contador base, falta reporte accionable |
| Alertas de reposicion | Media | Parcial | Existe stock bajo, falta accion logistica |
| Dano/merma | Media | Pendiente | Registrar salida por producto no vendible |

## 6. Pedidos Y Despacho

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Estado logistico separado | Alta | Pendiente | Preparando, empacado, despachado, entregado |
| Courier | Alta | Pendiente | Empresa de envio |
| Numero de guia | Alta | Pendiente | Tracking para cliente/admin |
| Fecha de despacho | Media | Pendiente | Control logistico |
| Checklist de preparacion | Media | Pendiente | Pagado, empacado, enviado |
| Comentarios internos | Media | Pendiente | Notas no visibles al cliente |
| Edicion controlada de pedido | Media | Parcial | Ya hay base, falta auditoria completa |

## 7. Analiticas Y Reportes

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Ventas por socio/admin | Alta | Pendiente | Pedidos gestionados por Diego/David |
| Actividad por socio/admin | Alta | Pendiente | Acciones realizadas |
| Margen por periodo | Alta | Pendiente | Utilidad mensual/semanal |
| Ventas por variante | Media | Pendiente | Talla/color mas vendido |
| Rotacion de inventario | Media | Pendiente | Productos lentos/rapidos |
| Exportaciones avanzadas | Media | Parcial | Hay CSV basico, falta mas reportes |
| Eventos ecommerce | Media | Pendiente | GA4/Meta/TikTok: view, add to cart, checkout, purchase |

## 8. Backend Y Produccion

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Backend real NestJS | Alta | Pendiente | `apps/api` existe pero esta minimo |
| Base de datos PostgreSQL | Alta | Pendiente | Persistencia real |
| Prisma schema | Alta | Pendiente | Modelos de negocio |
| Auth server-side | Alta | Pendiente | Cookies/JWT, proteccion real |
| Password hashing | Alta | Pendiente | Seguridad real |
| Transacciones de stock | Alta | Pendiente | Evitar sobreventa |
| Webhooks | Alta | Pendiente | Pagos/envios/notificaciones |
| Backups | Media | Pendiente | Seguridad operacional |
| Permisos por rol | Media | Pendiente | Superadmin, logistico, contenido, lectura |

## Roadmap Sugerido

| Sprint | Objetivo | Entregables |
| --- | --- | --- |
| 1 | Trazabilidad de stock | `StockMovement`, store, movimientos automaticos, ajuste manual, historial basico |
| 2 | Auditoria de socios | `AuditLog`, helper central, logs en productos/pedidos/categorias, `/admin/actividad` |
| 3 | SEO base | `robots.ts`, `sitemap.ts`, canonical, Product JSON-LD, Organization JSON-LD |
| 4 | Logistica avanzada | Proveedores, costos, margen, compras/reposiciones, tracking/courier |
| 5 | Pagos y postventa | Comprobantes, pagos reales, emails/WhatsApp, devoluciones, cupones |
| 6 | Backend real | Prisma/PostgreSQL, auth segura, transacciones y migracion de stores |

## Criterios De Finalizacion

Una funcion se marca como completa solo si cumple:

- Modelo de datos definido.
- UI cliente/admin implementada si aplica.
- Validaciones implementadas.
- Manejo de errores.
- Respeta roles: invitado, cliente, admin.
- Responsive desktop/mobile.
- Registra auditoria si modifica datos criticos.
- Registra movimiento si modifica stock.
- Exporta datos si impacta operacion.
- Pasa `pnpm --filter @apps/web check-types`.
- Pasa `pnpm --filter @apps/web lint`.
