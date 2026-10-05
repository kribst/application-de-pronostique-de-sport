import { NextResponse } from "next/server";

import { clearAuthCookies, setAuthCookies } from "@/lib/cookies";
import { isAccessTokenExpired, secondsUntilExpiry } from "@/lib/jwt";
import { cookieLifetimes, readTokens, rotateRefresh } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Renouvellement anticipe : on refresh 2 min avant l'expiration. */
const REFRESH_MARGIN_SECONDS = 120;

/**
 * GET /api/auth/me
 *
 * Indique au navigateur si une session est ouverte, sans exposer les tokens.
 * L'access token nearing expiration est renouvele au passage : le refresh est
 * echange contre un nouveau couple (l'ancien refresh est blackliste par
 * Django), et les cookies sont reecrits.
 */
export async function GET() {
  const { access, refresh } = await readTokens();

  if (!access || isAccessTokenExpired(access)) {
    const rotated = refresh ? await rotateRefresh(refresh) : null;

    if (!rotated) {
      const response = NextResponse.json({ authenticated: false });
      clearAuthCookies(response);

      return response;
    }

    const response = NextResponse.json({ authenticated: true });
    setAuthCookies(
      response,
      rotated.access,
      rotated.refresh,
      cookieLifetimes(rotated.access, rotated.refresh)
    );

    return response;
  }

  if (refresh) {
    // Renouvellement anticipe quand le token approche de l'expiration.
    if (secondsUntilExpiry(access) <= REFRESH_MARGIN_SECONDS) {
      const rotated = await rotateRefresh(refresh);

      if (rotated) {
        const response = NextResponse.json({ authenticated: true });
        setAuthCookies(
          response,
          rotated.access,
          rotated.refresh,
          cookieLifetimes(rotated.access, rotated.refresh)
        );

        return response;
      }

      const response = NextResponse.json({ authenticated: false });
      clearAuthCookies(response);

      return response;
    }
  }

  return NextResponse.json(
    { authenticated: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}