import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin SDK singleton.
 *
 * Security notes:
 * - This module is guard-railed with `import "server-only"`, so any attempt to
 *   import it from a client component fails the build (no Admin SDK in browsers).
 * - Credentials are read from the server-only env var FIREBASE_SERVICE_ACCOUNT
 *   (a JSON string). It is NEVER logged, printed, bundled into the client, or
 *   committed to source. `.env.local` must NOT contain real values.
 * - When no valid credentials are present the module returns null cleanly so the
 *   rest of the app degrades gracefully (no server DB/auth), matching the pattern
 *   used by the payment and chat routes' placeholder guards.
 */

interface ServiceAccountConfig {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

// Recognise placeholder / empty values so we never attempt init with junk.
const isRealValue = (v: string | undefined): v is string =>
  !!v && !/^\s*(your_|placeholder|xxx|\.\.\.)\s*$/i.test(v);

/**
 * Parse FIREBASE_SERVICE_ACCOUNT (JSON) into a type the Admin SDK accepts.
 * Returns null when missing, malformed, or placeholder-only.
 */
function parseServiceAccount(): ServiceAccountConfig | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!isRealValue(raw)) return null;

  try {
    const parsed = JSON.parse(raw) as ServiceAccountConfig;
    if (
      isRealValue(parsed.projectId) &&
      isRealValue(parsed.clientEmail) &&
      isRealValue(parsed.privateKey)
    ) {
      return parsed;
    }
  } catch {
    // Malformed JSON - never log the content; just report unconfigured.
    console.error(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT present but invalid; Admin SDK disabled."
    );
  }
  return null;
}

let _adminDb: Firestore | null | undefined;
let _adminAuth: Auth | null | undefined;

function hasApp(): boolean {
  return getApps().length > 0;
}

function getOrInitApp(): App {
  if (hasApp()) return getApps()[0];
  const creds = parseServiceAccount();

  // Prefer explicit credentials; fall back to Application Default Credentials
  // (GOOGLE_APPLICATION_CREDENTIALS / metadata server) for hosted environments.
  const options = creds
    ? {
        credential: cert({
          projectId: creds.projectId,
          clientEmail: creds.clientEmail,
          privateKey: creds.privateKey,
        }),
      }
    : {};

  return initializeApp(options);
}

/**
 * Get the Firestore-admin instance, or null when not configured.
 */
export function getAdminDb(): Firestore | null {
  if (_adminDb !== undefined) return _adminDb;
  if (!hasApp() && !isRealValue(process.env.FIREBASE_SERVICE_ACCOUNT) &&
      !isRealValue(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    _adminDb = null;
    return _adminDb;
  }
  _adminDb = getFirestore(getOrInitApp());
  return _adminDb;
}

/**
 * Get the Firebase Auth-admin instance, or null when not configured.
 */
export function getAdminAuth(): Auth | null {
  if (_adminAuth !== undefined) return _adminAuth;
  if (!hasApp() && !isRealValue(process.env.FIREBASE_SERVICE_ACCOUNT) &&
      !isRealValue(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    _adminAuth = null;
    return _adminAuth;
  }
  _adminAuth = getAuth(getOrInitApp());
  return _adminAuth;
}

export type { Auth, Firestore };
