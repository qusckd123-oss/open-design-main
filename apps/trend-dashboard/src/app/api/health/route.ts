import { NextResponse } from "next/server";

// Public healthcheck for the platform's deploy healthcheck (e.g. Railway).
// Must stay free of auth, DB queries, and outbound network calls so it
// always answers fast if the Next server process itself is up. See
// src/proxy.ts, which explicitly allowlists this path as public.
export async function GET() {
  return NextResponse.json({ ok: true });
}
