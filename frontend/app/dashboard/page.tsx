import { redirect, unstable_rethrow } from "next/navigation";

import { safeTimezone, todayIn } from "@/lib/datetime";
import { getMatchesPage, type Match } from "@/lib/referential";
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

  // Matchs du jour dans le fuseau de l'utilisateur. Un echec n'empeche pas le dashboard de s'afficher.
  const tz = safeTimezone(user.timezone);
  let todayMatches: Match[] | null = null;
  let todayTotal = 0;
  try {
    const page = await getMatchesPage({ date: todayIn(tz), tz });
    todayMatches = page.results;
    todayTotal = page.count;
  } catch (error) {
    unstable_rethrow(error);
  }

  return (
    <DashboardClient
      user={user}
      todayMatches={todayMatches}
      todayTotal={todayTotal}
      tz={tz}
    />
  );
}