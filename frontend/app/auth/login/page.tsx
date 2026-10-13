import LoginClient from "./LoginClient";

/**
 * Ecran de connexion.
 *
 * `?registered=1` est ajoute par la route /api/auth/register apres une
 * inscription reussie : l'inscription n'ouvre pas de session et l'adresse doit
 * d'abord etre confirmee. Le flag est lu ici, cote serveur, pour
 * que le message de confirmation soit present dans le HTML envoye.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; passwordReset?: string }>;
}) {
  const { registered, passwordReset } = await searchParams;

  return (
    <LoginClient
      justRegistered={registered === "1"}
      passwordReset={passwordReset === "1"}
    />
  );
}