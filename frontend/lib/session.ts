import { cookies } from "next/headers";

import { AUTH_PATHS } from "./api";
import type { AuthUser } from "./auth-types";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookies";
import { djangoFetch } from "./django";
import { isAccessTokenExpired, secondsUntilExpiry } from "./jwt";

/** Lecture des tokens depuis les cookies httpOnly (cote serveur uniquement). */
export async function readTokens(): Promise<{
  access?: string;
  refresh?: string;
}> {
  const store = await cookies();

  return {
    access: store.get(ACCESS_COOKIE)?.value,
    refresh: store.get(REFRESH_COOKIE)?.value,
  };
}

/** Access token absent ou deja expire : la session est a renouveler. */
export async function hasUsableAccessToken(): Promise<boolean> {
  const { access } = await readTokens();

  return Boolean(access) && !isAccessTokenExpired(access);
}

/**
 * Appelle /users/me/ avec un access token donne.
 * Renvoie null si le token est refuse (401/403) ou si Django est injoignable.
 */
export async function getMe(access: string): Promise<AuthUser | null> {
  try {
    const { data } = await djangoFetch(AUTH_PATHS.me, {
      headers: { Authorization: `Bearer ${access}` },
    });

    return data as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Echange le refresh token contre un nouvel access token.
 *
 * Django fonctionne avec ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION :
 * le refresh envoye est invalide immediatement et la reponse contient son
 * remplacant, qu'il faut_absolument remstocker, sinon la session est
 * definitivement cassee.
 */
export async function rotateRefresh(
  refresh: string
): Promise<{ access: string; refresh: string } | null> {
  try {
    const { data } = await djangoFetch(AUTH_PATHS.refresh, {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });

    const payload = data as { access?: string; refresh?: string };
    if (!payload.access) return null;

    return {
      access: payload.access,
      refresh: payload.refresh ?? refresh,
    };
  } catch {
    return null;
  }
}

/** Derive les durees de vie des cookies depuis les claims exp des tokens. */
export function cookieLifetimes(access: string, refresh: string): {
  access: number;
  refresh: number;
} {
  const accessTtl = secondsUntilExpiry(access);
  const refreshTtl = secondsUntilExpiry(refresh);

  return {
    // 1h de repli si le claim exp est illisible : le cookie sera renouvele
    // au prochain passage sur /dashboard.
    access: accessTtl > 0 ? accessTtl : 3600,
    refresh: refreshTtl > 0 ? refreshTtl : 60 * 60 * 24 * 7,
  };
}

/** Utilisateur de la session courante, ou null si session absente/invalide. */
export async function currentUser(): Promise<AuthUser | null> {
  const { access } = await readTokens();
  if (!access || isAccessTokenExpired(access)) return null;

  return getMe(access);
}