/**
 * Configuration de l'API Django cote Next.js.
 *
 * NEXT_PUBLIC_API_URL est lue par le serveur Next (routes /api/auth/* et
 * proxy.ts). Les appels du navigateur ne touchent jamais Django directement :
 * le parcours de connexion passe par /api/auth/*, donc aucun CORS navigateur
 * n'est requis.
 *
 * En local on prefere 127.0.0.1 a localhost : `localhost` resout souvent vers
 * ::1 en priorite, et si un conteneur Docker d'un autre projet occupe le port,
 * la requete part au mauvais serveur. Django se lance sur 8001 :
 *   python src/manage.py runserver 8001
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001"
).replace(/\/+$/, "");

export const API_PREFIX = "/api/v1";

export const AUTH_PATHS = {
  login: `${API_PREFIX}/auth/login/`,
  register: `${API_PREFIX}/auth/register/`,
  refresh: `${API_PREFIX}/auth/refresh/`,
  logout: `${API_PREFIX}/auth/logout/`,
  me: `${API_PREFIX}/users/me/`,
} as const;