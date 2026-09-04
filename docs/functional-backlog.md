# Backlog Funcional DYDALO

Documento vivo de funciones faltantes para evaluar, priorizar y actualizar conforme avance el ecommerce.

Ultima actualizacion: 2026-09-03

## Decisiones Vigentes (2026-09-03)

| Tema | Decision |
| --- | --- |
| Pagos | MercadoPago, `binary_mode: false` (ver todos los estados) |
| Facturacion electronica SUNAT | Diferida, solo campos `billingType, ruc, razonSocial` nullable |
| Roles | Solo `admin/customer`, sin roles extra por ahora |
| Fulfillment | Triple: `LIMA_APP` (inDriver/Uber) / `PROVINCIA_OLVA` / `RECOJO` en oficina |
| Costo de envio | Lo paga el cliente, precio manual por pedido, web muestra estimado (`desde S/10 / desde S/15 / recojo gratis`) |
| Recojo en oficina | Gratis, horario segun disponibilidad coordinada por WhatsApp |
| Configuracion tienda (B-05) | Sin UI admin, David lo mantiene en codigo |
| Auth dura y SEO base | Diferidos, se queda mock actual |
| Division | David tecnico (codigo/UI), Diego operario (solo admin, no toca config) |
| Modelo pedido/pago | Modelo A: pedido primero `pendiente` + reserva temporal stock (24h online / 48h manual), venta definitiva al `aprobado` |

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
| Historial de movimientos de stock | Alta | Hecho | Kardex por variante + `reservation`/`release_reservation` |
| Auditoria por admin | Alta | Hecho | `auditStore` + `/admin/auditoria` con filtros y CSV |
| B-01 Pagos y reserva temporal | Alta | Hecho | 11 estados MP + `Online/Manual` + `/admin/pagos` + reintento |
| Fulfillment triple App/Olva/Recojo (B-02) | Alta | Hecho | Timeline, estados por tipo, guía/DNI, cobrado vs real Olva |
| Costo/proveedor/margen (B-06) | Alta | Hecho | Proveedores + OC con recepción, costo por producto, foto al vender |
| Cupones (B-09) | Alta | Hecho | Código único, %/S/, vigencia, usos, 1 por cliente, acumula con dto producto |
| Devoluciones RMA (B-03) | Alta | Hecho | Por items, inspección con damage, web + Diego, reembolso ligado a pago |
| Kardex pulido (K-01) | Alta | Hecho | Tipo `damage`, motivo mín 5, bloqueo negativo, merma en analíticas |
| SEO tecnico base | Alta | Pendiente | Diferido por decision 2026-09-03 |
| Backend real | Alta | Pendiente | Necesario para multiusuario real |
| Campos SEO admin | Alta | Pendiente | Necesario para escalar contenido |
| Auth server-side | Alta | Pendiente | Diferida por decision 2026-09-03 |
| Reviews | Media | Pendiente | Confianza y SEO |
| Carrito abandonado | Media | Pendiente | Recuperacion de ventas |

## 1. Admin Logistico: Historial De Movimientos De Stock

### Objetivo

Registrar cada cambio de stock por variante para saber entradas, ventas, ajustes, devoluciones y responsable.

### Alcance

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Modelo `StockMovement` | Alta | Hecho | `data-store.types.ts`, incluye `reservation` y `release_reservation` desde B-01 |
| Store local de movimientos | Alta | Hecho | `data-store.stock-movements.ts` mientras no haya backend |
| Reserva temporal checkout | Alta | Hecho | Movimiento `reservation` con expiracion 24h, razon obligatoria |
| Reserva temporal pedido admin | Alta | Hecho | Movimiento `reservation` con expiracion 48h, `origin: manual` |
| Venta definitiva al aprobado | Alta | Hecho | `updatePaymentStatus(aprobado/verificado_manual)` convierte reserva en venta con auditoria |
| Liberacion por expiracion | Alta | Hecho | `expireStaleReservations()`: cancela, libera stock, intento `cancelado` y audit como `sistema` |
| Registro por cancelacion | Alta | Hecho | Movimiento `cancellation` que devuelve stock |
| Registro por devolucion | Alta | Hecho | Movimiento `return` que reingresa stock |
| Ajuste manual | Alta | Hecho | Motivo mín 5 caracteres, bloqueo si queda negativo |
| Historial en producto | Alta | Hecho | Ver movimientos por producto/variante |
| Historial global | Media | Hecho | `/admin/inventario` con todos los movimientos |
| Exportar CSV | Media | Hecho | Control externo de inventario |
| Filtros avanzados | Media | Hecho | Fecha, producto, variante, tipo, responsable |
| Dano/merma `damage` | Alta | Hecho | Movimiento merma + resta automática al cerrar RMA total |
| Motivo obligatorio en ajustes | Alta | Hecho | Mín 5 caracteres |
| No permitir stock negativo | Alta | Hecho | Bloqueo con mensaje de disponible |

### Tipos De Movimiento

| Tipo | Direccion | Uso | Estado |
| --- | --- | --- | --- |
| `purchase` | Entrada | Compra o reposicion de mercaderia | Hecho |
| `manual_adjustment` | Entrada/salida | Correccion por conteo fisico | Hecho, falta motivo obligatorio |
| `sale` | Salida | Venta definitiva al aprobarse el pago | Hecho (antes se registraba al crear pedido) |
| `reservation` | Salida/bloqueo | Reserva temporal checkout (24h) o manual (48h) | Hecho B-01 |
| `release_reservation` | Entrada/liberacion | Reserva expirada sin pago | Hecho B-01 |
| `order_cancelled` / `cancellation` | Entrada | Cancelacion que devuelve stock | Hecho |
| `return` | Entrada | Producto devuelto y reingresado | Hecho |
| `damage` | Salida | Producto danado o no vendible | Hecho K-01 |
| `order_edit` | Entrada/salida | Edicion de pedido admin | Hecho |

### Modelo Propuesto

```ts
type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  color: string;
  type: StockMovementType;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  orderId?: string;
  reason?: string;
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
- Exigir motivo (mín 5 caracteres) para ajustes manuales y bajas por dano.
- No permitir stock negativo: bloquear con mensaje.
- Integrar con auditoria admin.

## 2. Admin Socios: Auditoria Por Admin

### Objetivo

Registrar acciones importantes hechas por Diego y David para saber quien creo, edito, desconto, elimino o cambio estados.

### Alcance

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Modelo `AuditLog` | Alta | Hecho | Tipo central de auditoria con `before/after/changes` |
| Store local de auditoria | Alta | Hecho | `data-store.audit.ts` |
| Auditoria productos | Alta | Hecho | Crear, editar, activar, destacar, precio, descuento |
| Auditoria inventario | Alta | Hecho | Ajustes, entradas, salidas, reservas, variantes activas |
| Auditoria pedidos | Alta | Hecho | Crear, editar, cambiar estado, cancelar, devolver |
| Auditoria pagos | Alta | Hecho | Cada intento con actor (`sistema_mp`, `diego`, `cliente`) y motivo |
| Auditoria categorias | Media | Hecho | Crear, editar, activar/desactivar |
| Auditoria blog | Media | Hecho | Crear, editar, publicar/despublicar |
| Pagina `/admin/auditoria` | Alta | Hecho | Timeline filtrable (antes `/admin/actividad` propuesto) |
| Actividad por socio | Media | Hecho | Filtrar por responsable Diego/David |
| Exportar auditoria | Media | Hecho | CSV para control externo |

### Acciones A Auditar

| Modulo | Acciones | Estado |
| --- | --- | --- |
| Productos | Crear, editar, activar/desactivar, eliminar, cambiar precio, cambiar descuento, destacar | Hecho |
| Inventario | Entrada, salida, reserva, liberacion, ajuste, activar/desactivar variante | Hecho |
| Pedidos | Crear pedido admin, cambiar estado, cancelar, devolver, editar datos, expiracion automatica | Hecho |
| Pagos | Intentos, aprobacion, rechazo, revision, verificado manual, reembolso, contracargo | Hecho B-01 |
| Categorias | Crear, editar, activar/desactivar | Hecho |
| Blog | Crear, editar, publicar/despublicar | Hecho |
| Clientes | Crear cliente desde pedido, editar datos, crear direccion | Hecho |
| Descuentos | Aplicar descuento masivo, quitar descuento | Hecho |

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
  before?: unknown;
  after?: unknown;
  changes?: Array<{
    field: string;
    before: unknown;
    after: unknown;
  }>;
  reason?: string;
  createdAt: string;
};
```

### Buenas Practicas

- No guardar contrasenas ni datos sensibles innecesarios.
- No auditar cada tecla, solo submit/cambio real.
- Guardar cambios relevantes con `before`, `after` y `changes`.
- Para acciones automaticas, usar `sistema` o `sistema_mp` como actor.
- Los logs no deben poder editarse desde UI.
- Los cambios de stock deben crear `AuditLog` y `StockMovement`.

## 3. SEO Tecnico Y Ecommerce

Diferido por decision 2026-09-03. Se mantiene el inventario para fase posterior.

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| `app/sitemap.ts` | Alta | Pendiente | Home, catalogo, categorias, productos activos, blog y paginas utiles |
| `app/robots.ts` | Alta | Pendiente | Bloquear rutas privadas y declarar sitemap |
| Canonicals | Alta | Pendiente | Evitar duplicados en home, catalogo, categorias, productos y blog |
| Product JSON-LD | Alta | Pendiente | `Product`, `Offer`, `priceCurrency: PEN`, `availability`, `sku`, `brand` |
| Organization JSON-LD | Alta | Pendiente | Marca, logo, URL, redes y contacto |
| Article JSON-LD | Media | Pendiente | Blog posts con autor, fechas, imagen y publisher |
| Campos SEO producto | Alta | Parcial | `metaTitle`, `metaDescription` existen en tipo, falta UI completa |
| Campos SEO categoria | Alta | Pendiente | Titulo SEO, descripcion SEO, texto largo |
| Vista previa SEO | Media | Pendiente | Preview de Google/social en admin |
| Redirecciones 301 | Media | Pendiente | Necesario si se cambian slugs |
| Feed Google Merchant | Media | Pendiente | Catalogo para Shopping/Merchant Center |
| Feed Meta/TikTok | Media | Pendiente | Catalogos para pauta |

## 4. Cliente Y Checkout

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Pedido primero + reserva temporal | Alta | Hecho | Modelo A: pedido `pendiente` + stock reservado antes del pago |
| Intento de pago inicial | Alta | Hecho | Checkout crea intento `pendiente` + preferencia MP (mock) |
| Ruta `/checkout/reintentar` | Alta | Hecho | Retoma pago sin duplicar pedido ni stock |
| `pedido-confirmado` por estado | Alta | Hecho | Confirmado / recibido con reserva / observado con reintento |
| Mis pedidos con estado de pago | Alta | Hecho | `/cuenta/pedidos` real con reintentar y mensaje amable |
| Seguimiento de pedido | Alta | Parcial | Estado y direccion existen, falta tracking/guía (B-02) |
| Comprobante de pago | Alta | Hecho | Evidencia obligatoria en verificado manual, referencia en revision |
| Pago real MercadoPago | Alta | Parcial | Mock con 11 estados + simulador webhook, falta SDK y webhook firmado |
| Webhooks de pago | Alta | Pendiente | Confirmar pagos y evitar manipulacion client-side (backend) |
| Cupones (B-09) | Alta | Hecho | `/admin/cupones`, checkout + manual, 1 uso por cuenta, acumula con dto |
| Solicitud de devolucion (B-03) | Alta | Hecho | Web en cuenta (7 días) + Diego manual, inspección y cierre con reembolso |
| Email/WhatsApp confirmacion | Alta | Parcial | Plantillas copiables en `/admin/pagos`, falta envio automatico |
| Reviews reales | Media | Pendiente | Confianza y posible SEO |
| Guia de tallas contextual | Media | Pendiente | Por categoria/producto |
| Wishlist por usuario backend | Baja | Pendiente | Hoy favoritos son client-side |

## 5. Logistica, Proveedores Y Margen

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Proveedores (B-06) | Alta | Hecho | Alta, edicion y activado con auditoria |
| Compras/reposiciones (B-06) | Alta | Hecho | OC pendiente/parcial/recibida/cancelada, recepcion suma stock |
| Costo por producto (B-06) | Alta | Hecho | `costPrice` con margen vivo en formulario, ultimo costo al recibir OC |
| Costo por variante | Media | Pendiente | Decision: costo por producto, no aplica por ahora |
| Margen bruto (B-06) | Alta | Hecho | Foto `unitCost` al vender, por item/pedido/periodo en analiticas |
| Utilidad por pedido (B-06) | Alta | Hecho | Columna margen en `/admin/pedidos`, “—” sin costo |
| Productos sin rotacion | Media | Parcial | Existe contador base, falta reporte accionable |
| Alertas de reposicion | Media | Parcial | Existe stock bajo, falta accion logistica |

## 6. Pedidos Y Despacho

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Origen `Online MP` / `Manual` | Alta | Hecho | Etiqueta, filtros y estados de pago propios por tipo |
| Pedido manual con reserva | Alta | Hecho | Nace `pendiente + stockReserved`, expira en 48h |
| Fulfillment triple (B-02) | Alta | Hecho | `LIMA_APP` sin costo (paga al recibir) / `PROVINCIA_OLVA` base S/15 / `RECOJO` gratis disponibilidad |
| Precio de envio manual | Alta | Pendiente | B-02: editable por pedido, web muestra estimado |
| Courier | Alta | Pendiente | B-02: Olva / inDriver / Uber |
| Numero de guia | Alta | Pendiente | B-02: guía Olva, placa app, DNI recojo |
| Fecha de despacho | Media | Pendiente | B-02: control logistico |
| Checklist de preparacion | Media | Pendiente | Pagado, empacado, enviado |
| Comentarios internos | Media | Pendiente | Notas no visibles al cliente |
| Edicion controlada de pedido | Media | Hecho | Con auditoria completa de cambios de pago |
| Estado logistico separado | Alta | Pendiente | Preparando, empacado, despachado, entregado |

## 7. Analiticas Y Reportes

| Funcion | Prioridad | Estado | Detalle |
| --- | --- | --- | --- |
| Ventas por socio/admin | Alta | Pendiente | Pedidos gestionados por Diego/David |
| Actividad por socio/admin | Alta | Hecho | Filtro por responsable en auditoria |
| Margen por periodo | Alta | Pendiente | Requiere B-06 |
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
| Auth server-side | Alta | Pendiente | Diferida: cookies/JWT, proteccion real |
| Password hashing | Alta | Pendiente | Seguridad real |
| Transacciones de stock | Alta | Pendiente | Evitar sobreventa (hoy reserva logica en frontend) |
| Webhooks MP firmados | Alta | Pendiente | Pagos/envios/notificaciones |
| Backups | Media | Pendiente | Seguridad operacional |
| Permisos por rol | Media | Pendiente | Diferidos: hoy solo `admin/customer` |

## 9. B-01 Pagos Y Reserva Temporal (Hecho 2026-09-03)

### Alcance entregado

| Funcion | Detalle |
| --- | --- |
| 11 estados de pago | `sin_registro, pendiente, in_process, aprobado, rechazado, cancelado, reembolsado, en_revision, verificado_manual, en_disputa, contracargo` |
| Tipos de pedido | `mp_online` (auto webhook) vs `manual` (Diego con motivo+foto), `manual_con_link_MP` hereda webhook |
| `/admin/pagos` | KPIs, filtros origen/estado/busqueda, solo alertas, paginacion, subtitulo comercial |
| `/admin/pagos/[id]` | Timeline de intentos, simulador webhook MP, accion manual Diego, reintento + WhatsApp |
| Alertas | `rechazado >2h sin reintento`, `revision >24h` |
| Reserva temporal | 24h online / 48h manual, `expireStaleReservations()` en pagos, pedidos y cuenta |
| Backfill | Migra pedidos e intentos viejos sin romper datos |

### Orden acordado siguiente

| Orden | Modulo |
| --- | --- |
| 1 | B-02 Fulfillment triple | Hecho 2026-09-03 |
| 2 | B-01 Pagos y reserva | Hecho 2026-09-03 |
| 3 | B-06 Costo/proveedor/margen | Hecho 2026-09-03 |
| 4 | B-09 Cupones | Hecho 2026-09-03 |
| 5 | B-03 Devoluciones | Pendiente |
| 6 | K-01 Kardex pulido | Hecho 2026-09-03 |

## Roadmap Sugerido

| Sprint | Objetivo | Estado | Entregables |
| --- | --- | --- | --- |
| 1 | Trazabilidad de stock | Hecho | `StockMovement`, store, movimientos automaticos, reserva temporal, historial, CSV |
| 2 | Auditoria de socios | Hecho | `AuditLog`, logs en productos/pedidos/pagos/categorias, `/admin/auditoria` |
| 3 | B-01 Pagos y reserva | Hecho | 11 estados, `/admin/pagos`, reintento, expiracion, cuenta con pagos |
| 4 | B-02 Fulfillment triple | Hecho 2026-09-03 | App/Olva/Recojo, guias, precio manual, tracking cliente |
| 5 | B-06 Costos y B-09 Cupones | Hecho 2026-09-03 | Proveedores, margen con foto, cupones con auditoria |
| 6 | B-03 Postventa | Hecho 2026-09-03 | Devoluciones RMA por items, inspección con damage, reembolso |
| 7 | SEO base | Diferido | `robots.ts`, `sitemap.ts`, canonical, JSON-LD |
| 8 | Backend real | Pendiente | Prisma/PostgreSQL, auth segura, webhooks firmados, migracion de stores |

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
- Pasa `pnpm --filter @apps/web lint` (sin errores; warnings preexistentes documentados).
