import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "./lib/cookies";
import { isAccessTokenExpired, secondsUntilExpiry } from "./lib/jwt";
import { cookieLifetimes, rotateRefresh } from "./lib/session";

/**
 * Protection des routes et renouvellement de session.
 *
 * Next 16 a renomme `middleware` en `proxy` : ce fichier remplace donc
 * middleware.ts. Il s'execute sur chaque navigation, avant le rendu.
 *
 * Deux responsabilites :
 * - /dashboard est reserve aux utilisateurs connectes (sinon 302 vers /auth/login).
 * - un access token expire est renouvele a partir du refresh token, ce qui
 *   evite une re-authentification toutes les 30 minutes.
 * Un utilisateur deja connecte qui ouvre /auth/login ou /auth/register est
 * renvoye vers /dashboard : ces pages ne lui servent a rien.
 */

/** Renouvellement anticipe quand le token approche de l'expiration. */
const REFRESH_MARGIN_SECONDS = 120;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Pages d'auth elles-memes : /auth/login et /auth/register. */
function isAuthPage(pathname: string): boolean {
  return (
    matchesPrefix(pathname, "/auth/login") ||
    matchesPrefix(pathname, "/auth/register")
  );
}

function redirectTo(request: NextRequest, target: string): NextResponse {
  const url = new URL(target, request.url);

  // Destination memorisee pour y revenir apres connexion.
  if (
    target === "/auth/login" &&
    matchesPrefix(request.nextUrl.pathname, "/dashboard")
  ) {
    url.searchParams.set("next", request.nextUrl.pathname);
  }

  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  // Session connectee : renewal de l'access token quand il approche de
  // l'expiration. Django blackliste le refresh envoye et en retourne un
  // nouveau, qu'il faut reecrire dans les cookies.
  if (refresh && access && secondsUntilExpiry(access) <= REFRESH_MARGIN_SECONDS) {
    const rotated = await rotateRefresh(refresh);

    if (rotated) {
      const response = NextResponse.next();
      setAuthCookies(
        response,
        rotated.access,
        rotated.refresh,
        cookieLifetimes(rotated.access, rotated.refresh)
      );

      return response;
    }

    // Refresh refuse : plus aucune session possible, on repart de zero.
    const response = redirectTo(request, "/auth/login");
    clearAuthCookies(response);

    return response;
  }

  const authenticated = Boolean(access && !isAccessTokenExpired(access));

  if (authenticated && isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (matchesPrefix(pathname, "/dashboard") && !authenticated) {
    return redirectTo(request, "/auth/login");
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Le matcher ignore /api, /_next et les fichiers statiques : le proxy ne
   * s'execute que pour les navigations de pages.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|fonts/|images/|.*\\..*).*)",
  ],
};