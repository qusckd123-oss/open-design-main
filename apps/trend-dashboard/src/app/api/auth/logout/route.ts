import { NextResponse } from "next/server";
import { getPublicOrigin, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", getPublicOrigin(request)), { status: 303 });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
