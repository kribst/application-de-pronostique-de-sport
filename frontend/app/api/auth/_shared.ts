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
export function loginSuccessResponse(tokens: AuthTokens): NextResponse {
  const response = NextResponse.json({
    ok: true,
    redirectTo: "/dashboard",
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
    const { data } = await djangoFetch(AUTH_PATHS.login, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return loginSuccessResponse(data as AuthTokens);
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