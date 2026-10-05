import { NextResponse } from "next/server";

import { AUTH_PATHS } from "@/lib/api";
import { clearAuthCookies } from "@/lib/cookies";
import { djangoFetch } from "@/lib/django";
import { readTokens } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 *
 * Revoque le refresh token cote Django (blacklist), puis supprime les deux
 * cookies. L'ordre compte : on tente la revocation tant que le token est
 * encore lisible, et on efface les cookies quoi qu'il arrive, meme si Django
 * est injoignable — la session doit toujours se fermer dans le navigateur.
 */
export async function POST() {
  const { refresh } = await readTokens();

  if (refresh) {
    try {
      await djangoFetch(AUTH_PATHS.logout, {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Django indisponible : la deconnexion locale reste effective.
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);

  return response;
}