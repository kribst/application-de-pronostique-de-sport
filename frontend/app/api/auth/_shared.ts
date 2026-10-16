import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_PATHS } from "@/lib/api";
import type { AuthTokens, AuthUser } from "@/lib/auth-types";
import { setAuthCookies } from "@/lib/cookies";
import { DjangoError, djangoFetch, toDjangoError } from "@/lib/django";
import { cookieLifetimes } from "@/lib/session";

export const runtime = "nodejs";
/* Les routes d'auth lisent et ecrivent des cookies : jamais de cache. */
export const dynamic = "force-dynamic";

/**
 * Messages d'erreur DRF traduits en francais pour l'affichage sous les
 * champs. Toute cle inconnue est renvoiee telle quelle dans `message`.
 */
const DETAIL_MESSAGES: Record<string, string> = {
  "No active account found with the given credentials":
    "Email ou mot de passe incorrect.",
};

function translateDetail(detail: string): string {
  return DETAIL_MESSAGES[detail] ?? detail;
}

/**
 * Traduit une DjangoError en reponse JSON consommee par les formulaires.
 * Forme : { ok: false, message, fieldErrors }.
 */
export function failureResponse(error: unknown): NextResponse {
  const djangoError = toDjangoError(error);

  if (djangoError.status === 429) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Trop de tentatives. Patientez quelques instants avant de réessayer.",
      },
      { status: 429 }
    );
  }

  if (djangoError instanceof DjangoError) {
    // Backend injoignable ou trop lent : message clair, pas de 502 opaque.
    if (djangoError.status === 503) {
      return NextResponse.json(
        {
          ok: false,
          message: translateDetail(djangoError.message),
        },
        { status: 503 }
      );
    }

    const fieldErrors = djangoError.fieldErrors;
    const hasFieldErrors = Object.keys(fieldErrors).length > 0;

    return NextResponse.json(
      {
        ok: false,
        message: hasFieldErrors
          ? "Vérifiez les informations saisies."
          : translateDetail(djangoError.message),
        ...(hasFieldErrors ? { fieldErrors } : {}),
      },
      // 401 remonte tel quel pour que le formulaire sache qu'il s'agit d'un
      // echec d'identifiants ; les autres erreurs deviennent 502/500.
      {
        status:
          djangoError.status === 401 ? 401 : djangoError.status >= 500 ? 502 : 400,
      }
    );
  }

  return NextResponse.json(
    { ok: false, message: "Une erreur interne est survenue." },
    { status: 500 }
  );
}

/**
 * Ecrit les cookies httpOnly et renvoie l'utilisateur au client.
 * Reserve a la connexion : l'inscription, elle, n'ouvre pas de session.
 */
/**
 * Destination apres connexion : uniquement un chemin interne (pas d'URL
 * externe, pas de "//", pas de retour vers les pages d'auth).
 */
export function safeNext(next: unknown): string {
  if (
    typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("\\") &&
    !next.startsWith("/auth") &&
    !next.startsWith("/api")
  ) {
    return next;
  }

  return "/dashboard";
}

/**
 * Transmet l'IP du visiteur a Django : sans cela, Django ne voit que l'IP du
 * serveur Next et applique ses limites anti-abus a tous les utilisateurs
 * ensemble. Django ne lit cet en-tete que si DJANGO_NUM_PROXIES >= 1.
 */
async function clientHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const forwarded = incoming.get("x-forwarded-for") ?? incoming.get("x-real-ip");

  return forwarded ? { "X-Forwarded-For": forwarded } : {};
}

export function loginSuccessResponse(
  tokens: AuthTokens,
  next?: unknown
): NextResponse {
  const response = NextResponse.json({
    ok: true,
    redirectTo: safeNext(next),
    user: tokens.user satisfies AuthUser,
  });

  setAuthCookies(
    response,
    tokens.access,
    tokens.refresh,
    cookieLifetimes(tokens.access, tokens.refresh)
  );

  return response;
}

/**
 * POST /api/auth/login : appelle Django et ouvre la session.
 */
export async function postLogin(body: unknown): Promise<NextResponse> {
  try {
    const { next, ...credentials } = (body ?? {}) as Record<string, unknown>;
    const { data } = await djangoFetch(AUTH_PATHS.login, {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: await clientHeaders(),
    });

    return loginSuccessResponse(data as AuthTokens, next);
  } catch (error) {
    return failureResponse(error);
  }
}

/**
 * POST /api/auth/register : appelle Django pour creer le compte, puis jette
 * les tokens renvoyes par l'API.
 *
 * Django emet un access + un refresh token a l'inscription, mais on ne veut
 * pas ouvrir de session : l'utilisateur doit se connecter explicitement. Les
 * tokens ne sont donc jamais persistes en cookie ni renvoyes au navigateur.
 */
export async function postRegister(body: unknown): Promise<NextResponse> {
  try {
    await djangoFetch(AUTH_PATHS.register, {
      method: "POST",
      body: JSON.stringify(body),
      headers: await clientHeaders(),
    });

    // Aucune session ouverte : on renvoie l'utilisateur vers la connexion.
    return NextResponse.json({
      ok: true,
      redirectTo: "/auth/login?registered=1",
    });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function postAuthAction(
  path: string,
  body: Record<string, string>
): Promise<NextResponse> {
  try {
    const { data } = await djangoFetch(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: await clientHeaders(),
    });
    const payload =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {};

    return NextResponse.json({ ...payload, ok: true });
  } catch (error) {
    return failureResponse(error);
  }
}