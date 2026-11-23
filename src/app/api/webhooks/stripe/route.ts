import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/admin/firebase-admin";

/**
 * Authoritative Stripe webhook endpoint.
 *
 * Only a verified Stripe webhook may transition an order to paid. The client is
 * never trusted: a "successful" client-side confirmCardPayment response does NOT
 * mark anything paid — that can only happen here, after:
 *  - the Stripe webhook signature is verified;
 *  - the event type is exactly payment_intent.succeeded;
 *  - the PaymentIntent is confirmed to belong to the expected order
 *    (paymentIntent.id === order.paymentIntentId and
 *     paymentIntent.metadata.orderId === order document id);
 *  - the PaymentIntent currency is tnd;
 *  - the PaymentIntent amount exactly equals the server-persisted order total;
 *  - processing is idempotent (the transition happens in a transaction and
 *    repeated events cannot award the same payment twice).
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const ORDER_TOTAL_SCALE = 1000;
const CURRENCY = "tnd";

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  orderId: string
) {
  const db = getAdminDb();
  if (!db) return;

  // The PaymentIntent must point at the order we are about to update.
  if (!paymentIntent.metadata || paymentIntent.metadata.orderId !== orderId) {
    console.error(
      "[stripe-webhook] metadata.orderId does not match order:",
      paymentIntent.id,
      paymentIntent.metadata?.orderId
    );
    return;
  }

  // The PaymentIntent currency must be tnd.
  if ((paymentIntent.currency ?? "").toLowerCase() !== CURRENCY) {
    console.error(
      "[stripe-webhook] Non-tnd currency:",
      paymentIntent.id,
      paymentIntent.currency
    );
    return;
  }

  // Run the idempotent, authoritative transition in a transaction so concurrent
  // or repeated deliveries cannot process the same payment twice.
  await db.runTransaction(async (transaction) => {
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) {
      console.error("[stripe-webhook] Order not found:", orderId);
      return;
    }

    const order = orderSnap.data() as Record<string, unknown>;

    // The PaymentIntent must be the one stored on the order.
    if (order.paymentIntentId !== paymentIntent.id) {
      console.error(
        "[stripe-webhook] PaymentIntent does not match order:",
        orderId,
        paymentIntent.id
      );
      return;
    }

    // The PaymentIntent amount must exactly equal the server-persisted order total.
    const expectedAmount = Math.round(Number(order.total) * ORDER_TOTAL_SCALE);
    if (!Number.isFinite(expectedAmount) || paymentIntent.amount !== expectedAmount) {
      console.error(
        "[stripe-webhook] Amount mismatch for order:",
        orderId,
        paymentIntent.amount,
        expectedAmount
      );
      return;
    }

    // Idempotency: if already paid, do nothing.
    if (order.paymentStatus === "paid") {
      console.warn("[stripe-webhook] Order already paid, ignoring duplicate:", orderId);
      return;
    }

    transaction.update(orderRef, {
      paymentStatus: "paid",
      status: "processing",
      paidAt: FieldValue.serverTimestamp(),
      paymentIntentId: paymentIntent.id,
    });
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  // Read the raw body; signature verification must use the exact bytes received.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: unknown) {
    console.error(
      "[stripe-webhook] Signature verification failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // Only payment_intent.succeeded may transition an order to paid.
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        console.error(
          "[stripe-webhook] PaymentIntent has no orderId:",
          paymentIntent.id
        );
        return NextResponse.json({ received: true });
      }
      await handlePaymentIntentSucceeded(paymentIntent, orderId);
    }
  } catch (error: unknown) {
    console.error(
      "[stripe-webhook] Processing failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
