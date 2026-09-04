export const ROUTES = {
  home: "/",
  catalogo: "/catalogo",
  catalogoCategory: (slug: string) => `/catalogo/${slug}`,
  sobreNosotros: "/sobre-nosotros",
  nuestraHistoria: "/nuestra-historia",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  contacto: "/contacto",
  envios: "/envios",
  devoluciones: "/devoluciones",
  guiaDeTallas: "/guia-de-tallas",
  faq: "/faq",
  terminos: "/terminos",
  privacidad: "/privacidad",
  cookies: "/cookies",
  libroDeReclamaciones: "/libro-de-reclamaciones",
  loUltimo: "/#lo-ultimo",
  catalogoAnchor: "/#catalogo",

  login: "/login",
  registro: "/registro",
  recuperarPassword: "/recuperar-password",
  nuevaPassword: "/nueva-password",

  cuenta: "/cuenta",
  pedidos: "/cuenta/pedidos",
  direcciones: "/cuenta/direcciones",

  admin: "/admin",
  adminAnaliticas: "/admin/analiticas",
  adminInventario: "/admin/inventario",
  adminAuditoria: "/admin/auditoria",

  adminFaq: "/admin/configuracion/faq",

  adminProductos: "/admin/productos",
  adminProductoNuevo: "/admin/productos/nuevo",
  adminProductoEditar: (id: string) => `/admin/productos/${id}`,

  adminCategorias: "/admin/configuracion/categorias",
  adminCategoriaNueva: "/admin/configuracion/categorias/nueva",
  adminCategoriaEditar: (slug: string) => `/admin/configuracion/categorias/${slug}`,

  adminPedidos: "/admin/pedidos",
  adminPedidoNuevo: "/admin/pedidos/nuevo",
  adminPedidoDetalle: (id: string) => `/admin/pedidos/${id}`,

  adminPagos: "/admin/pagos",
  adminPagoDetalle: (id: string) => `/admin/pagos/${id}`,

  adminEnvios: "/admin/envios",
  adminEnvioDetalle: (id: string) => `/admin/envios/${id}`,

  adminProveedores: "/admin/proveedores",
  adminProveedorDetalle: (id: string) => `/admin/proveedores/${id}`,

  adminCompras: "/admin/compras",
  adminCompraDetalle: (id: string) => `/admin/compras/${id}`,

  adminCupones: "/admin/cupones",
  adminCuponDetalle: (id: string) => `/admin/cupones/${id}`,

  adminDevoluciones: "/admin/devoluciones",
  adminDevolucionDetalle: (id: string) => `/admin/devoluciones/${id}`,

  adminBlog: "/admin/configuracion/blog",
  adminBlogNuevo: "/admin/configuracion/blog/nuevo",
  adminBlogEditar: (id: string) => `/admin/configuracion/blog/${id}`,

  adminUsuarios: "/admin/usuarios",
  adminUsuarioDetalle: (id: string) => `/admin/usuarios/${id}`,
  favoritos: "/favoritos",
  producto: (slug: string) => `/producto/${slug}`,
  carrito: "/carrito",
  pedidoConfirmado: "/pedido-confirmado",
} as const;
