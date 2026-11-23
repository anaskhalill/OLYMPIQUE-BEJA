/**
 * Server-authoritative shop catalog.
 *
 * This module is the single trusted source used by the server-side checkout
 * (POST /api/orders) to compute prices, discounts, shipping and totals. The
 * client is NEVER trusted for prices, totals, discounts or shipping.
 *
 * Keep in sync with the display catalog rendered by the client ShopSection.
 * Prices are in integer "000 DT" units (e.g. 110 = 110,000 DT).
 */

export interface CatalogProduct {
  id: number;
  name: string;
  price: number;
  sizes: string[];
  inStock: boolean;
}

export const PRODUCTS: CatalogProduct[] = [
  { id: 1, name: "Maillot Officiel Adulte 2024/2025 (Home)", price: 110, sizes: ["S", "M", "L", "XL", "XXL"], inStock: true },
  { id: 2, name: "Sweat Lion 25/26", price: 85, sizes: ["S", "M", "L", "XL", "XXL"], inStock: true },
  { id: 3, name: "Maillot Officiel Basket Ball 2024-2025", price: 75, sizes: ["S", "M", "L", "XL"], inStock: true },
  { id: 4, name: "Maillot Officiel Adulte 2024/2025 (Home Promo)", price: 50, sizes: ["S", "M", "L", "XL", "XXL"], inStock: true },
  { id: 5, name: "BOMBERS CROCO 25/26", price: 129, sizes: ["S", "M", "L", "XL", "XXL"], inStock: true },
  { id: 6, name: "POLO SANGLE CERCLE", price: 80, sizes: ["S", "M", "L", "XL"], inStock: true },
  { id: 7, name: "Parka Bicolore 25/26", price: 199, sizes: ["M", "L", "XL"], inStock: false },
  { id: 8, name: "Survêtement Lion 25/26 (Rouge/Gris)", price: 179, sizes: ["S", "M", "L", "XL", "XXL"], inStock: true },
  { id: 9, name: "DEMI ZIP LION 25/26 (Rouge / Marine)", price: 155, sizes: ["S", "M", "L", "XL"], inStock: true },
  { id: 10, name: "Capuche Lion Gris 25/26", price: 90, sizes: ["S", "M", "L", "XL", "XXL"], inStock: true },
  { id: 11, name: "Gilet OB 25/26", price: 109, sizes: ["S", "M", "L", "XL"], inStock: true },
  { id: 12, name: "Maillot Officiel 25/26 (KIDS)", price: 95, sizes: ["4ans", "6ans", "8ans", "10ans", "12ans"], inStock: true },
  { id: 13, name: "Maillot Officiel Third Jersey 25/26", price: 110, sizes: ["S", "M", "L", "XL", "XXL"], inStock: true },
  { id: 14, name: "Maillot Training Lion 25/26", price: 75, sizes: ["S", "M", "L", "XL"], inStock: true },
  { id: 15, name: "Demi Zip Authentique 25/26", price: 109, sizes: ["S", "M", "L", "XL", "XXL"], inStock: true },
  // Tickets (buyable with points or cash)
  { id: 16, name: "Billet Match Domicile - Tribune Nord", price: 30, sizes: ["Standard"], inStock: true },
  { id: 17, name: "Billet Match Domicile - Tribune Sud", price: 30, sizes: ["Standard"], inStock: true },
  { id: 18, name: "Billet Match Domicile - Tribune Centrale", price: 50, sizes: ["Standard"], inStock: true },
  { id: 19, name: "Billet Match Domicile - VIP", price: 120, sizes: ["Standard"], inStock: true },
  { id: 20, name: "Abonnement Saison 2026/27 - Tribune Nord", price: 250, sizes: ["Standard"], inStock: true },
];

/** Normalized promo codes -> discount percent. Server-authoritative only. */
export const PROMO_CODES: Record<string, number> = {
  OB1920: 15,
  LIFRIQI: 15,
  BABJEDID: 15,
  CHAMPION: 10,
};

export const FREE_SHIPPING_THRESHOLD = 150; // subtotal units
export const SHIPPING_FEE = 7; // units
export const MAX_QTY_PER_LINE = 10;

export function findProduct(id: number): CatalogProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/**
 * Server-authoritative points rules. The client NEVER supplies a points cost or
 * an earned-points value; both are derived from the server-calculated order
 * total only.
 *
 * `total` is in integer "000 DT" units. The points cost rounds up, and the
 * earned points round down, so spending never yields a profit purely from the
 * conversion.
 */
export function pointsCostForOrder(total: number): number {
  return Math.max(1, Math.ceil(total / 100));
}

export interface OrderLineInput {
  productId: number;
  size: string;
  qty: number;
}

export interface Totals {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
}

/**
 * Compute the authoritative total from server-side catalog data.
 * Throws an Error with a safe message if any line is invalid.
 */
export function computeOrderTotals(
  lines: OrderLineInput[],
  promoCode: string | null
): Totals {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Cart is empty");
  }

  let subtotal = 0;
  for (const line of lines) {
    const id = line.productId;
    const product = findProduct(id);
    if (!product) throw new Error("Invalid product");
    if (!product.inStock) throw new Error("Product unavailable");
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > MAX_QTY_PER_LINE) {
      throw new Error("Invalid quantity");
    }
    if (!product.sizes.includes(line.size)) throw new Error("Invalid size");
    subtotal += product.price * line.qty;
  }

  const code = typeof promoCode === "string" && promoCode ? promoCode.trim().toUpperCase() : null;
  const discountPercent = code && PROMO_CODES[code] ? PROMO_CODES[code] : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  return { subtotal, discountPercent, discountAmount, shippingFee, total };
}
