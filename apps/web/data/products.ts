export type ProductType = "Ropa" | "Calzado" | "Accesorios" | "Bling";

export type ProductCategory = (typeof catalogCategories)[number]["slug"];

export type ProductSize = "S" | "M" | "L" | "XL" | "28" | "30" | "32" | "34" | "36" | "Única";

export type Product = {
  id: number;
  name: string;
  type: ProductType;
  category: ProductCategory;
  price: number;
  image: string;
  label: string;
  sizes: ProductSize[];
  colors: { name: string; hex: string }[];
};

export const products: Product[] = [
  // ── POLOS (10) ──
  { id: 1, name: 'Heavy Cotton Polo', type: 'Ropa', category: 'polos', price: 89, image: '/images/dydalo-white-basics.jpg', label: 'CLASSIC', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 2, name: 'Signature Stripe Polo', type: 'Ropa', category: 'polos', price: 104, image: '/images/dydalo-tracksuit.jpg', label: 'SIGNATURE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 3, name: 'Pique Slim Polo', type: 'Ropa', category: 'polos', price: 79, image: '/images/dydalo-satin-set.jpg', label: 'SLIM', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 4, name: 'Oversized Knit Polo', type: 'Ropa', category: 'polos', price: 118, image: '/images/dydalo-tracksuit.jpg', label: 'KNIT', sizes: ['S','M','L','XL'], colors: [{ name: 'Crema', hex: '#f5f0e8' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 5, name: 'Ribbed Collar Polo', type: 'Ropa', category: 'polos', price: 94, image: '/images/dydalo-white-basics.jpg', label: 'RIBBED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 6, name: 'Tech Mesh Polo', type: 'Ropa', category: 'polos', price: 112, image: '/images/dydalo-sneakers.jpg', label: 'MESH', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 7, name: 'Linen Blend Polo', type: 'Ropa', category: 'polos', price: 99, image: '/images/dydalo-white-basics.jpg', label: 'LINEN', sizes: ['S','M','L','XL'], colors: [{ name: 'Blanco', hex: '#f0ece4' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 8, name: 'Contrast Placket Polo', type: 'Ropa', category: 'polos', price: 108, image: '/images/dydalo-satin-set.jpg', label: 'CONTRAST', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },
  { id: 9, name: 'Vintage Wash Polo', type: 'Ropa', category: 'polos', price: 86, image: '/images/dydalo-tracksuit.jpg', label: 'VINTAGE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Verde', hex: '#3a4f2e' }] },
  { id: 10, name: 'Long Sleeve Polo', type: 'Ropa', category: 'polos', price: 115, image: '/images/dydalo-sneakers.jpg', label: 'L/S', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },

  // ── SETS DYDALO (10) ──
  { id: 11, name: 'Midnight Track Set', type: 'Ropa', category: 'sets-dydalo', price: 189, image: '/images/dydalo-tracksuit.jpg', label: 'DROP 01', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 12, name: 'Liquid Black Uniform', type: 'Ropa', category: 'sets-dydalo', price: 164, image: '/images/dydalo-satin-set.jpg', label: 'PREMIUM', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 13, name: 'Oversized Set Cream', type: 'Ropa', category: 'sets-dydalo', price: 175, image: '/images/dydalo-white-basics.jpg', label: 'CREAM', sizes: ['S','M','L','XL'], colors: [{ name: 'Crema', hex: '#f5f0e8' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 14, name: 'Co-ord Knit Set', type: 'Ropa', category: 'sets-dydalo', price: 210, image: '/images/dydalo-satin-set.jpg', label: 'KNIT', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 15, name: 'Utility Cargo Set', type: 'Ropa', category: 'sets-dydalo', price: 195, image: '/images/dydalo-sneakers.jpg', label: 'UTILITY', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 16, name: 'Brushed Fleece Set', type: 'Ropa', category: 'sets-dydalo', price: 168, image: '/images/dydalo-tracksuit.jpg', label: 'FLEECE', sizes: ['S','M','L','XL'], colors: [{ name: 'Gris', hex: '#6b6b6b' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 17, name: 'Nylon Wind Set', type: 'Ropa', category: 'sets-dydalo', price: 220, image: '/images/dydalo-satin-set.jpg', label: 'WIND', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },
  { id: 18, name: 'Jersey Co-ord', type: 'Ropa', category: 'sets-dydalo', price: 145, image: '/images/dydalo-white-basics.jpg', label: 'JERSEY', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 19, name: 'Terry Cloth Set', type: 'Ropa', category: 'sets-dydalo', price: 185, image: '/images/dydalo-tracksuit.jpg', label: 'TERRY', sizes: ['S','M','L','XL'], colors: [{ name: 'Crema', hex: '#f5f0e8' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 20, name: 'Tactical Nylon Set', type: 'Ropa', category: 'sets-dydalo', price: 235, image: '/images/dydalo-sneakers.jpg', label: 'TACTICAL', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },

  // ── CASACAS (10) ──
  { id: 21, name: 'Night Court High', type: 'Calzado', category: 'casacas', price: 176, image: '/images/dydalo-sneakers.jpg', label: 'HEAVY', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e8e4dd' }] },
  { id: 22, name: 'Tech Runner Jacket', type: 'Ropa', category: 'casacas', price: 198, image: '/images/dydalo-tracksuit.jpg', label: 'TECH', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 23, name: 'Puffer Vest Black', type: 'Ropa', category: 'casacas', price: 178, image: '/images/dydalo-satin-set.jpg', label: 'PUFFER', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 24, name: 'Bomber Nylon Jacket', type: 'Ropa', category: 'casacas', price: 210, image: '/images/dydalo-sneakers.jpg', label: 'BOMBER', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Verde', hex: '#3a4f2e' }] },
  { id: 25, name: 'Denim Trucker Jacket', type: 'Ropa', category: 'casacas', price: 188, image: '/images/dydalo-white-basics.jpg', label: 'TRUCKER', sizes: ['S','M','L','XL'], colors: [{ name: 'Indigo', hex: '#1e3a5f' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 26, name: 'Cropped Leather Jacket', type: 'Ropa', category: 'casacas', price: 320, image: '/images/dydalo-tracksuit.jpg', label: 'LEATHER', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 27, name: 'Coach Jacket Black', type: 'Ropa', category: 'casacas', price: 155, image: '/images/dydalo-satin-set.jpg', label: 'COACH', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },
  { id: 28, name: 'Sherpa Lined Jacket', type: 'Ropa', category: 'casacas', price: 245, image: '/images/dydalo-white-basics.jpg', label: 'SHERPA', sizes: ['S','M','L','XL'], colors: [{ name: 'Crema', hex: '#f5f0e8' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 29, name: 'Windbreaker Anorak', type: 'Ropa', category: 'casacas', price: 168, image: '/images/dydalo-sneakers.jpg', label: 'ANORAK', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 30, name: 'Varsity Jacket Wool', type: 'Ropa', category: 'casacas', price: 275, image: '/images/dydalo-tracksuit.jpg', label: 'VARSITY', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },

  // ── HOODIES (10) ──
  { id: 31, name: 'Shadow Oversized Hoodie', type: 'Ropa', category: 'hoodies', price: 128, image: '/images/dydalo-tracksuit.jpg', label: 'OVERSIZED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 32, name: 'Archive Zip Hoodie', type: 'Ropa', category: 'hoodies', price: 149, image: '/images/dydalo-satin-set.jpg', label: 'ARCHIVE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },
  { id: 33, name: 'Heavyweight Pullover', type: 'Ropa', category: 'hoodies', price: 135, image: '/images/dydalo-white-basics.jpg', label: 'HEAVY', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Crema', hex: '#f5f0e8' }] },
  { id: 34, name: 'Cropped Box Hoodie', type: 'Ropa', category: 'hoodies', price: 118, image: '/images/dydalo-tracksuit.jpg', label: 'CROPPED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 35, name: 'Distressed Logo Hoodie', type: 'Ropa', category: 'hoodies', price: 142, image: '/images/dydalo-sneakers.jpg', label: 'DISTRESSED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 36, name: 'Reflective Print Hoodie', type: 'Ropa', category: 'hoodies', price: 158, image: '/images/dydalo-satin-set.jpg', label: 'REFLECTIVE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 37, name: 'Double Layer Hoodie', type: 'Ropa', category: 'hoodies', price: 172, image: '/images/dydalo-white-basics.jpg', label: 'DOUBLE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 38, name: 'Pigment Dyed Hoodie', type: 'Ropa', category: 'hoodies', price: 138, image: '/images/dydalo-tracksuit.jpg', label: 'PIGMENT', sizes: ['S','M','L','XL'], colors: [{ name: 'Verde', hex: '#3a4f2e' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 39, name: 'Panel Construct Hoodie', type: 'Ropa', category: 'hoodies', price: 165, image: '/images/dydalo-sneakers.jpg', label: 'PANEL', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 40, name: 'Half Zip Pullover', type: 'Ropa', category: 'hoodies', price: 155, image: '/images/dydalo-satin-set.jpg', label: 'HALF ZIP', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },

  // ── PANTALONES (10) ──
  { id: 41, name: 'Cargo Drop Pants', type: 'Ropa', category: 'pantalones', price: 132, image: '/images/dydalo-satin-set.jpg', label: 'CARGO', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 42, name: 'Tech Cargo Pants', type: 'Ropa', category: 'pantalones', price: 156, image: '/images/dydalo-sneakers.jpg', label: 'TECH', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 43, name: 'Parachute Pants', type: 'Ropa', category: 'pantalones', price: 148, image: '/images/dydalo-tracksuit.jpg', label: 'PARACHUTE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 44, name: 'Wide Leg Trousers', type: 'Ropa', category: 'pantalones', price: 138, image: '/images/dydalo-white-basics.jpg', label: 'WIDE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Crema', hex: '#f5f0e8' }] },
  { id: 45, name: 'Tapered Sweatpants', type: 'Ropa', category: 'pantalones', price: 112, image: '/images/dydalo-tracksuit.jpg', label: 'TAPERED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 46, name: 'Nylon Track Pants', type: 'Ropa', category: 'pantalones', price: 125, image: '/images/dydalo-satin-set.jpg', label: 'NYLON', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 47, name: 'Relaxed Fit Chinos', type: 'Ropa', category: 'pantalones', price: 118, image: '/images/dydalo-white-basics.jpg', label: 'CHINO', sizes: ['28','30','32','34','36'], colors: [{ name: 'Arena', hex: '#c4b9a6' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 48, name: 'Stacked Flare Pants', type: 'Ropa', category: 'pantalones', price: 168, image: '/images/dydalo-sneakers.jpg', label: 'FLARE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 49, name: 'Bonded Fleece Pants', type: 'Ropa', category: 'pantalones', price: 145, image: '/images/dydalo-tracksuit.jpg', label: 'BONDED', sizes: ['S','M','L','XL'], colors: [{ name: 'Gris', hex: '#6b6b6b' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 50, name: 'Utility Work Pants', type: 'Ropa', category: 'pantalones', price: 175, image: '/images/dydalo-sneakers.jpg', label: 'WORK', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Verde', hex: '#3a4f2e' }] },

  // ── JEANS (10) ──
  { id: 51, name: 'Raw Denim Straight', type: 'Ropa', category: 'jeans', price: 145, image: '/images/dydalo-sneakers.jpg', label: 'RAW', sizes: ['28','30','32','34','36'], colors: [{ name: 'Indigo', hex: '#1e3a5f' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 52, name: 'Destroyed Denim Slim', type: 'Ropa', category: 'jeans', price: 168, image: '/images/dydalo-white-basics.jpg', label: 'DESTROYED', sizes: ['28','30','32','34','36'], colors: [{ name: 'Azul Claro', hex: '#7b9cc2' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 53, name: 'Black Waxed Denim', type: 'Ropa', category: 'jeans', price: 185, image: '/images/dydalo-satin-set.jpg', label: 'WAXED', sizes: ['28','30','32','34','36'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 54, name: 'Baggy Fit Jeans', type: 'Ropa', category: 'jeans', price: 155, image: '/images/dydalo-tracksuit.jpg', label: 'BAGGY', sizes: ['28','30','32','34','36'], colors: [{ name: 'Indigo', hex: '#1e3a5f' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 55, name: 'Vintage Wash Bootcut', type: 'Ropa', category: 'jeans', price: 172, image: '/images/dydalo-sneakers.jpg', label: 'BOOTCUT', sizes: ['28','30','32','34','36'], colors: [{ name: 'Azul Medio', hex: '#4a6fa5' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 56, name: 'Paint Splatter Denim', type: 'Ropa', category: 'jeans', price: 195, image: '/images/dydalo-white-basics.jpg', label: 'SPLATTER', sizes: ['28','30','32','34','36'], colors: [{ name: 'Indigo', hex: '#1e3a5f' }] },
  { id: 57, name: 'Tapered Stretch Denim', type: 'Ropa', category: 'jeans', price: 138, image: '/images/dydalo-tracksuit.jpg', label: 'STRETCH', sizes: ['28','30','32','34','36'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Azul', hex: '#4a6fa5' }] },
  { id: 58, name: 'Selvedge Slim Jeans', type: 'Ropa', category: 'jeans', price: 210, image: '/images/dydalo-sneakers.jpg', label: 'SELVEDGE', sizes: ['28','30','32','34','36'], colors: [{ name: 'Indigo', hex: '#1e3a5f' }] },
  { id: 59, name: 'Pleated Front Jeans', type: 'Ropa', category: 'jeans', price: 178, image: '/images/dydalo-satin-set.jpg', label: 'PLEATED', sizes: ['28','30','32','34','36'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 60, name: 'Patched Repair Denim', type: 'Ropa', category: 'jeans', price: 198, image: '/images/dydalo-white-basics.jpg', label: 'PATCHED', sizes: ['28','30','32','34','36'], colors: [{ name: 'Azul Claro', hex: '#7b9cc2' }] },

  // ── CAMISAS (10) ──
  { id: 61, name: 'Linen Cuban Shirt', type: 'Ropa', category: 'camisas', price: 118, image: '/images/dydalo-white-basics.jpg', label: 'LINEN', sizes: ['S','M','L','XL'], colors: [{ name: 'Blanco', hex: '#f0ece4' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 62, name: 'Heavy Oxford Shirt', type: 'Ropa', category: 'camisas', price: 135, image: '/images/dydalo-satin-set.jpg', label: 'OXFORD', sizes: ['S','M','L','XL'], colors: [{ name: 'Blanco', hex: '#e5e5e5' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 63, name: 'Camp Collar Silk Shirt', type: 'Ropa', category: 'camisas', price: 165, image: '/images/dydalo-tracksuit.jpg', label: 'SILK', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 64, name: 'Denim Western Shirt', type: 'Ropa', category: 'camisas', price: 148, image: '/images/dydalo-sneakers.jpg', label: 'WESTERN', sizes: ['S','M','L','XL'], colors: [{ name: 'Indigo', hex: '#1e3a5f' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 65, name: 'Corduroy Overshirt', type: 'Ropa', category: 'camisas', price: 178, image: '/images/dydalo-white-basics.jpg', label: 'CORD', sizes: ['S','M','L','XL'], colors: [{ name: 'Arena', hex: '#c4b9a6' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 66, name: 'Poplin Stripe Shirt', type: 'Ropa', category: 'camisas', price: 125, image: '/images/dydalo-satin-set.jpg', label: 'STRIPE', sizes: ['S','M','L','XL'], colors: [{ name: 'Blanco', hex: '#e5e5e5' },{ name: 'Azul', hex: '#4a6fa5' }] },
  { id: 67, name: 'Flannel Check Shirt', type: 'Ropa', category: 'camisas', price: 142, image: '/images/dydalo-tracksuit.jpg', label: 'FLANNEL', sizes: ['S','M','L','XL'], colors: [{ name: 'Vino', hex: '#4a1525' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 68, name: 'Box Fit Tee Shirt', type: 'Ropa', category: 'camisas', price: 98, image: '/images/dydalo-white-basics.jpg', label: 'BOX FIT', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 69, name: 'Mesh Button-Up Shirt', type: 'Ropa', category: 'camisas', price: 132, image: '/images/dydalo-sneakers.jpg', label: 'MESH', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 70, name: 'Satin Bowling Shirt', type: 'Ropa', category: 'camisas', price: 158, image: '/images/dydalo-satin-set.jpg', label: 'SATIN', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },

  // ── TANKS (10) ──
  { id: 71, name: 'Ribbed Tank Top', type: 'Ropa', category: 'tanks', price: 64, image: '/images/dydalo-white-basics.jpg', label: 'RIBBED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 72, name: 'Muscle Fit Tank', type: 'Ropa', category: 'tanks', price: 72, image: '/images/dydalo-tracksuit.jpg', label: 'MUSCLE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 73, name: 'Drop Armhole Tank', type: 'Ropa', category: 'tanks', price: 58, image: '/images/dydalo-satin-set.jpg', label: 'DROP', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },
  { id: 74, name: 'Seamless Racer Tank', type: 'Ropa', category: 'tanks', price: 68, image: '/images/dydalo-sneakers.jpg', label: 'RACER', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 75, name: 'Cropped Tank Top', type: 'Ropa', category: 'tanks', price: 55, image: '/images/dydalo-white-basics.jpg', label: 'CROPPED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 76, name: 'Washed Jersey Tank', type: 'Ropa', category: 'tanks', price: 62, image: '/images/dydalo-tracksuit.jpg', label: 'WASHED', sizes: ['S','M','L','XL'], colors: [{ name: 'Gris', hex: '#6b6b6b' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 77, name: 'High Neck Tank', type: 'Ropa', category: 'tanks', price: 74, image: '/images/dydalo-satin-set.jpg', label: 'HIGH NECK', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 78, name: 'Mesh Training Tank', type: 'Ropa', category: 'tanks', price: 82, image: '/images/dydalo-sneakers.jpg', label: 'MESH', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e8e4dd' }] },
  { id: 79, name: 'Double Layer Tank', type: 'Ropa', category: 'tanks', price: 88, image: '/images/dydalo-white-basics.jpg', label: 'DOUBLE', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 80, name: 'Curved Hem Tank', type: 'Ropa', category: 'tanks', price: 59, image: '/images/dydalo-tracksuit.jpg', label: 'CURVED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },

  // ── BASICOS (10) ──
  { id: 81, name: 'Pure Form Set', type: 'Ropa', category: 'basicos', price: 138, image: '/images/dydalo-white-basics.jpg', label: 'ESSENTIAL', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 82, name: 'Essential Tee 3-Pack', type: 'Ropa', category: 'basicos', price: 98, image: '/images/dydalo-tracksuit.jpg', label: '3 PACK', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 83, name: 'Heavyweight Crewneck', type: 'Ropa', category: 'basicos', price: 112, image: '/images/dydalo-satin-set.jpg', label: 'HEAVY', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 84, name: 'Long Sleeve Essential', type: 'Ropa', category: 'basicos', price: 85, image: '/images/dydalo-white-basics.jpg', label: 'L/S', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 85, name: 'Relaxed Fit Tee', type: 'Ropa', category: 'basicos', price: 68, image: '/images/dydalo-tracksuit.jpg', label: 'RELAXED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 86, name: 'Organic Cotton Tee', type: 'Ropa', category: 'basicos', price: 74, image: '/images/dydalo-white-basics.jpg', label: 'ORGANIC', sizes: ['S','M','L','XL'], colors: [{ name: 'Blanco', hex: '#f0ece4' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 87, name: 'Drop Shoulder Tee', type: 'Ropa', category: 'basicos', price: 78, image: '/images/dydalo-sneakers.jpg', label: 'DROP', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 88, name: 'Pigment Dyed Tee', type: 'Ropa', category: 'basicos', price: 82, image: '/images/dydalo-tracksuit.jpg', label: 'PIGMENT', sizes: ['S','M','L','XL'], colors: [{ name: 'Verde', hex: '#3a4f2e' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 89, name: 'Garment Dyed Crew', type: 'Ropa', category: 'basicos', price: 95, image: '/images/dydalo-satin-set.jpg', label: 'DYED', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 90, name: 'Boxy Fit Tee', type: 'Ropa', category: 'basicos', price: 72, image: '/images/dydalo-white-basics.jpg', label: 'BOXY', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },

  // ── ACCESORIOS (10) ──
  { id: 91, name: 'Two Tone Caps', type: 'Accesorios', category: 'accesorios', price: 54, image: '/images/dydalo-caps.jpg', label: '2 PACK', sizes: ['Única'], colors: [{ name: 'Negro/Blanco', hex: '#2d2d2d' },{ name: 'Verde', hex: '#3a4f2e' }] },
  { id: 92, name: 'Cold Cuban Ice', type: 'Bling', category: 'accesorios', price: 249, image: '/images/dydalo-bling.jpg', label: 'LIMITED', sizes: ['Única'], colors: [{ name: 'Plata', hex: '#c0c0c0' },{ name: 'Oro', hex: '#d4a843' }] },
  { id: 93, name: 'Velvet Strap Cap', type: 'Accesorios', category: 'accesorios', price: 62, image: '/images/dydalo-caps.jpg', label: 'VELVET', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#2d2d2d' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 94, name: 'Cuban Link Chain', type: 'Bling', category: 'accesorios', price: 198, image: '/images/dydalo-bling.jpg', label: 'ICE', sizes: ['Única'], colors: [{ name: 'Plata', hex: '#c0c0c0' },{ name: 'Oro', hex: '#d4a843' }] },
  { id: 95, name: 'Logo Beanie Black', type: 'Accesorios', category: 'accesorios', price: 45, image: '/images/dydalo-caps.jpg', label: 'BEANIE', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 96, name: 'Crossbody Sling Bag', type: 'Accesorios', category: 'accesorios', price: 128, image: '/images/dydalo-bling.jpg', label: 'SLING', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 97, name: 'Leather Card Holder', type: 'Accesorios', category: 'accesorios', price: 78, image: '/images/dydalo-caps.jpg', label: 'LEATHER', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 98, name: 'Dog Tag Pendant', type: 'Bling', category: 'accesorios', price: 135, image: '/images/dydalo-bling.jpg', label: 'DOG TAG', sizes: ['Única'], colors: [{ name: 'Plata', hex: '#c0c0c0' }] },
  { id: 99, name: 'Knitted Scarf Black', type: 'Accesorios', category: 'accesorios', price: 88, image: '/images/dydalo-caps.jpg', label: 'SCARF', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 100, name: 'Rope Chain Silver', type: 'Bling', category: 'accesorios', price: 165, image: '/images/dydalo-bling.jpg', label: 'ROPE', sizes: ['Única'], colors: [{ name: 'Plata', hex: '#c0c0c0' }] },
];

export const catalogCategories = [
  { slug: 'polos', name: 'POLOS' },
  { slug: 'sets-dydalo', name: 'SETS DYDALO' },
  { slug: 'casacas', name: 'CASACAS' },
  { slug: 'hoodies', name: 'HOODIES' },
  { slug: 'pantalones', name: 'PANTALONES' },
  { slug: 'jeans', name: 'JEANS' },
  { slug: 'camisas', name: 'CAMISAS' },
  { slug: 'tanks', name: 'TANKS' },
  { slug: 'basicos', name: 'BÁSICOS' },
  { slug: 'accesorios', name: 'ACCESORIOS' },
] as const;
