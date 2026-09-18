import { createHmac, timingSafeEqual } from "node:crypto";

// Shared access-code auth for the whole dashboard. A single signed session
// cookie (no per-user identity) gates every page and API route except
// /login and the auth endpoints themselves - see src/proxy.ts.
//
// Kept free of `next/headers` / `next/server` imports so the exact same
// verify logic can run both inside proxy.ts (NextRequest cookies) and
// inside Route Handlers / Server Components (next/headers cookies()).

export const SESSION_COOKIE_NAME = "od_dashboard_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = {
  iat: number;
  exp: number;
};

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is not configured (need a random string of at least 16 characters). Set it in the environment before enabling dashboard access."
    );
  }
  return secret;
}

function requireAccessCode(): string {
  const code = process.env.DASHBOARD_ACCESS_CODE;
  if (!code) {
    throw new Error("DASHBOARD_ACCESS_CODE is not configured. Set it in the environment before enabling dashboard access.");
  }
  return code;
}

/** True once both required secrets are present; used to fail closed instead of silently allowing access. */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16 && process.env.DASHBOARD_ACCESS_CODE);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a comparison so the miss path takes comparable time to a
    // length-matched miss, rather than short-circuiting immediately.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Server-side only: compares a submitted access code against DASHBOARD_ACCESS_CODE. */
export function verifyAccessCode(candidate: string): boolean {
  let expected: string;
  try {
    expected = requireAccessCode();
  } catch {
    return false;
  }
  return constantTimeEqual(candidate, expected);
}

/** Creates a new signed, expiring session token. Throws if SESSION_SECRET is missing. */
export function createSessionToken(): string {
  const secret = requireSessionSecret();
  const issuedAt = Date.now();
  const payload: SessionPayload = { iat: issuedAt, exp: issuedAt + SESSION_MAX_AGE_SECONDS * 1000 };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

/** Verifies signature and expiry of a session token read from the cookie. Never throws. */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  let secret: string;
  try {
    secret = requireSessionSecret();
  } catch {
    return false;
  }

  const expectedSignature = sign(encodedPayload, secret);
  if (!constantTimeEqual(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

/** Restricts a post-login redirect target to an internal path, preventing open redirects. */
export function safeRedirectPath(candidate: string | null | undefined): string {
  if (!candidate) return "/";
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("://")) return "/";
  return candidate;
}

/**
 * Reconstructs the browser-facing origin for building absolute redirect
 * URLs in Route Handlers. `Request#url` there reflects the Next server's
 * own listening address (e.g. `http://0.0.0.0:8080` from Railway's
 * HOSTNAME/PORT), not the public host the browser actually visited - it
 * does not consult forwarded headers, so a redirect built with `new
 * URL(path, request.url)` behind a reverse proxy sends the browser to the
 * container's internal bind address instead of the real site.
 *
 * Prefers the reverse proxy's `X-Forwarded-*` headers (Railway, and
 * standard practice for any platform terminating TLS in front of a
 * standalone Next server), falls back to the plain `Host` header for
 * direct/unproxied access, and only falls back to the request's own URL
 * as a last resort. Never reads process.env.HOSTNAME/PORT.
 */
export function getPublicOrigin(request: Request): string {
  const requestUrl = new URL(request.url);

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || requestUrl.protocol.replace(":", "");

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;

  return `${protocol}://${host}`;
}
