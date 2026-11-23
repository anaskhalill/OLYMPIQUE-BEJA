import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { extractBearerToken, verifyIdToken } from "@/lib/admin/verify-id-token";
import {
  computeOrderTotals,
  findProduct,
  pointsCostForOrder,
  type OrderLineInput,
  type Totals,
} from "@/lib/shop/catalog";
import {
  InsufficientPointsError,
  redeemPointsForOrder,
} from "@/lib/admin/points";

/**
 * Server-side checkout/order creation.
 *
 * Security guarantees:
 * - The client is NEVER trusted for prices, totals, discounts, shipping, earned
 *   points, points cost, payment status or order IDs.
 * - The Firebase ID token is verified server-side; the order's userId comes from
 *   the token, not from the request body.
 * - Prices/totals are recomputed from the server-authoritative catalog.
 * - Product ids, sizes, quantities and availability are validated server-side.
 * - The order ID is generated on the server.
 * - Orders are persisted to Firestore.
 * - Payment is NOT marked paid on the client's word. COD is created as
 *   pending/unpaid. Card is created as pending/unpaid (Stripe verification is a
 *   dedicated task).
 * - `points` payment: the server derives the points cost from the order total,
 *   verifies ownership (uid from token), atomically checks sufficient balance and
 *   deducts points, and is idempotent per `checkoutToken` (no double-spend on
 *   retries/concurrent requests).
 * - `cod`/`card` orders are created unpaid with no points awarded.
 */

const ALLOWED_PAYMENT_METHODS = new Set(["cod", "card", "points"]);

// Cap on distinct cart line items, defends against oversized / malformed carts
// (each line is validated and iterated server-side).
const MAX_LINE_ITEMS = 50;

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function notConfigured(): NextResponse {
  return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

function generateOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `OB-${date}-${rand}`;
}

interface ParsedCustomer {
  name: string;
  phone: string;
  city: string;
  address: string;
}

export async function POST(req: NextRequest) {
  const db = getAdminDb();
  if (!db) return notConfigured();

  const authorization = req.headers.get("authorization");
  const token = extractBearerToken(authorization);
  const session = await verifyIdToken(token);
  if (!session?.uid) return unauthorized();

  const contentType = req.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { items, customer, promoCode, paymentMethod } = (body ?? {}) as Record<string, unknown>;

  if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod as string)) {
    return badRequest("Invalid payment method");
  }

  const cust = (customer ?? {}) as Record<string, unknown>;
  const stripControl = (s: string) => s.replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g, "");
  const parsedCustomer: ParsedCustomer = {
    name: typeof cust.name === "string" ? stripControl(cust.name.trim()) : "",
    phone: typeof cust.phone === "string" ? stripControl(cust.phone.trim()) : "",
    city: typeof cust.city === "string" ? stripControl(cust.city.trim()) : "Tunis",
    address: typeof cust.address === "string" ? stripControl(cust.address.trim()) : "",
  };
  if (!parsedCustomer.name || !parsedCustomer.phone || !parsedCustomer.address) {
    return badRequest("Missing customer information");
  }
  if (parsedCustomer.name.length > 120 || parsedCustomer.address.length > 300) {
    return badRequest("Customer information too long");
  }
  if (parsedCustomer.phone.length > 30 || parsedCustomer.city.length > 60) {
    return badRequest("Customer contact information too long");
  }

  const lines: OrderLineInput[] = (Array.isArray(items) ? items : []).map((raw) => {
    const it = (raw ?? {}) as Record<string, unknown>;
    return {
      productId: Number(it.productId),
      size: typeof it.size === "string" ? it.size : "",
      qty: Number(it.qty),
    };
  });

  if (lines.length > MAX_LINE_ITEMS) {
    return badRequest("Too many cart line items");
  }

  if (lines.length === 0 || lines.length > MAX_LINE_ITEMS) {
    return badRequest("Invalid cart");
  }

  let totals: Totals;
  try {
    totals = computeOrderTotals(lines, typeof promoCode === "string" ? promoCode : null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid cart";
    return badRequest(message);
  }

  const orderItems = lines.map((line) => {
    const product = findProduct(line.productId)!;
    return {
      productId: product.id,
      name: product.name,
      size: line.size,
      qty: line.qty,
      unitPrice: product.price,
      lineTotal: product.price * line.qty,
    };
  });

  const payMethod = paymentMethod as string;
  const isPoints = payMethod === "points";

  const orderId = generateOrderId();
  const createdAt = FieldValue.serverTimestamp();

  const orderDoc = {
    orderId,
    userId: session.uid,
    customer: parsedCustomer,
    items: orderItems,
    subtotal: totals.subtotal,
    discountPercent: totals.discountPercent,
    discountAmount: totals.discountAmount,
    shippingFee: totals.shippingFee,
    total: totals.total,
    promoCode: typeof promoCode === "string" && promoCode ? promoCode.trim().toUpperCase() : null,
    paymentMethod: payMethod,
    status: "pending",
    createdAt,
  };

  if (isPoints) {
    // The server computes the points cost from the server order total. The client
    // cannot submit its own cost. Ownership is the verified uid.
    const pointsCost = pointsCostForOrder(totals.total);
    const rawBody = (body ?? {}) as Record<string, unknown>;
    const checkoutToken =
      typeof rawBody.checkoutToken === "string" && rawBody.checkoutToken
        ? rawBody.checkoutToken.trim()
        : "";

    if (!checkoutToken) {
      return badRequest("Missing checkout idempotency token");
    }
    if (checkoutToken.length > 200) {
      return badRequest("Invalid checkout token");
    }

    try {
      const redeemed = await redeemPointsForOrder(
        db,
        session.uid,
        checkoutToken,
        orderId,
        pointsCost,
        { ...orderDoc, pointsCost, paymentStatus: "paid" }
      );

      let savedOrderId = redeemed.orderId;
      let savedOrder = orderDoc;
      if (redeemed.reused) {
        // A prior request already processed this checkout token: return the same
        // order without a second deduction.
        const snap = await db.collection("orders").doc(savedOrderId).get();
        if (snap.exists) {
          savedOrder = { ...orderDoc, ...(snap.data() as object) };
          savedOrderId = savedOrder.orderId ?? savedOrderId;
        }
      }

      return NextResponse.json(
        {
          orderId: savedOrderId,
          total: savedOrder.total,
          subtotal: savedOrder.subtotal,
          discount: savedOrder.discountAmount,
          shipping: savedOrder.shippingFee,
          paymentMethod: payMethod,
          paymentStatus: "paid",
          status: "pending",
          pointsCost,
          points: 0,
          items: savedOrder.items ?? orderItems,
        },
        { status: redeemed.reused ? 200 : 201 }
      );
    } catch (err) {
      if (err instanceof InsufficientPointsError) {
        return NextResponse.json(
          { error: "Insufficient points to complete this order" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Order could not be saved" },
        { status: 500 }
      );
    }
  }

  // COD and card orders are created unpaid.
  const paymentStatus = "unpaid";
  const fullOrderDoc = { ...orderDoc, paymentStatus };

  try {
    await db.collection("orders").doc(orderId).set(fullOrderDoc);
  } catch {
    return NextResponse.json({ error: "Order could not be saved" }, { status: 500 });
  }

  return NextResponse.json(
    {
      orderId,
      total: totals.total,
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      shipping: totals.shippingFee,
      paymentMethod: payMethod,
      paymentStatus,
      status: "pending",
      items: orderItems,
    },
    { status: 201 }
  );
}
