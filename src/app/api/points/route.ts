import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { extractBearerToken, verifyIdToken } from "@/lib/admin/verify-id-token";
import { pointsBalance, userRef } from "@/lib/admin/points";

/**
 * Points API.
 *
 * `GET /api/points` returns the authenticated user's authoritative balance from
 * `users/{uid}.points`.
 *
 * There is deliberately NO mutation endpoint here. The client can never submit a
 * delta. Every points change is performed server-side by a purpose-specific,
 * authorized operation:
 *   - `POST /api/orders` with `paymentMethod: "points"`  -> server redemption
 *   - `POST /api/trivia/award`                            -> server reward
 *
 * The Firebase ID token is verified server-side; the userId comes from the token,
 * never from the request.
 */

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function notConfigured(): NextResponse {
  return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}

export async function GET(req: NextRequest) {
  const db = getAdminDb();
  if (!db) return notConfigured();

  const authorization = req.headers.get("authorization");
  const token = extractBearerToken(authorization);
  const session = await verifyIdToken(token);
  if (!session?.uid) return unauthorized();

  const userSnap = await db.collection("users").doc(session.uid).get();
  const points = pointsBalance(userSnap.data());

  return NextResponse.json({ points });
}
