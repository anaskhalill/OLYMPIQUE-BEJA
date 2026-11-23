import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_CONFIG: Record<string, { limit: number; windowMs: number }> = {
  "/api/payment": { limit: 10, windowMs: 60000 },
  "/api/chat": { limit: 30, windowMs: 60000 },
};

const DEFAULT_RATE_LIMIT = { limit: 100, windowMs: 60000 };

function checkRateLimit(ip: string, path: string): boolean {
  const config = RATE_LIMIT_CONFIG[path] || DEFAULT_RATE_LIMIT;
  const key = `${ip}:${path}`;
  const now = Date.now();
  const entry = RATE_LIMIT.get(key);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.limit) {
    return false;
  }

  entry.count++;
  return true;
}

const BLOCKED_PATHS = ["/api/admin", "/_next/", "/node_modules/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  for (const blocked of BLOCKED_PATHS) {
    if (pathname.startsWith(blocked)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  if (pathname.startsWith("/api/")) {
    if (!checkRateLimit(ip, pathname)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  if (pathname.startsWith("/api/")) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|woff|woff2|ico)$).*)"],
};
