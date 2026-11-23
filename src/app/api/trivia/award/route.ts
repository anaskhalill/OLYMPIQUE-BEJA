import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { extractBearerToken, verifyIdToken } from "@/lib/admin/verify-id-token";
import { awardTriviaPoints } from "@/lib/admin/points";
import { isAnswerCorrect, todayKey } from "@/lib/admin/trivia";

/**
 * Authenticated, server-authorized Trivia points award.
 *
 * - Requires a verified Firebase ID token.
 * - The client sends only the chosen answerIndex (0-based).
 * - The server independently computes today's question and validates correctness.
 * - Once-per-day is enforced server-side via Firestore (not client localStorage).
 * - Reward: +1 correct / -1 wrong, floored at 0.
 */

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function notConfigured(): NextResponse {
  return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const db = getAdminDb();
  if (!db) return notConfigured();

  const authorization = req.headers.get("authorization");
  const token = extractBearerToken(authorization);
  const session = await verifyIdToken(token);
  if (!session?.uid) return unauthorized();

  let body: { answerIndex?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  if (typeof body.answerIndex !== "number" || !Number.isInteger(body.answerIndex) || body.answerIndex < 0 || body.answerIndex > 3) {
    return badRequest("Missing or invalid 'answerIndex' field (must be integer 0-3)");
  }

  const correct = isAnswerCorrect(body.answerIndex);

  try {
    const result = await awardTriviaPoints(db, session.uid, correct);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Trivia reward could not be saved" },
      { status: 500 }
    );
  }
}
