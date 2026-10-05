import { redirect } from "next/navigation";

import { currentUser } from "@/lib/session";

import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

/**
 * Le dashboard est reserve aux utilisateurs connectes : proxy.ts bloque deja
 * l'acces sans session, mais on revalide ici pour ne pas faire rendre une page
 * dont les donnees n'ont pas pu etre chargees.
 *
 * Le composant enfant est un client component : il recoit l'utilisateur deja
 * resolu, donc aucun token JWT ne traverse le rendu cote navigateur.
 */
export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) redirect("/auth/login");

  return <DashboardClient user={user} />;
}