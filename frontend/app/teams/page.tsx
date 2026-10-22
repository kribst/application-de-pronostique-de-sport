import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import AuthedPage from "@/components/layout/AuthedPage";
import { DjangoError } from "@/lib/django";
import {
  getCompetitions,
  getTeamsPage,
  type Competition,
  type Paginated,
  type Team,
} from "@/lib/referential";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25; // doit correspondre a PAGE_SIZE de DRF

type SearchParams = {
  competition?: string;
  search?: string;
  page?: string;
};

function Icon({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
      {children}
    </span>
  );
}

/** Code affiche dans le rond : nom court s'il existe, sinon les initiales. */
function initials(team: Team): string {
  if (team.short_name) return team.short_name.slice(0, 4).toUpperCase();

  return team.name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function teamsHref(params: { competition?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params.competition) qs.set("competition", params.competition);
  if (params.search) qs.set("search", params.search);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const text = qs.toString();

  return text ? `/teams?${text}` : "/teams";
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <AuthedPage>
      <div className={styles.page}>
        <Suspense key={JSON.stringify(params)} fallback={<TeamsSkeleton />}>
          <TeamsContent params={params} />
        </Suspense>
      </div>
    </AuthedPage>
  );
}

async function TeamsContent({ params }: { params: SearchParams }) {
  const competition = params.competition || undefined;
  const search = params.search?.trim() || undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  let data: Paginated<Team> | null = null;
  let competitions: Competition[] = [];

  try {
    [data, competitions] = await Promise.all([
      getTeamsPage({ competition, search, page }),
      getCompetitions(),
    ]);
  } catch (error) {
    if (error instanceof DjangoError) {
      // Page inexistante ou filtre invalide : on repart de la premiere page.
      if (error.status === 404 && page > 1) redirect(teamsHref({ competition, search }));
      if (error.status === 400) redirect(teamsHref({ search }));
    }
  }

  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const teams = data?.results ?? [];

  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <h1>Équipes</h1>
          <p>
            {data
              ? `${total} équipe${total > 1 ? "s" : ""} de football indexée${total > 1 ? "s" : ""} pour la modélisation des probabilités.`
              : "Équipes de football."}
          </p>
        </div>
        {data && (
          <div className={styles.indexBadge}>
            <span />
            Index football : {total} {total > 1 ? "équipes" : "équipe"}
          </div>
        )}
      </div>

      <form action="/teams" method="get" className={styles.searchPanel}>
        {competition && <input type="hidden" name="competition" value={competition} />}
        <div className={styles.searchInputWrap}>
          <Icon>search</Icon>
          <input
            aria-label="Rechercher une équipe"
            defaultValue={search ?? ""}
            name="search"
            placeholder="Rechercher une équipe (nom)..."
            type="search"
          />
        </div>
        <button className={styles.searchButton} type="submit">
          <Icon>search</Icon>
          Rechercher
        </button>
      </form>

      <div className={styles.filterRow}>
        <Link
          href={teamsHref({ search })}
          className={`${styles.leaguePill} ${!competition ? styles.leaguePillActive : ""}`}
        >
          <span>Toutes</span>
        </Link>
        {competitions.map((item) => (
          <Link
            key={item.id}
            href={teamsHref({ competition: item.id, search })}
            className={`${styles.leaguePill} ${
              competition === item.id ? styles.leaguePillActive : ""
            }`}
          >
            {item.slug === "champions-league" && <Icon>stars</Icon>}
            {item.slug === "europa-league" && <Icon>shield</Icon>}
            <span>{item.name}</span>
          </Link>
        ))}
      </div>

      {!data ? (
        <div className={styles.errorPanel}>
          <div className={styles.errorIcon}>
            <Icon>cloud_off</Icon>
          </div>
          <div className={styles.errorText}>
            <h2>Erreur réseau</h2>
            <p>Impossible de charger les équipes. Réessaie dans un instant.</p>
          </div>
          <Link href={teamsHref({ competition, search, page })}>
            <Icon>refresh</Icon>
            Réessayer
          </Link>
        </div>
      ) : teams.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icon>search_off</Icon>
          </div>
          <h2>Aucune équipe</h2>
          <p>Aucune équipe ne correspond à ces filtres.</p>
          <Link href="/teams">
            <Icon>filter_alt_off</Icon>
            Réinitialiser les filtres
          </Link>
        </div>
      ) : (
        <section className={styles.teamSection}>
          <div className={styles.teamGrid}>
            {teams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`} className={styles.teamCard}>
                <div className={styles.teamCardTop}>
                  <div className={styles.teamCode}>{initials(team)}</div>
                  {team.league && <span className={styles.leagueTag}>{team.league}</span>}
                </div>
                <div className={styles.teamDetails}>
                  <h2>{team.name}</h2>
                  <p>{team.country?.name ?? "International"}</p>
                </div>
                <div className={styles.stadium}>
                  <Icon>stadium</Icon>
                  <span>{team.stadium || "Stade non renseigné"}</span>
                  <Icon className={styles.arrowIcon}>arrow_forward</Icon>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.pagination}>
            <div>
              <span className={styles.statusDot} />
              Page <strong>{page}</strong> sur <strong>{totalPages}</strong> ({teams.length}{" "}
              affichée{teams.length > 1 ? "s" : ""} sur {total})
            </div>
            <div className={styles.paginationControls}>
              {page > 1 ? (
                <Link href={teamsHref({ competition, search, page: page - 1 })}>
                  <Icon>chevron_left</Icon>
                  Précédent
                </Link>
              ) : (
                <span className={styles.pageDisabled}>
                  <Icon>chevron_left</Icon>
                  Précédent
                </span>
              )}
              {totalPages <= 7 &&
                Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={teamsHref({ competition, search, page: n })}
                    aria-current={n === page ? "page" : undefined}
                    className={n === page ? styles.pageActive : ""}
                  >
                    {n}
                  </Link>
                ))}
              {page < totalPages ? (
                <Link
                  className={styles.nextButton}
                  href={teamsHref({ competition, search, page: page + 1 })}
                >
                  Suivant
                  <Icon>chevron_right</Icon>
                </Link>
              ) : (
                <span className={styles.pageDisabled}>
                  Suivant
                  <Icon>chevron_right</Icon>
                </span>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function TeamsSkeleton() {
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <h1>Équipes</h1>
        </div>
      </div>
      <div className={styles.loadingView}>
        <div className={styles.loadingNotice}>
          <span className={styles.statusDot} />
          Chargement des équipes en cours...
        </div>
        <div className={styles.teamGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div className={styles.skeletonCard} key={n}>
              <div className={styles.skeletonTop}>
                <span />
                <span />
              </div>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonShort} />
              <div className={styles.skeletonBottom} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
