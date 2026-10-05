/** Forme de l'utilisateur renvoyee par /api/v1/users/me/ et /auth/login/. */
export type AuthUser = {
  id: string;
  email: string;
  role: "USER" | "PREMIUM" | "MODERATOR" | "ADMIN";
  locale: string;
  timezone: string;
  is_verified: boolean;
  date_joined: string;
};

/** Reponse de /auth/login/ et /auth/register/. */
export type AuthTokens = {
  access: string;
  refresh: string;
  user: AuthUser;
};

export const PREMIUM_ROLES = ["PREMIUM", "ADMIN"] as const;

export function hasPremiumAccess(user: AuthUser | null): boolean {
  if (!user) return false;

  return (PREMIUM_ROLES as readonly string[]).includes(user.role);
}

export function roleLabel(user: AuthUser | null): string {
  if (!user) return "Invité";

  if (hasPremiumAccess(user)) return "Premium";
  if (user.role === "MODERATOR") return "Modérateur";

  return "Free";
}

/**
 * Reponse normalisee des routes /api/auth/* consommees par les formulaires.
 * `redirectTo` indique ou le navigateur doit aller apres un succes :
 * /dashboard apres connexion, /auth/login apres inscription.
 */
export type AuthResponsePayload =
  | { ok: true; redirectTo: string; user?: AuthUser }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };