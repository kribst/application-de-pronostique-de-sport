import Link from "next/link";
import { notFound } from "next/navigation";

import AuthedPage from "@/components/layout/AuthedPage";
import { EmptyState } from "@/components/ui/State";
import { DjangoError } from "@/lib/django";
import {
  getCompetition,
  getTeams,
  type CompetitionDetail,
  type Team,
} from "@/lib/referential";

export const dynamic = "force-dynamic";

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let competition: CompetitionDetail;
  try {
    competition = await getCompetition(id);
  } catch (error) {
    if (error instanceof DjangoError && error.status === 404) notFound();
    throw error;
  }

  let teams: Team[] = [];
  try {
    teams = await getTeams({ competition: competition.id });
  } catch {
    // La page reste utilisable si la liste des equipes est indisponible.
  }

  return (
    <AuthedPage>
      <Link href="/competitions" className="text-body-sm font-semibold text-primary">
        ← Compétitions
      </Link>
      <h1 className="mt-2 text-headline-lg font-bold text-on-surface">{competition.name}</h1>
      <p className="mt-1 text-body-md text-on-surface-variant">
        {competition.country?.name ?? "International"} · Niveau {competition.tier}
      </p>

      <h2 className="mt-space-md mb-3 text-headline-sm font-semibold">Saisons</h2>
      <ul className="flex flex-wrap gap-2">
        {competition.seasons.map((s) => (
          <li
            key={s.id}
            className={`rounded-full border px-3 py-1 text-body-sm ${
              s.is_current
                ? "border-primary bg-primary-container text-primary"
                : "border-outline-variant bg-white text-on-surface-variant"
            }`}
          >
            {s.label}
            {s.is_current && " · en cours"}
          </li>
        ))}
      </ul>

      <h2 className="mt-space-md mb-3 text-headline-sm font-semibold">Équipes</h2>
      {teams.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">Aucune équipe pour cette saison.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="block rounded-xl border border-outline-variant bg-white px-4 py-3 text-body-md font-medium text-on-surface hover:border-primary"
              >
                {team.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-space-md rounded-2xl border border-outline-variant bg-white">
        <EmptyState
          title="Classement et calendrier"
          message="Ils s'afficheront ici dès que les matchs seront en base (Phase 4)."
        />
      </div>
    </AuthedPage>
  );
}
