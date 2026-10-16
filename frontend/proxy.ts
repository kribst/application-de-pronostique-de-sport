import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, setAuthCookies } from "./lib/cookies";
import { isAccessTokenExpired, secondsUntilExpiry } from "./lib/jwt";
import { cookieLifetimes, rotateRefresh } from "./lib/session";

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

/** Duplique les nouveaux cookies dans la requete en cours et dans la reponse. */
function withRotatedCookies(
  request: NextRequest,
  rotated: { access: string; refresh: string } | null,
  build: (request: NextRequest) => NextResponse
): NextResponse {
  if (!rotated) return build(request);

  // La requete en cours doit voir les nouveaux tokens : sans cela, les pages
  // serveur liraient l'ancien cookie (absent ou expire) et renverraient vers
  // /auth/login malgre un renouvellement reussi.
  request.cookies.set(ACCESS_COOKIE, rotated.access);
  request.cookies.set(REFRESH_COOKIE, rotated.refresh);

  const response = build(request);
  setAuthCookies(
    response,
    rotated.access,
    rotated.refresh,
    cookieLifetimes(rotated.access, rotated.refresh)
  );

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  let authenticated = Boolean(access && !isAccessTokenExpired(access));
  let rotated: { access: string; refresh: string } | null = null;

  // Renouvellement quand l'access token est ABSENT (le cookie expire en meme
  // temps que le token), expire ou proche de l'expiration. Django blackliste
  // le refresh envoye et en retourne un nouveau, qu'il faut reecrire.
  const needsRotation =
    Boolean(refresh) && (!access || secondsUntilExpiry(access) <= REFRESH_MARGIN_SECONDS);

  if (needsRotation && refresh) {
    rotated = await rotateRefresh(refresh);
    authenticated = rotated !== null;

    // En cas d'echec on NE supprime PAS les cookies : le refus peut venir
    // d'une requete concurrente qui a deja renouvele la session, et les
    // effacer ici ecraserait les cookies valides qu'elle vient d'ecrire.
    // Un refresh reellement invalide expire de lui-meme et sera remplace a
    // la prochaine connexion.
  }

  if (authenticated && isAuthPage(pathname)) {
    return withRotatedCookies(request, rotated, () =>
      NextResponse.redirect(new URL("/dashboard", request.url))
    );
  }

  if (isProtected(pathname) && !authenticated) {
    return redirectTo(request, "/auth/login");
  }

  return withRotatedCookies(request, rotated, (req) =>
    NextResponse.next({ request: req })
  );
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