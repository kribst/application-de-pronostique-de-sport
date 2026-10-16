import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "./lib/cookies";
import { isAccessTokenExpired, secondsSinceIssuance, secondsUntilExpiry } from "./lib/jwt";
import { cookieLifetimes, MAX_SESSION_AGE_SECONDS, rotateRefresh } from "./lib/session";

/**
 * Protection des routes et renouvellement de session.
 *
 * Next 16 a renomme `middleware` en `proxy` : ce fichier remplace donc
 * middleware.ts. Il s'execute sur chaque navigation, avant le rendu.
 *
 * Trois responsabilites :
 * - un utilisateur deja connecte qui ouvre /auth/login ou /auth/register est
 *   renvoye vers /dashboard, d'ou qu'il vienne (clic sur "Se connecter" depuis
 *   n'importe quelle page inclus) : ces pages ne lui servent a rien.
 * - les pages reservees aux utilisateurs connectes exigent une session valide ;
 *   sinon 302 vers /auth/login.
 * - un access token expire est renouvele a partir du refresh token. Une
 *   session a aussi une duree absolue bornee (MAX_SESSION_AGE_SECONDS) : un
 *   utilisateur ne peut pas rester connecte indefiniment, meme avec une
 *   activite reguliere.
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

/** Pages reservees aux utilisateurs connectes. */
const PROTECTED_PREFIXES = ["/dashboard", "/sports", "/competitions", "/admin"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function redirectTo(request: NextRequest, target: string): NextResponse {
  const url = new URL(target, request.url);

  // Destination memorisee pour y revenir apres connexion.
  if (target === "/auth/login" && isProtected(request.nextUrl.pathname)) {
    url.searchParams.set("next", request.nextUrl.pathname);
  }

  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  // Session trop ancienne : on la ferme et on renvoie vers l'ecran de
  // connexion, sauf si on y est deja (boucle evitee).
  const sessionTooOld = Boolean(
    access && secondsSinceIssuance(access) > MAX_SESSION_AGE_SECONDS
  );

  if (sessionTooOld && !isAuthPage(pathname)) {
    const response = redirectTo(request, "/auth/login");
    clearAuthCookies(response);

    return response;
  }

  let authenticated = Boolean(
    access && !isAccessTokenExpired(access) && !sessionTooOld
  );
  let rotated: { access: string; refresh: string } | null = null;

  // Renouvellement anticipe quand le token approche de l'expiration.
  // Django blackliste le refresh envoye et en retourne un nouveau, qu'il faut
  // reecrire dans les cookies.
  if (!sessionTooOld && refresh && access && secondsUntilExpiry(access) <= REFRESH_MARGIN_SECONDS) {
    rotated = await rotateRefresh(refresh);

    if (!rotated) {
      // Refresh refuse : plus aucune session possible, on repart de zero.
      const response = redirectTo(request, "/auth/login");
      clearAuthCookies(response);

      return response;
    }

    authenticated = true;
  }

  if (authenticated && isAuthPage(pathname)) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    if (rotated) {
      setAuthCookies(
        response,
        rotated.access,
        rotated.refresh,
        cookieLifetimes(rotated.access, rotated.refresh)
      );
    }

    return response;
  }

  if (isProtected(pathname) && !authenticated) {
    return redirectTo(request, "/auth/login");
  }

  const response = NextResponse.next();

  if (rotated) {
    setAuthCookies(
      response,
      rotated.access,
      rotated.refresh,
      cookieLifetimes(rotated.access, rotated.refresh)
    );
  }

  return response;
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