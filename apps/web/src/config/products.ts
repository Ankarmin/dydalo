export type ProductType = "Ropa" | "Calzado" | "Accesorios" | "Bling";

export type ProductCategory = (typeof catalogCategories)[number]["slug"];

export type ProductSize = "S" | "M" | "L" | "XL" | "28" | "30" | "32" | "34" | "36" | "Única";

export type Product = {
  id: number;
  name: string;
  slug: string;
  type: ProductType;
  category: ProductCategory;
  price: number;
  image: string;
  sizes: ProductSize[];
  colors: { name: string; hex: string }[];
  description?: string;
};

export const products: Product[] = [

  { id: 1, name: 'Heavy Cotton Polo', slug: '1-heavy-cotton-polo', type: 'Ropa', category: 'polos', price: 89, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 2, name: 'Signature Stripe Polo', slug: '2-signature-stripe-polo', type: 'Ropa', category: 'polos', price: 104, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 3, name: 'Pique Slim Polo', slug: '3-pique-slim-polo', type: 'Ropa', category: 'polos', price: 79, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 4, name: 'Oversized Knit Polo', slug: '4-oversized-knit-polo', type: 'Ropa', category: 'polos', price: 118, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Crema', hex: '#f5f0e8' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 5, name: 'Ribbed Collar Polo', slug: '5-ribbed-collar-polo', type: 'Ropa', category: 'polos', price: 94, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 6, name: 'Tech Mesh Polo', slug: '6-tech-mesh-polo', type: 'Ropa', category: 'polos', price: 112, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 7, name: 'Linen Blend Polo', slug: '7-linen-blend-polo', type: 'Ropa', category: 'polos', price: 99, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Blanco', hex: '#f0ece4' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 8, name: 'Contrast Placket Polo', slug: '8-contrast-placket-polo', type: 'Ropa', category: 'polos', price: 108, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },
  { id: 9, name: 'Vintage Wash Polo', slug: '9-vintage-wash-polo', type: 'Ropa', category: 'polos', price: 86, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Verde', hex: '#3a4f2e' }] },
  { id: 10, name: 'Long Sleeve Polo', slug: '10-long-sleeve-polo', type: 'Ropa', category: 'polos', price: 115, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },


  { id: 21, name: 'Night Court High', slug: '21-night-court-high', type: 'Calzado', category: 'casacas', price: 176, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e8e4dd' }] },
  { id: 22, name: 'Tech Runner Jacket', slug: '22-tech-runner-jacket', type: 'Ropa', category: 'casacas', price: 198, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 23, name: 'Puffer Vest Black', slug: '23-puffer-vest-black', type: 'Ropa', category: 'casacas', price: 178, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 24, name: 'Bomber Nylon Jacket', slug: '24-bomber-nylon-jacket', type: 'Ropa', category: 'casacas', price: 210, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Verde', hex: '#3a4f2e' }] },
  { id: 25, name: 'Denim Trucker Jacket', slug: '25-denim-trucker-jacket', type: 'Ropa', category: 'casacas', price: 188, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Indigo', hex: '#1e3a5f' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 26, name: 'Cropped Leather Jacket', slug: '26-cropped-leather-jacket', type: 'Ropa', category: 'casacas', price: 320, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 27, name: 'Coach Jacket Black', slug: '27-coach-jacket-black', type: 'Ropa', category: 'casacas', price: 155, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },
  { id: 28, name: 'Sherpa Lined Jacket', slug: '28-sherpa-lined-jacket', type: 'Ropa', category: 'casacas', price: 245, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Crema', hex: '#f5f0e8' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 29, name: 'Windbreaker Anorak', slug: '29-windbreaker-anorak', type: 'Ropa', category: 'casacas', price: 168, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 30, name: 'Varsity Jacket Wool', slug: '30-varsity-jacket-wool', type: 'Ropa', category: 'casacas', price: 275, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },


  { id: 31, name: 'Shadow Oversized Hoodie', slug: '31-shadow-oversized-hoodie', type: 'Ropa', category: 'hoodies', price: 128, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 32, name: 'Archive Zip Hoodie', slug: '32-archive-zip-hoodie', type: 'Ropa', category: 'hoodies', price: 149, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },
  { id: 33, name: 'Heavyweight Pullover', slug: '33-heavyweight-pullover', type: 'Ropa', category: 'hoodies', price: 135, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Crema', hex: '#f5f0e8' }] },
  { id: 34, name: 'Cropped Box Hoodie', slug: '34-cropped-box-hoodie', type: 'Ropa', category: 'hoodies', price: 118, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 35, name: 'Distressed Logo Hoodie', slug: '35-distressed-logo-hoodie', type: 'Ropa', category: 'hoodies', price: 142, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 36, name: 'Reflective Print Hoodie', slug: '36-reflective-print-hoodie', type: 'Ropa', category: 'hoodies', price: 158, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 37, name: 'Double Layer Hoodie', slug: '37-double-layer-hoodie', type: 'Ropa', category: 'hoodies', price: 172, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 38, name: 'Pigment Dyed Hoodie', slug: '38-pigment-dyed-hoodie', type: 'Ropa', category: 'hoodies', price: 138, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Verde', hex: '#3a4f2e' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 39, name: 'Panel Construct Hoodie', slug: '39-panel-construct-hoodie', type: 'Ropa', category: 'hoodies', price: 165, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 40, name: 'Half Zip Pullover', slug: '40-half-zip-pullover', type: 'Ropa', category: 'hoodies', price: 155, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },


  { id: 41, name: 'Cargo Drop Pants', slug: '41-cargo-drop-pants', type: 'Ropa', category: 'pantalones', price: 132, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 42, name: 'Tech Cargo Pants', slug: '42-tech-cargo-pants', type: 'Ropa', category: 'pantalones', price: 156, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 43, name: 'Parachute Pants', slug: '43-parachute-pants', type: 'Ropa', category: 'pantalones', price: 148, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 44, name: 'Wide Leg Trousers', slug: '44-wide-leg-trousers', type: 'Ropa', category: 'pantalones', price: 138, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Crema', hex: '#f5f0e8' }] },
  { id: 45, name: 'Tapered Sweatpants', slug: '45-tapered-sweatpants', type: 'Ropa', category: 'pantalones', price: 112, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 46, name: 'Nylon Track Pants', slug: '46-nylon-track-pants', type: 'Ropa', category: 'pantalones', price: 125, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 47, name: 'Relaxed Fit Chinos', slug: '47-relaxed-fit-chinos', type: 'Ropa', category: 'pantalones', price: 118, image: '/images/dydalo-white-basics.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Arena', hex: '#c4b9a6' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 48, name: 'Stacked Flare Pants', slug: '48-stacked-flare-pants', type: 'Ropa', category: 'pantalones', price: 168, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 49, name: 'Bonded Fleece Pants', slug: '49-bonded-fleece-pants', type: 'Ropa', category: 'pantalones', price: 145, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Gris', hex: '#6b6b6b' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 50, name: 'Utility Work Pants', slug: '50-utility-work-pants', type: 'Ropa', category: 'pantalones', price: 175, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Verde', hex: '#3a4f2e' }] },


  { id: 51, name: 'Raw Denim Straight', slug: '51-raw-denim-straight', type: 'Ropa', category: 'jeans', price: 145, image: '/images/dydalo-sneakers.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Indigo', hex: '#1e3a5f' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 52, name: 'Destroyed Denim Slim', slug: '52-destroyed-denim-slim', type: 'Ropa', category: 'jeans', price: 168, image: '/images/dydalo-white-basics.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Azul Claro', hex: '#7b9cc2' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 53, name: 'Black Waxed Denim', slug: '53-black-waxed-denim', type: 'Ropa', category: 'jeans', price: 185, image: '/images/dydalo-satin-set.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 54, name: 'Baggy Fit Jeans', slug: '54-baggy-fit-jeans', type: 'Ropa', category: 'jeans', price: 155, image: '/images/dydalo-tracksuit.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Indigo', hex: '#1e3a5f' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 55, name: 'Vintage Wash Bootcut', slug: '55-vintage-wash-bootcut', type: 'Ropa', category: 'jeans', price: 172, image: '/images/dydalo-sneakers.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Azul Medio', hex: '#4a6fa5' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 56, name: 'Paint Splatter Denim', slug: '56-paint-splatter-denim', type: 'Ropa', category: 'jeans', price: 195, image: '/images/dydalo-white-basics.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Indigo', hex: '#1e3a5f' }] },
  { id: 57, name: 'Tapered Stretch Denim', slug: '57-tapered-stretch-denim', type: 'Ropa', category: 'jeans', price: 138, image: '/images/dydalo-tracksuit.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Azul', hex: '#4a6fa5' }] },
  { id: 58, name: 'Selvedge Slim Jeans', slug: '58-selvedge-slim-jeans', type: 'Ropa', category: 'jeans', price: 210, image: '/images/dydalo-sneakers.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Indigo', hex: '#1e3a5f' }] },
  { id: 59, name: 'Pleated Front Jeans', slug: '59-pleated-front-jeans', type: 'Ropa', category: 'jeans', price: 178, image: '/images/dydalo-satin-set.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 60, name: 'Patched Repair Denim', slug: '60-patched-repair-denim', type: 'Ropa', category: 'jeans', price: 198, image: '/images/dydalo-white-basics.jpg', sizes: ['28','30','32','34','36'], colors: [{ name: 'Azul Claro', hex: '#7b9cc2' }] },


  { id: 61, name: 'Linen Cuban Shirt', slug: '61-linen-cuban-shirt', type: 'Ropa', category: 'camisas', price: 118, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Blanco', hex: '#f0ece4' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 62, name: 'Heavy Oxford Shirt', slug: '62-heavy-oxford-shirt', type: 'Ropa', category: 'camisas', price: 135, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Blanco', hex: '#e5e5e5' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 63, name: 'Camp Collar Silk Shirt', slug: '63-camp-collar-silk-shirt', type: 'Ropa', category: 'camisas', price: 165, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 64, name: 'Denim Western Shirt', slug: '64-denim-western-shirt', type: 'Ropa', category: 'camisas', price: 148, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Indigo', hex: '#1e3a5f' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 65, name: 'Corduroy Overshirt', slug: '65-corduroy-overshirt', type: 'Ropa', category: 'camisas', price: 178, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Arena', hex: '#c4b9a6' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 66, name: 'Poplin Stripe Shirt', slug: '66-poplin-stripe-shirt', type: 'Ropa', category: 'camisas', price: 125, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Blanco', hex: '#e5e5e5' },{ name: 'Azul', hex: '#4a6fa5' }] },
  { id: 67, name: 'Flannel Check Shirt', slug: '67-flannel-check-shirt', type: 'Ropa', category: 'camisas', price: 142, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Vino', hex: '#4a1525' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 68, name: 'Box Fit Tee Shirt', slug: '68-box-fit-tee-shirt', type: 'Ropa', category: 'camisas', price: 98, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 69, name: 'Mesh Button-Up Shirt', slug: '69-mesh-button-up-shirt', type: 'Ropa', category: 'camisas', price: 132, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 70, name: 'Satin Bowling Shirt', slug: '70-satin-bowling-shirt', type: 'Ropa', category: 'camisas', price: 158, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },


  { id: 71, name: 'Ribbed Tank Top', slug: '71-ribbed-tank-top', type: 'Ropa', category: 'tanks', price: 64, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 72, name: 'Muscle Fit Tank', slug: '72-muscle-fit-tank', type: 'Ropa', category: 'tanks', price: 72, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#6b6b6b' }] },
  { id: 73, name: 'Drop Armhole Tank', slug: '73-drop-armhole-tank', type: 'Ropa', category: 'tanks', price: 58, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e5e5e5' }] },
  { id: 74, name: 'Seamless Racer Tank', slug: '74-seamless-racer-tank', type: 'Ropa', category: 'tanks', price: 68, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Gris', hex: '#5a5a5a' }] },
  { id: 75, name: 'Cropped Tank Top', slug: '75-cropped-tank-top', type: 'Ropa', category: 'tanks', price: 55, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },
  { id: 76, name: 'Washed Jersey Tank', slug: '76-washed-jersey-tank', type: 'Ropa', category: 'tanks', price: 62, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Gris', hex: '#6b6b6b' },{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 77, name: 'High Neck Tank', slug: '77-high-neck-tank', type: 'Ropa', category: 'tanks', price: 74, image: '/images/dydalo-satin-set.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 78, name: 'Mesh Training Tank', slug: '78-mesh-training-tank', type: 'Ropa', category: 'tanks', price: 82, image: '/images/dydalo-sneakers.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#e8e4dd' }] },
  { id: 79, name: 'Double Layer Tank', slug: '79-double-layer-tank', type: 'Ropa', category: 'tanks', price: 88, image: '/images/dydalo-white-basics.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Arena', hex: '#c4b9a6' }] },
  { id: 80, name: 'Curved Hem Tank', slug: '80-curved-hem-tank', type: 'Ropa', category: 'tanks', price: 59, image: '/images/dydalo-tracksuit.jpg', sizes: ['S','M','L','XL'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Blanco', hex: '#f0ece4' }] },


  { id: 91, name: 'Two Tone Caps', slug: '91-two-tone-caps', type: 'Accesorios', category: 'accesorios', price: 54, image: '/images/dydalo-caps.jpg', sizes: ['Única'], colors: [{ name: 'Negro/Blanco', hex: '#2d2d2d' },{ name: 'Verde', hex: '#3a4f2e' }] },
  { id: 92, name: 'Cold Cuban Ice', slug: '92-cold-cuban-ice', type: 'Bling', category: 'accesorios', price: 249, image: '/images/dydalo-bling.jpg', sizes: ['Única'], colors: [{ name: 'Plata', hex: '#c0c0c0' },{ name: 'Oro', hex: '#d4a843' }] },
  { id: 93, name: 'Velvet Strap Cap', slug: '93-velvet-strap-cap', type: 'Accesorios', category: 'accesorios', price: 62, image: '/images/dydalo-caps.jpg', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#2d2d2d' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 94, name: 'Cuban Link Chain', slug: '94-cuban-link-chain', type: 'Bling', category: 'accesorios', price: 198, image: '/images/dydalo-bling.jpg', sizes: ['Única'], colors: [{ name: 'Plata', hex: '#c0c0c0' },{ name: 'Oro', hex: '#d4a843' }] },
  { id: 95, name: 'Logo Beanie Black', slug: '95-logo-beanie-black', type: 'Accesorios', category: 'accesorios', price: 45, image: '/images/dydalo-caps.jpg', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 96, name: 'Crossbody Sling Bag', slug: '96-crossbody-sling-bag', type: 'Accesorios', category: 'accesorios', price: 128, image: '/images/dydalo-bling.jpg', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 97, name: 'Leather Card Holder', slug: '97-leather-card-holder', type: 'Accesorios', category: 'accesorios', price: 78, image: '/images/dydalo-caps.jpg', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#1a1a1a' },{ name: 'Vino', hex: '#4a1525' }] },
  { id: 98, name: 'Dog Tag Pendant', slug: '98-dog-tag-pendant', type: 'Bling', category: 'accesorios', price: 135, image: '/images/dydalo-bling.jpg', sizes: ['Única'], colors: [{ name: 'Plata', hex: '#c0c0c0' }] },
  { id: 99, name: 'Knitted Scarf Black', slug: '99-knitted-scarf-black', type: 'Accesorios', category: 'accesorios', price: 88, image: '/images/dydalo-caps.jpg', sizes: ['Única'], colors: [{ name: 'Negro', hex: '#1a1a1a' }] },
  { id: 100, name: 'Rope Chain Silver', slug: '100-rope-chain-silver', type: 'Bling', category: 'accesorios', price: 165, image: '/images/dydalo-bling.jpg', sizes: ['Única'], colors: [{ name: 'Plata', hex: '#c0c0c0' }] },
];

export const catalogCategories = [
  { slug: 'polos', name: 'POLOS' },
  { slug: 'casacas', name: 'CASACAS' },
  { slug: 'hoodies', name: 'HOODIES' },
  { slug: 'pantalones', name: 'PANTALONES' },
  { slug: 'jeans', name: 'JEANS' },
  { slug: 'camisas', name: 'CAMISAS' },
  { slug: 'tanks', name: 'TANKS' },
  { slug: 'accesorios', name: 'ACCESORIOS' },
] as const;

export function getProductCount(slug: string): number {
  return products.filter((p) => p.category === slug).length;
}
