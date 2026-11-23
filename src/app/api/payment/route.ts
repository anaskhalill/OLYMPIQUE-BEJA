import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { extractBearerToken, verifyIdToken } from "@/lib/admin/verify-id-token";

/**
 * Server-side Stripe PaymentIntent creation for a specific persisted order.
 *
 * Security guarantees:
 * - The Firebase ID token is verified server-side; the caller's uid comes from
 *   the token, never from the body.
 * - The client does NOT choose the Stripe amount. Only the server-persisted
 *   order total (recomputed from the authoritative catalog in POST /api/orders)
 *   is used.
 * - The order is loaded from Firestore (authoritative) and verified to belong
 *   to the authenticated user before any PaymentIntent is created.
 * - A single order has AT MOST one PaymentIntent. Concurrent/repeated creation
 *   requests for the same order resolve to the same PaymentIntent via:
 *     (a) a deterministic Stripe idempotency key derived from the order id, and
 *     (b) an atomic Firestore transaction that claims/records the winning
 *         PaymentIntent id, so two different ids can never both be stored, and
 *         a losing creator always reuses the stored PaymentIntent.
 * - Once a PaymentIntent/order relationship exists the amount or currency cannot
 *   change: existing intents are reused with amount/currency verification.
 * - The payment status is NEVER set to paid here. Only a verified Stripe
 *   webhook (see /api/webhooks/stripe) may transition the order to paid.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

// Order totals are persisted as integer "000 DT" units (e.g. 110 = 110,000 DT).
// Stripe amounts are in the smallest currency unit; TND uses 3 decimals (mills).
const ORDER_TOTAL_SCALE = 1000;
const CURRENCY = "tnd";

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function notConfigured(): NextResponse {
  return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

function conflict(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 409 });
}

/**
 * Atomically record `intentId` on the order, or return whichever PaymentIntent
 * id is already stored. Two concurrent creators for the same order cannot both
 * succeed in writing a different id: the transaction guarantees exactly one
 * winner, and the loser reuses the stored id.
 */
async function claimPaymentIntent(
  db: Firestore,
  orderId: string,
  intentId: string
): Promise<string> {
  const ref = db.collection("orders").doc(orderId);
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.exists
      ? (snap.data() as Record<string, unknown>)
      : ({} as Record<string, unknown>);
    const current =
      typeof data.paymentIntentId === "string" && data.paymentIntentId
        ? data.paymentIntentId
        : null;
    if (current) return current;
    transaction.update(ref, { paymentIntentId: intentId });
    return intentId;
  });
}

export async function POST(req: NextRequest) {
  if (
    !process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY.startsWith("sk_test_your")
  ) {
    return notConfigured();
  }

  const db = getAdminDb();
  if (!db) return notConfigured();

  // Server must verify the Firebase ID token.
  const authorization = req.headers.get("authorization");
  const session = await verifyIdToken(extractBearerToken(authorization));
  if (!session?.uid) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { orderId } = (body ?? {}) as Record<string, unknown>;
  if (typeof orderId !== "string" || !orderId.trim() || orderId.trim().length > 100) {
    return badRequest("Invalid order id");
  }
  const normalizedOrderId = orderId.trim();

  // Load the authoritative order from Firestore.
  const orderRef = db.collection("orders").doc(normalizedOrderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = orderSnap.data() as Record<string, unknown>;

  // Do not allow a user to pay another user's order.
  if (order.userId !== session.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.paymentMethod !== "card") {
    return badRequest("Order is not a card order");
  }

  if (order.paymentStatus === "paid") {
    return badRequest("Order already paid");
  }

  const persistedTotal = Number(order.total);
  if (!Number.isFinite(persistedTotal) || persistedTotal <= 0) {
    return badRequest("Invalid order total");
  }
  const amount = Math.round(persistedTotal * ORDER_TOTAL_SCALE);
  if (amount < 1) {
    return badRequest("Order total out of range");
  }

  try {
    const storedId =
      typeof order.paymentIntentId === "string" && order.paymentIntentId
        ? order.paymentIntentId
        : null;

    let paymentIntent: Stripe.PaymentIntent;

    if (storedId) {
      // Fast path: a PaymentIntent already exists for this order; reuse it.
      paymentIntent = await stripe.paymentIntents.retrieve(storedId);
    } else {
      // Deterministic idempotency key derived from the order id. Concurrent or
      // repeated creation attempts for the same order resolve to a single
      // PaymentIntent at the Stripe layer, so we can never mint two of them.
      const idempotencyKey = `ob_pi_${normalizedOrderId}`;
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency: CURRENCY,
          metadata: {
            // orderId is set by the server, not the client; the webhook uses it
            // to find and verify the order.
            orderId: normalizedOrderId,
          },
        },
        { idempotencyKey }
      );

      // Atomic claim: record the winning PaymentIntent id on the order, or learn
      // which id another concurrent request already stored.
      const winningId = await claimPaymentIntent(db, normalizedOrderId, paymentIntent.id);
      if (winningId !== paymentIntent.id) {
        // Another request's PaymentIntent won; reuse it so the order keeps a
        // single, stable PaymentIntent (amount/currency cannot change).
        paymentIntent = await stripe.paymentIntents.retrieve(winningId);
      }
    }

    // Do not allow amount or currency to differ from the persisted server order.
    if ((paymentIntent.currency ?? "").toLowerCase() !== CURRENCY) {
      return conflict("Payment currency mismatch");
    }
    if (paymentIntent.amount !== amount) {
      return conflict("Payment amount mismatch");
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: normalizedOrderId,
      amount: paymentIntent.amount,
    });
  } catch (error: unknown) {
    console.error(
      "Payment Intent Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
