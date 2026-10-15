import Link from "next/link";
import { notFound } from "next/navigation";

import AuthedPage from "@/components/layout/AuthedPage";
import { EmptyState } from "@/components/ui/State";
import { DjangoError } from "@/lib/django";
import { getCompetition, type CompetitionDetail } from "@/lib/referential";

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

      <div className="mt-space-md rounded-2xl border border-outline-variant bg-white">
        <EmptyState
          title="Classement et calendrier"
          message="Ils s'afficheront ici dès que les matchs seront en base (Phase 4)."
        />
      </div>
    </AuthedPage>
  );
}
