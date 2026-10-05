import { API_URL } from "./api";

/**
 * Client HTTP vers Django, utilise exclusivement cote serveur (route handlers
 * Next et proxy.ts). Le navigateur ne parle jamais directement au backend.
 */

export type DjangoErrorBody = Record<string, unknown> & {
  detail?: string;
  [field: string]: unknown;
};

export class DjangoError extends Error {
  readonly status: number;
  readonly body: DjangoErrorBody;

  constructor(status: number, body: DjangoErrorBody) {
    super(typeof body.detail === "string" ? body.detail : `Erreur ${status}`);
    this.name = "DjangoError";
    this.status = status;
    this.body = body;
  }

  /**
   * Erreurs de validation DRF : chaque champ est soit une liste de messages,
   * soit une chaine (cas des validate() cross-champs, ex. password_confirm).
   */
  get fieldErrors(): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(this.body)) {
      if (key === "detail") continue;

      const messages = Array.isArray(value)
        ? value.map(String)
        : [String(value)];

      if (messages.length > 0) result[key] = messages;
    }

    return result;
  }
}

export async function djangoFetch(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; data: unknown }> {
  let response: Response;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      // Les tokens sont dans des cookies httpOnly : le cache doit sauter.
      cache: "no-store",
    });
  } catch (error) {
    throw new DjangoError(503, {
      detail:
        error instanceof DOMException && error.name === "AbortError"
          ? "Le service d'authentification met trop de temps à répondre. Réessaie."
          : "Le service d'authentification est injoignable. Réessaie.",
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        detail: `Réponse inattendue du serveur (${response.status}).`,
      };
    }
  }

  if (!response.ok) {
    throw new DjangoError(
      response.status,
      (data ?? { detail: `Erreur ${response.status}` }) as DjangoErrorBody
    );
  }

  return { status: response.status, data };
}

export function toDjangoError(error: unknown): DjangoError {
  if (error instanceof DjangoError) return error;

  return new DjangoError(500, {
    detail: "Une erreur interne est survenue.",
  });
}