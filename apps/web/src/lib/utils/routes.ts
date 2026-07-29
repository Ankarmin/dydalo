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

  adminProductos: "/admin/productos",
  adminProductoNuevo: "/admin/productos/nuevo",
  adminProductoEditar: (id: number) => `/admin/productos/${id}`,

  adminCategorias: "/admin/categorias",
  adminCategoriaNueva: "/admin/categorias/nueva",
  adminCategoriaEditar: (slug: string) => `/admin/categorias/${slug}`,

  adminPedidos: "/admin/pedidos",
  adminPedidoDetalle: (id: string) => `/admin/pedidos/${id}`,

  adminUsuarios: "/admin/usuarios",
  adminUsuarioDetalle: (id: string) => `/admin/usuarios/${id}`,
  favoritos: "/favoritos",
  producto: (slug: string) => `/producto/${slug}`,
  carrito: "/carrito",
  pedidoConfirmado: "/pedido-confirmado",
} as const;
