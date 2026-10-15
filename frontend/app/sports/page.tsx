import Link from "next/link";

import AuthedPage from "@/components/layout/AuthedPage";
import { ErrorState } from "@/components/ui/State";
import { getSports, type Sport } from "@/lib/referential";

export const dynamic = "force-dynamic";

export default async function SportsPage() {
  let sports: Sport[] = [];
  let error: string | null = null;

  try {
    sports = await getSports();
  } catch {
    error = "Impossible de charger les sports. Réessaie dans un instant.";
  }

  return (
    <AuthedPage>
      <h1 className="text-headline-lg font-bold text-on-surface">Sports</h1>
      <p className="mt-1 mb-space-md text-body-md text-on-surface-variant">
        Le football est actif ; les autres sports arrivent dans les versions suivantes.
      </p>

      {error ? (
        <ErrorState title="Erreur" message={error} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sports.map((sport) => (
            <li
              key={sport.id}
              className={`rounded-2xl border border-outline-variant bg-white p-5 ${
                sport.is_active ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-semibold">{sport.name}</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${
                    sport.is_active
                      ? "bg-primary-container text-primary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {sport.is_active ? "Actif" : "Bientôt"}
                </span>
              </div>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {sport.sport_type === "TEAM" ? "Sport collectif" : "Sport individuel"}
              </p>
              {sport.is_active && (
                <Link
                  href={`/competitions?sport=${sport.slug}`}
                  className="mt-4 inline-block text-body-sm font-semibold text-primary"
                >
                  Voir les compétitions →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </AuthedPage>
  );
}
