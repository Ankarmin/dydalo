# Contexto De Negocio DYDALO

Documento de contexto para OpenCode y para cualquier sesion futura de trabajo sobre el ecommerce.

Ultima actualizacion: 2026-07-30

## Resumen

DYDALO es un ecommerce de moda urbana/streetwear orientado a venta directa al cliente en Peru. El negocio combina catalogo online, administracion interna, control logistico, contenido de marca y optimizacion SEO para adquisicion organica.

El sistema debe funcionar como tienda publica y como herramienta operativa para dos socios con responsabilidades complementarias.

## Socios Y Roles

| Socio | Rol principal | Responsabilidades |
| --- | --- | --- |
| Diego Alessandro Quiroz Fernandez | Socio logistico/comercial | Compra de productos, recepcion de mercaderia, control de stock, ventas, preparacion de pedidos, despacho, devoluciones y seguimiento operativo |
| David Sebastian Pinarreta Rojas | Socio tecnico/diseno/SEO | Desarrollo del ecommerce, diseno visual, UX, contenido, SEO, configuracion tecnica, analiticas y mejoras digitales |

## Usuarios Admin Configurados

| Email | Nombre | Rol |
| --- | --- | --- |
| `diego@dydalo.com` | Diego Alessandro Quiroz Fernandez | Admin |
| `david@dydalo.com` | David Sebastian Pinarreta Rojas | Admin |

## Principio De Trabajo Entre Socios

El ecommerce debe permitir operar con trazabilidad. Cuando ambos socios administran el sistema, no basta con ver el estado final de un producto o pedido. Se debe poder saber:

- Quien hizo una accion.
- Cuando la hizo.
- Que entidad afecto.
- Que valor cambio.
- Cual fue el valor anterior y el nuevo.
- Desde que flujo se ejecuto.
- Cual fue el motivo, si aplica.

## Division Practica De Responsabilidades

### Diego: Logistica, Stock Y Ventas

Diego necesita herramientas para operar el dia a dia sin depender de codigo ni edicion tecnica.

Responsabilidades clave:

- Registrar compras y entradas de mercaderia.
- Ajustar stock despues de conteos fisicos.
- Revisar variantes agotadas o con stock bajo.
- Preparar pedidos.
- Cambiar estados logisticos.
- Registrar courier, guia y despacho.
- Gestionar devoluciones.
- Validar pagos o comprobantes cuando el pago sea manual.
- Exportar informacion para control externo.

Necesidades del sistema:

- Historial de movimientos de stock por variante.
- Ajustes manuales con motivo obligatorio.
- Reportes de productos sin rotacion.
- Alertas de reposicion.
- Datos de proveedor y costo.
- Margen bruto por producto, variante y pedido.
- Tracking/courier por pedido.
- Auditoria clara de acciones hechas por cada admin.

### David: Ecommerce, Diseno Y SEO

David necesita herramientas para evolucionar el canal digital, mejorar conversion y posicionamiento organico.

Responsabilidades clave:

- Mantener UI/UX del ecommerce.
- Mejorar contenido y estructura SEO.
- Crear o editar productos, categorias y blog.
- Gestionar metadatos, slugs y textos comerciales.
- Revisar analiticas de venta y adquisicion.
- Implementar integraciones tecnicas.
- Mantener performance y accesibilidad.

Necesidades del sistema:

- Campos SEO administrables por producto, categoria y blog.
- Vista previa de resultados SEO/social.
- Sitemap, robots, canonical y JSON-LD.
- Landing pages SEO.
- Control de banners, colecciones y campanas.
- Auditoria de cambios para productos, descuentos, categorias y contenido.
- Analiticas de ecommerce: vista de producto, add to cart, checkout y compra.

## Estado Actual Del Ecommerce

| Area | Estado |
| --- | --- |
| Catalogo publico | Existe |
| Categorias | Existe |
| Detalle de producto | Existe |
| Galeria de producto | Existe |
| Carrito por variante | Existe |
| Persistencia de carrito invitado | Existe en `localStorage` |
| Checkout | Existe, protegido por login |
| Direcciones Peru | Existe con departamento, provincia y distrito |
| Pedidos cliente | Existe |
| Pedidos admin | Existe |
| Inventario por variante | Existe |
| Dashboard admin | Existe |
| Analiticas admin | Existe basico |
| Favoritos | Existe para cliente/invitado, desactivado para admin |
| Blog | Existe basico |
| SEO tecnico avanzado | Pendiente |
| Backend real | Pendiente |
| Auditoria por admin | Pendiente |
| Historial de stock | Pendiente |

## Reglas Comerciales Actuales

- Invitado puede agregar productos al carrito.
- Invitado debe iniciar sesion para entrar a `/carrito` y completar checkout.
- Cliente autenticado puede comprar.
- Admin puede visualizar la tienda publica.
- Admin no puede comprar.
- Admin no ve carrito.
- Admin no usa favoritos.
- Stock real se controla por variante: producto + talla + color.
- `product.stock` debe entenderse como total agregado de variantes activas, no como fuente unica de verdad.

## Criterios De Calidad Para Futuras Funciones

- Mantener separadas las responsabilidades de cliente, admin logistico y admin tecnico.
- Registrar auditoria en acciones sensibles.
- Registrar movimientos cuando cambie stock.
- Trabajar inventario siempre por variante.
- Evitar textos de UI que parezcan mock o demo.
- Mantener responsive desktop/mobile.
- Evitar cambios grandes si una solucion pequena resuelve el problema.
- Ejecutar `pnpm --filter @apps/web check-types` y `pnpm --filter @apps/web lint` despues de cambios relevantes.

## Riesgos Actuales

| Riesgo | Impacto |
| --- | --- |
| Stores/localStorage en vez de backend real | Datos no son confiables para produccion multiusuario |
| Sin auditoria admin | No se sabe quien hizo cambios criticos |
| Sin movimientos de stock | No se puede reconstruir inventario historico |
| Sin costo/proveedor | No se puede medir margen real |
| Sin tracking/courier | La gestion logistica depende de control externo |
| SEO incompleto | Menor visibilidad organica |
| Sin pagos reales/webhooks | Control manual de pago y riesgo operativo |

## Prioridad Estrategica

La siguiente etapa debe enfocarse en trazabilidad y SEO base:

1. Historial de movimientos de stock.
2. Auditoria por admin/socio.
3. SEO tecnico: `robots.ts`, `sitemap.ts`, canonicals y Product JSON-LD.
4. Costo/proveedor/margen.
5. Tracking/courier y estados logisticos.
