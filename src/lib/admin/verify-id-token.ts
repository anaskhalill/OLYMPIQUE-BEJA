import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "./firebase-admin";

export interface VerifiedSession {
  uid: string;
  email?: string | null;
  emailVerified?: boolean;
  name?: string | null;
  picture?: string | null;
  [key: string]: unknown;
}

/**
 * Verify a Firebase ID token presented by the client.
 *
 * Returns the decoded user info on success, or null when the token is missing,
 * expired, forged, issued by a different project, or the Admin SDK is not
 * configured. It never throws; API routes can branch on the null result and
 * return 401/403 without leaking internal details.
 */
export async function verifyIdToken(token: string | undefined | null): Promise<VerifiedSession | null> {
  if (!token) return null;

  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;

  try {
    const decoded: DecodedIdToken = await adminAuth.verifyIdToken(token);
    if (!decoded || typeof decoded !== "object" || !decoded.uid) return null;

    return {
      uid: decoded.uid,
      email: typeof decoded.email === "string" ? decoded.email : null,
      emailVerified: !!decoded.email_verified,
      name: typeof decoded.name === "string" ? decoded.name : null,
      picture: typeof decoded.picture === "string" ? decoded.picture : null,
    };
  } catch {
    // Invalid / expired / foreign token. Do not surface the underlying error.
    return null;
  }
}

/**
 * Convenience: parse the Bearer token from a request's Authorization header.
 */
export function extractBearerToken(authorization: string | null | undefined): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match ? match[1] : null;
}
