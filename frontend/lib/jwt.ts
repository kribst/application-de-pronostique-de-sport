/**
 * Utilitaires JWT : lecture de l'expiration sans verification de signature.
 *
 * Le serveur Next n'a pas besoin de valider le JWT (c'est Django qui le fait a
 * chaque appel protege) ; il a seulement besoin de savoir quand le cookie
 * d'acces expire, pour fixer son maxAge et pour decider s'il faut renouveler
 * le token dans proxy.ts. La signature n'est donc jamais verifiee ici.
 */

export type JwtPayload = {
  exp?: number;
  iat?: number;
  [claim: string]: unknown;
};

function decodeSegment(segment: string): string | null {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );

  try {
    return atob(padded);
  } catch {
    return null;
  }
}

export function decodeJwt(token: string | undefined | null): JwtPayload | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const json = decodeSegment(parts[1]);
  if (!json) return null;

  try {
    const payload: unknown = JSON.parse(json);
    if (typeof payload !== "object" || payload === null) return null;

    return payload as JwtPayload;
  } catch {
    return null;
  }
}

/** Secondes restantes avant expiration. 0 si deja expire ou illisible. */
export function secondsUntilExpiry(token: string | undefined | null): number {
  const payload = decodeJwt(token);
  if (!payload?.exp) return 0;

  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}

export function isAccessTokenExpired(token: string | undefined | null): boolean {
  return secondsUntilExpiry(token) <= 0;
}