import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { extractBearerToken, verifyIdToken } from "@/lib/admin/verify-id-token";
import { awardDailyLoginPoints } from "@/lib/admin/points";

/**
 * Daily login/visit points award endpoint.
 *
 * Authenticated, server-authorized once-per-day points grant.
 * The client can call this on load/login; the server enforces once-per-day
 * via a Firestore transaction and daily subcollection document.
 */

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function notConfigured(): NextResponse {
  return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}

export async function POST(req: NextRequest) {
  const db = getAdminDb();
  if (!db) return notConfigured();

  const authorization = req.headers.get("authorization");
  const token = extractBearerToken(authorization);
  const session = await verifyIdToken(token);
  if (!session?.uid) return unauthorized();

  try {
    const result = await awardDailyLoginPoints(db, session.uid);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Daily points award failed" }, { status: 500 });
  }
}