import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

async function refreshSession(req: NextRequest): Promise<Headers | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const cookie = req.headers.get("cookie");

  if (!apiUrl || !cookie) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/refresh`, {
      method: "POST",
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.headers;
  } catch {
    return null;
  }
}

function continueWithRefreshCookies(refreshHeaders: Headers): NextResponse {
  const response = NextResponse.next();
  const setCookies =
    typeof refreshHeaders.getSetCookie === "function"
      ? refreshHeaders.getSetCookie()
      : [refreshHeaders.get("set-cookie")].filter(
          (cookie): cookie is string => Boolean(cookie),
        );

  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;

  try {
    if (!token) {
      throw new Error("Access token missing");
    }

    const secretValue =
      process.env.ACCESS_TOKEN_SECRET ?? process.env.JWT_SECRET;
    if (!secretValue) {
      throw new Error("Access token secret is not configured");
    }

    await jose.jwtVerify(token, new TextEncoder().encode(secretValue));
    return NextResponse.next();
  } catch {
    const refreshedCookies = await refreshSession(req);
    if (refreshedCookies) {
      return continueWithRefreshCookies(refreshedCookies);
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// Apply only to dashboard routes
export const config = {
  matcher: ["/dashboard/:path*" , "/roadmaps/:path*"],
};
