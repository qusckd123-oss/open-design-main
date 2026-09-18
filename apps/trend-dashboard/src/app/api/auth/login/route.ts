import { NextResponse } from "next/server";
import { createSessionToken, getPublicOrigin, isAuthConfigured, safeRedirectPath, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, verifyAccessCode } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const code = String(formData.get("code") ?? "");
  const from = safeRedirectPath(String(formData.get("from") ?? ""));
  const origin = getPublicOrigin(request);

  if (!isAuthConfigured()) {
    // Fail closed: never let a request through just because secrets are missing.
    console.error("Dashboard auth is not configured: DASHBOARD_ACCESS_CODE and/or SESSION_SECRET are missing.");
    const url = new URL("/login", origin);
    url.searchParams.set("error", "config");
    if (from !== "/") url.searchParams.set("from", from);
    return NextResponse.redirect(url, { status: 303 });
  }

  if (!code || !verifyAccessCode(code)) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "invalid");
    if (from !== "/") url.searchParams.set("from", from);
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(from, origin), { status: 303 });
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
  return response;
}
