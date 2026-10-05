import type { NextResponse } from "next/server";

/**
 * Noms et options des cookies qui portent les JWT.
 *
 * httpOnly : le JavaScript du navigateur ne peut pas lire ces cookies, donc un
 * XSS ne peut pas exfiltrer les tokens. Seul le serveur Next y accede.
 * sameSite "lax" : le cookie accompagne les navigations same-site (app et
 * API Next sont sur le meme domaine) tout en bloquant les envois cross-site.
 * secure :>true en production uniquement, pour ne pas casser http://localhost.
 */
export const ACCESS_COOKIE = "sp_access";
export const REFRESH_COOKIE = "sp_refresh";

const isProd = process.env.NODE_ENV === "production";

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function setAuthCookies(
  response: NextResponse,
  access: string,
  refresh: string,
  lifetimes: { access: number; refresh: number }
) {
  response.cookies.set(
    ACCESS_COOKIE,
    access,
    cookieOptions(lifetimes.access)
  );
  response.cookies.set(
    REFRESH_COOKIE,
    refresh,
    cookieOptions(lifetimes.refresh)
  );
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
}