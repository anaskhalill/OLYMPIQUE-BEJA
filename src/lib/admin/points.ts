import { Firestore, FieldValue } from "firebase-admin/firestore";

/**
 * Server-only, server-authoritative points operations.
 *
 * The client NEVER decides how many points are added or removed. Every mutation
 * is triggered by an authorized, purpose-specific server action and computed
 * from server state. `users/{uid}.points` is the single source of truth.
 *
 * All multi-write operations run inside a single Firestore transaction so they
 * are atomic against concurrent requests and retries.
 */

export class InsufficientPointsError extends Error {
  constructor() {
    super("Insufficient points");
    this.name = "InsufficientPointsError";
  }
}

export function pointsBalance(user: { points?: unknown } | undefined): number {
  if (user && typeof user.points === "number") return user.points;
  return 0;
}

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function userRef(db: Firestore, uid: string) {
  return db.collection("users").doc(uid);
}

export async function awardTriviaPoints(
  db: Firestore,
  uid: string,
  correct: boolean
): Promise<{ alreadyPlayed: boolean; awarded: number; points: number; correct: boolean }> {
  const day = todayKey();
  const triviaRef = userRef(db, uid).collection("triviaDaily").doc(day);
  const balanceRef = userRef(db, uid);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(triviaRef);
    if (existing.exists) {
      const userSnap = await tx.get(balanceRef);
      return {
        alreadyPlayed: true,
        awarded: 0,
        points: pointsBalance(userSnap.data()),
        correct: false,
      };
    }

    const userSnap = await tx.get(balanceRef);
    const balance = pointsBalance(userSnap.data());
    const delta = correct ? 1 : -1;
    const newBalance = Math.max(0, balance + delta);

    tx.set(triviaRef, {
      correct,
      delta,
      playedAt: FieldValue.serverTimestamp(),
    });
    tx.set(balanceRef, { points: newBalance }, { merge: true });

    return { alreadyPlayed: false, awarded: delta, points: newBalance, correct };
  });
}

/**
 * Redeem points to pay for an order.
 *
 * Guarantees:
 *  - the points cost is computed by the caller from the server order total, never
 *    from the client,
 *  - sufficient balance is checked and points deducted atomically,
 *  - overdraft is rejected,
 *  - idempotent: the same `checkoutToken` is recorded on the user doc, so a
 *    retry/concurrent request reuses the already-created order without deducting
 *    points a second time,
 *  - the transaction is serializable, so concurrent distinct checkouts cannot
 *    double-spend the same balance beyond what is actually available.
 */
export async function redeemPointsForOrder(
  db: Firestore,
  uid: string,
  checkoutToken: string,
  orderId: string,
  cost: number,
  orderDoc: Record<string, unknown>
): Promise<{ orderId: string; reused: boolean }> {
  const balanceRef = userRef(db, uid);
  const orderRef = db.collection("orders").doc(orderId);

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(balanceRef);
    const user = userSnap.data();
    const checkouts =
      user && user.pointsCheckouts && typeof user.pointsCheckouts === "object"
        ? user.pointsCheckouts
        : {};

    if (checkouts[checkoutToken]) {
      const recorded = checkouts[checkoutToken] as { orderId?: string };
      if (recorded.orderId) {
        return { orderId: recorded.orderId, reused: true };
      }
    }

    const balance = pointsBalance(user);
    if (balance < cost) {
      throw new InsufficientPointsError();
    }

    tx.update(balanceRef, {
      points: balance - cost,
      [`pointsCheckouts.${checkoutToken}`]: {
        orderId,
        cost,
        at: FieldValue.serverTimestamp(),
      },
    });
    tx.set(orderRef, orderDoc);

    return { orderId, reused: false };
  });
}

/**
 * Award points for a completed order, server-side and idempotently.
 *
 * The earned amount is passed in from the server-computed rule. The order's
 * `pointsAwarded` flag is flipped inside the same transaction, so even if the
 * request is retried (or two requests race) the user is credited at most once.
 */
export async function awardPointsForOrder(
  db: Firestore,
  uid: string,
  orderId: string,
  earnedPoints: number
): Promise<void> {
  if (earnedPoints <= 0) return;
  const orderRef = db.collection("orders").doc(orderId);
  const balanceRef = userRef(db, uid);

  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) return;
    const order = orderSnap.data() as { pointsAwarded?: boolean };
    if (order.pointsAwarded === true) return;

    tx.update(orderRef, { pointsAwarded: true, earnedPoints });
    tx.set(balanceRef, { points: FieldValue.increment(earnedPoints) }, { merge: true });
  });
}

/**
 * Award daily login/visit points (once per calendar day).
 *
 * Grants a fixed amount of points for the first site visit/login each day.
 * Idempotent per user per day via `dailyLoginDaily` subcollection.
 */
export async function awardDailyLoginPoints(
  db: Firestore,
  uid: string,
  amount: number = 5
): Promise<{ alreadyClaimed: boolean; awarded: number; points: number }> {
  const day = todayKey();
  const dailyRef = userRef(db, uid).collection("dailyLoginDaily").doc(day);
  const balanceRef = userRef(db, uid);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(dailyRef);
    if (existing.exists) {
      const userSnap = await tx.get(balanceRef);
      return {
        alreadyClaimed: true,
        awarded: 0,
        points: pointsBalance(userSnap.data()),
      };
    }

    const userSnap = await tx.get(balanceRef);
    const balance = pointsBalance(userSnap.data());
    const newBalance = balance + amount;

    tx.set(dailyRef, {
      amount,
      claimedAt: FieldValue.serverTimestamp(),
    });
    tx.set(balanceRef, { points: newBalance }, { merge: true });

    return { alreadyClaimed: false, awarded: amount, points: newBalance };
  });
}
