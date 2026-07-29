export const ROUTES = {
  home: "/",
  catalogo: "/catalogo",
  catalogoCategory: (slug: string) => `/catalogo/${slug}`,
  sobreNosotros: "/sobre-nosotros",
  nuestraHistoria: "/nuestra-historia",
  lookbook: "/lookbook",
  colaboraciones: "/colaboraciones",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  contacto: "/contacto",
  envios: "/envios",
  devoluciones: "/devoluciones",
  guiaDeTallas: "/guia-de-tallas",
  faq: "/faq",
  loUltimo: "/#lo-ultimo",
  catalogoAnchor: "/#catalogo",
  // Auth
  login: "/login",
  registro: "/registro",
  recuperarPassword: "/recuperar-password",
  nuevaPassword: "/nueva-password",
  // Cuenta
  cuenta: "/cuenta",
  pedidos: "/cuenta/pedidos",
  direcciones: "/cuenta/direcciones",
  // Admin
  admin: "/admin",
  // Admin - Productos
  adminProductos: "/admin/productos",
  adminProductoNuevo: "/admin/productos/nuevo",
  adminProductoEditar: (id: number) => `/admin/productos/${id}`,
  // Admin - Categorías
  adminCategorias: "/admin/categorias",
  adminCategoriaNueva: "/admin/categorias/nueva",
  adminCategoriaEditar: (slug: string) => `/admin/categorias/${slug}`,
  // Admin - Pedidos
  adminPedidos: "/admin/pedidos",
  adminPedidoDetalle: (id: string) => `/admin/pedidos/${id}`,
  // Admin - Usuarios
  adminUsuarios: "/admin/usuarios",
  adminUsuarioDetalle: (id: string) => `/admin/usuarios/${id}`,
  favoritos: "/favoritos",
} as const;
