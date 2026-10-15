import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { currentUser } from "@/lib/session";
import { getSports, type Sport } from "@/lib/referential";

import AppShell from "./AppShell";

/** Page reservee aux connectes : charge l'utilisateur et les sports puis rend le shell. */
export default async function AuthedPage({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/auth/login");

  let sports: Sport[] = [];
  try {
    sports = await getSports();
  } catch {
    // Le selecteur reste vide si l'API est indisponible ; la page affiche sa propre erreur.
  }

  return (
    <AppShell user={user} sports={sports}>
      {children}
    </AppShell>
  );
}
