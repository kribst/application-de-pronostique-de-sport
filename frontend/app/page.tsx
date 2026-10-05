import { redirect } from "next/navigation";

import { hasUsableAccessToken } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Point d'entree : un visiteur connecte part vers son tableau de bord, sinon
 * vers la page d'accueil. La lecture des cookies impose un rendu dynamique.
 */
export default async function Root() {
  const authenticated = await hasUsableAccessToken();

  redirect(authenticated ? "/dashboard" : "/home");
}