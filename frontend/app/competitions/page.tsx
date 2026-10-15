import Link from "next/link";

import AuthedPage from "@/components/layout/AuthedPage";
import { EmptyState, ErrorState } from "@/components/ui/State";
import {
  getCompetitions,
  getCountries,
  type Competition,
  type Country,
} from "@/lib/referential";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ sport?: string; country?: string }>;

function pill(active: boolean) {
  return `rounded-full border px-3 py-1 text-body-sm font-medium ${
    active
      ? "border-primary bg-primary-container text-primary"
      : "border-outline-variant bg-white text-on-surface-variant"
  }`;
}

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { sport, country } = await searchParams;

  let competitions: Competition[] = [];
  let countries: Country[] = [];
  let error: string | null = null;

  try {
    [competitions, countries] = await Promise.all([
      getCompetitions({ sport, country }),
      getCountries(),
    ]);
  } catch {
    error = "Impossible de charger les compétitions. Réessaie dans un instant.";
  }

  const withSport = (code?: string) => {
    const qs = new URLSearchParams();
    if (sport) qs.set("sport", sport);
    if (code) qs.set("country", code);
    const s = qs.toString();
    return s ? `/competitions?${s}` : "/competitions";
  };

  return (
    <AuthedPage>
      <h1 className="text-headline-lg font-bold text-on-surface">Compétitions</h1>

      <div className="mt-4 mb-space-md flex flex-wrap gap-2">
        <Link href={withSport()} className={pill(!country)}>
          Tous les pays
        </Link>
        {countries.map((c) => (
          <Link
            key={c.id}
            href={withSport(c.code)}
            className={pill(country?.toLowerCase() === c.code.toLowerCase())}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {error ? (
        <ErrorState title="Erreur" message={error} />
      ) : competitions.length === 0 ? (
        <EmptyState
          title="Aucune compétition"
          message="Aucune compétition ne correspond à ces filtres."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {competitions.map((c) => (
            <li key={c.id}>
              <Link
                href={`/competitions/${c.id}`}
                className="block rounded-2xl border border-outline-variant bg-white p-5 transition hover:border-primary"
              >
                <h2 className="text-headline-sm font-semibold text-on-surface">{c.name}</h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {c.country?.name ?? "International"} · Niveau {c.tier}
                </p>
                {c.current_season && (
                  <p className="mt-3 text-body-sm font-medium text-primary">
                    Saison {c.current_season.label}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AuthedPage>
  );
}
