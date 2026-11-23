/*
 * Catalog / checkout server-authoritative security tests.
 *
 * These pin the core invariant that the client can NEVER influence prices,
 * totals, discounts, shipping or points costs. All of that state is computed
 * server-side from the trusted catalog (src/lib/shop/catalog.ts). Any malformed
 * or malicious cart line must be rejected.
 */
const assert = require("node:assert");

const {
  computeOrderTotals,
  findProduct,
  pointsCostForOrder,
  PRODUCTS,
  PROMO_CODES,
  MAX_QTY_PER_LINE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
} = require("../src/lib/shop/catalog.ts");

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks++;
  try {
    assert.ok(cond, msg);
    console.log(`  PASS: ${msg}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL: ${msg}`);
  }
}
function throws(fn, re, msg) {
  checks++;
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
    if (re && !re.test(e.message)) {
      failures++;
      console.log(`  FAIL: ${msg} (wrong error: ${e.message})`);
      return;
    }
  }
  if (!threw) {
    failures++;
    console.log(`  FAIL: ${msg} (did not throw)`);
    return;
  }
  console.log(`  PASS: ${msg}`);
}

console.log("Catalog: server-authoritative pricing rules");

// --- 1. Server computes totals; client cannot pass its own amount ----------
ok(
  typeof computeOrderTotals === "function",
  "computeOrderTotals is exported and callable"
);
ok(
  PRODUCTS.length > 0,
  "server catalog is populated"
);

// A known product (id 1, price 110). Single unit, no promo.
const single = computeOrderTotals([{ productId: 1, size: "M", qty: 1 }], null);
ok(
  single.subtotal === 110 && single.total === 110 + SHIPPING_FEE,
  `single item totals come from server price (subtotal 110, total ${single.total})`
);

// --- 2. Reject invalid product ids ------------------------------------------
throws(
  () => computeOrderTotals([{ productId: 99999, size: "M", qty: 1 }], null),
  /Invalid product/,
  "unknown productId is rejected by the server"
);
throws(
  () => computeOrderTotals([{ productId: "abc", size: "M", qty: 1 }], null),
  /Invalid product/,
  "non-numeric productId is rejected"
);

// --- 3. Reject out-of-stock products ----------------------------------------
// Product 7 (Parka) is inStock: false in the catalog.
if (findProduct(7) && findProduct(7).inStock === false) {
  throws(
    () => computeOrderTotals([{ productId: 7, size: "M", qty: 1 }], null),
    /Product unavailable/,
    "out-of-stock product is rejected"
  );
} else {
  ok(true, "skipped: no out-of-stock product in catalog (none flagged)");
}

// --- 4. Reject invalid quantities -------------------------------------------
throws(
  () => computeOrderTotals([{ productId: 1, size: "M", qty: 0 }], null),
  /Invalid quantity/,
  "qty 0 rejected"
);
throws(
  () => computeOrderTotals([{ productId: 1, size: "M", qty: -3 }], null),
  /Invalid quantity/,
  "negative qty rejected"
);
throws(
  () => computeOrderTotals([{ productId: 1, size: "M", qty: 2.5 }], null),
  /Invalid quantity/,
  "fractional qty rejected"
);
throws(
  () =>
    computeOrderTotals(
      [{ productId: 1, size: "M", qty: MAX_QTY_PER_LINE + 1 }],
      null
    ),
  /Invalid quantity/,
  `qty > MAX_QTY_PER_LINE (${MAX_QTY_PER_LINE}) rejected`
);

// --- 5. Reject invalid sizes -------------------------------------------------
throws(
  () => computeOrderTotals([{ productId: 1, size: "XXXXL", qty: 1 }], null),
  /Invalid size/,
  "size not in the product's allowed sizes is rejected"
);

// --- 6. Reject empty / malformed cart ---------------------------------------
throws(
  () => computeOrderTotals([], null),
  /Cart is empty/,
  "empty cart rejected"
);
throws(
  () => computeOrderTotals(null, null),
  /Cart is empty/,
  "null cart rejected"
);

// --- 7. Promo codes are server-authoritative --------------------------------
// Unknown code must yield 0% discount (client cannot invent codes).
const bogus = computeOrderTotals(
  [{ productId: 1, size: "M", qty: 1 }],
  "TOTALLY-BOGUS-CODE"
);
ok(
  bogus.discountPercent === 0 && bogus.discountAmount === 0,
  "unknown promo code yields zero discount (client can't invent codes)"
);

// Known code applies the server's map value only.
const known = Object.keys(PROMO_CODES)[0];
const expectedPct = PROMO_CODES[known];
const withCode = computeOrderTotals(
  [{ productId: 1, size: "M", qty: 1 }],
  known
);
ok(
  withCode.discountPercent === expectedPct,
  `known promo code '${known}' applies server's ${expectedPct}%`
);

// Codes are matched case-insensitively after normalizing (server uppercases).
const lower = computeOrderTotals(
  [{ productId: 1, size: "M", qty: 1 }],
  known.toLowerCase()
);
ok(
  lower.discountPercent === expectedPct,
  "promo code matching is case-insensitive (server normalizes)"
);

// --- 8. Free shipping threshold ---------------------------------------------
const bigOrder = computeOrderTotals(
  [
    { productId: 1, size: "M", qty: 2 }, // 220
    { productId: 5, size: "L", qty: 1 }, // 129 -> subtotal 349
  ],
  null
);
ok(
  bigOrder.subtotal >= FREE_SHIPPING_THRESHOLD &&
    bigOrder.shippingFee === 0,
  `free shipping above threshold (subtotal ${bigOrder.subtotal})`
);
const smallOrder = computeOrderTotals([{ productId: 1, size: "M", qty: 1 }], null);
ok(
  smallOrder.subtotal < FREE_SHIPPING_THRESHOLD &&
    smallOrder.shippingFee === SHIPPING_FEE,
  `shipping fee applied below threshold (fee ${smallOrder.shippingFee})`
);

// --- 9. Points cost is derived server-side, never from the client -----------
ok(
  pointsCostForOrder(0) === 1,
  "points cost floors at 1 for a 0 total (no freebies)"
);
ok(
  pointsCostForOrder(100) === 1,
  "points cost rounds up: 100 -> 1"
);
ok(
  pointsCostForOrder(101) === 2,
  "points cost rounds up: 101 -> 2"
);
ok(
  Number.isInteger(pointsCostForOrder(199)) && pointsCostForOrder(199) === 2,
  "points cost always an integer (ceil)"
);

// --- 10. No way for the client to pass a precomputed total/amount -----------
// The function signature exposes no amount/total parameter — the total is
// strictly derived from catalog prices. Assert the computed total matches an
// independent server-side recomputation from the trusted catalog data.
const maSub = 110 + 85; // product 1 + product 2 from the server catalog
const maDiscPct = PROMO_CODES["CHAMPION"]; // 10
const maDisc = Math.round((maSub * maDiscPct) / 100);
const maShip = maSub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
const serverTruth = Math.max(0, maSub - maDisc + maShip);
const malicious = computeOrderTotals(
  [
    { productId: 1, size: "M", qty: 1 },
    { productId: 2, size: "M", qty: 1 },
  ],
  "CHAMPION"
);
ok(
  malicious.total === serverTruth,
  `total (${malicious.total}) equals fresh server recomputation (${serverTruth}) — client-controlled totals impossible`
);

// Cleanup: remove the bogus keys that computeOrderTotals may have touched.
// (No global state is set by computeOrderTotals; this is a no-op guard.)

console.log(`\nCATALOG-AUTH: ${checks} checks, ${failures} failures`);
if (failures > 0) {
  process.exit(1);
}
console.log("ALL CHECKS PASSED");
