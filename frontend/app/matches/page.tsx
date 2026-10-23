import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import AuthedPage from "@/components/layout/AuthedPage";
import { DjangoError } from "@/lib/django";
import MatchRow from "@/components/matches/MatchRow";
import rowStyles from "@/app/dashboard/matchesToday.module.css";
import {
  formatDay,
  isIsoDate,
  localDate,
  safeTimezone,
  shiftDate,
  todayIn,
} from "@/lib/datetime";
import {
  getCompetitions,
  getMatchesPage,
  type Competition,
  type Match,
  type Paginated,
} from "@/lib/referential";
import { currentUser } from "@/lib/session";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25; // doit correspondre a PAGE_SIZE de DRF

const STATUS_FILTERS = [
  { key: "", label: "Tous" },
  { key: "upcoming", label: "À venir", api: "SCHEDULED" },
  { key: "live", label: "En direct", api: "LIVE" },
  { key: "finished", label: "Terminés", api: "FINISHED" },
] as const;

type SearchParams = {
  date?: string;
  competition?: string;
  status?: string;
  page?: string;
};

type Query = { date: string; competition?: string; status?: string; page?: number };

function matchesHref(query: Query, today: string): string {
  const qs = new URLSearchParams();
  if (query.date !== today) qs.set("date", query.date);
  if (query.competition) qs.set("competition", query.competition);
  if (query.status) qs.set("status", query.status);
  if (query.page && query.page > 1) qs.set("page", String(query.page));
  const text = qs.toString();

  return text ? `/matches?${text}` : "/matches";
}

function Icon({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="material-symbols-outlined">
      {children}
    </span>
  );
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await currentUser();
  const tz = safeTimezone(user?.timezone);

  return (
    <AuthedPage>
      <div className={styles.page}>
        <Suspense key={JSON.stringify(params)} fallback={<MatchesSkeleton />}>
          <MatchesContent params={params} tz={tz} />
        </Suspense>
      </div>
    </AuthedPage>
  );
}

async function MatchesContent({ params, tz }: { params: SearchParams; tz: string }) {
  const today = todayIn(tz);
  const date = isIsoDate(params.date) ? params.date : today;
  const competition = params.competition || undefined;
  const statusFilter = STATUS_FILTERS.find((f) => f.key === params.status) ?? STATUS_FILTERS[0];
  const status = statusFilter.key || undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const base: Query = { date, competition, status };
  const href = (changes: Partial<Query>) => matchesHref({ ...base, ...changes, page: undefined, ...(changes.page ? { page: changes.page } : {}) }, today);

  let data: Paginated<Match> | null = null;
  let competitions: Competition[] = [];
  let nextDay: string | null = null;

  try {
    [data, competitions] = await Promise.all([
      getMatchesPage({
        date,
        tz,
        competition,
        status: "api" in statusFilter ? statusFilter.api : undefined,
        page,
      }),
      getCompetitions(),
    ]);

    if (data.count === 0) {
      // Prochain jour avec des matchs (premier match a venir), pour le bouton de l'etat vide.
      const upcoming = await getMatchesPage({ status: "SCHEDULED", tz });
      const first = upcoming.results[0];
      if (first) {
        const day = localDate(first.kickoff_at, tz);
        if (day !== date) nextDay = day;
      }
    }
  } catch (error) {
    if (error instanceof DjangoError) {
      // Page inexistante ou filtre invalide : on repart de la liste du jour.
      if (error.status === 404 && page > 1) redirect(matchesHref({ ...base }, today));
      if (error.status === 400) redirect(matchesHref({ date, status }, today));
    }
    data = null;
  }

  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const matches = data?.results ?? [];
  const countries = new Map(competitions.map((c) => [c.id, c.country?.name ?? ""]));

  // Groupes par competition, dans l'ordre d'apparition (matchs tries par heure).
  const groups = new Map<string, { name: string; items: Match[] }>();
  for (const match of matches) {
    const group = groups.get(match.competition.id) ?? { name: match.competition.name, items: [] };
    group.items.push(match);
    groups.set(match.competition.id, group);
  }

  const days = Array.from({ length: 7 }, (_, i) => shiftDate(date, i - 3));

  return (
    <>
      <div className={styles.heading}>
        <h1>Matchs</h1>
        <p>
          {formatDay(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {data ? ` · ${total} match${total > 1 ? "s" : ""}` : ""} · heures de {tz}
        </p>
      </div>

      <div className={styles.dayBar}>
        <Link className={styles.dayNav} href={href({ date: shiftDate(date, -1) })} aria-label="Jour précédent">
          <Icon>chevron_left</Icon>
        </Link>
        <div className={styles.dayStrip}>
          {days.map((day) => (
            <Link
              key={day}
              href={href({ date: day })}
              aria-current={day === date ? "date" : undefined}
              className={`${styles.dayChip} ${day === date ? styles.dayChipActive : ""} ${day === today ? styles.dayChipToday : ""}`}
            >
              <span>{formatDay(day, { weekday: "short" })}</span>
              <strong>{formatDay(day, { day: "numeric" })}</strong>
            </Link>
          ))}
        </div>
        <Link className={styles.dayNav} href={href({ date: shiftDate(date, 1) })} aria-label="Jour suivant">
          <Icon>chevron_right</Icon>
        </Link>
        <Link className={styles.dayNav} href={href({ date: today })}>
          <span className={styles.label}>Aujourd&apos;hui</span>
          <Icon>today</Icon>
        </Link>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <Link href={href({ competition: undefined })} className={`${styles.pill} ${!competition ? styles.pillActive : ""}`}>
            Toutes les compétitions
          </Link>
          {competitions.map((c) => (
            <Link
              key={c.id}
              href={href({ competition: c.id })}
              className={`${styles.pill} ${competition === c.id ? styles.pillActive : ""}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
      <div className={styles.filters}>
        <span className={styles.filterLabel}>Statut</span>
        <div className={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.key || "all"}
              href={href({ status: f.key || undefined })}
              className={`${styles.pill} ${statusFilter.key === f.key ? styles.pillActive : ""}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {!data ? (
        <div className={`${styles.panel} ${styles.panelError}`}>
          <div className={styles.panelIcon}>
            <Icon>cloud_off</Icon>
          </div>
          <h2>Impossible de charger les matchs</h2>
          <p>Un problème est survenu. Réessaie dans un instant.</p>
          <Link className={styles.button} href={href({ page })}>
            <Icon>refresh</Icon>
            Réessayer
          </Link>
        </div>
      ) : matches.length === 0 ? (
        <div className={styles.panel}>
          <div className={styles.panelIcon}>
            <Icon>event_busy</Icon>
          </div>
          <h2>Aucun match ce jour-là</h2>
          <p>Aucune rencontre ne correspond à ces filtres pour cette date.</p>
          {nextDay && (
            <Link className={styles.button} href={href({ date: nextDay })}>
              <Icon>calendar_month</Icon>
              Voir le prochain jour avec des matchs
            </Link>
          )}
        </div>
      ) : (
        <>
          {[...groups.entries()].map(([id, group]) => (
            <section className={styles.group} key={id}>
              <h2 className={styles.groupTitle}>
                {group.name}
                {countries.get(id) && <span>{countries.get(id)}</span>}
              </h2>
              <div className={rowStyles.matchesList}>
                {group.items.map((match) => (
                  <MatchRow key={match.id} match={match} tz={tz} />
                ))}
              </div>
            </section>
          ))}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div>
                Page <strong>{page}</strong> sur <strong>{totalPages}</strong> · {total} matchs
              </div>
              <div className={styles.paginationControls}>
                {page > 1 ? (
                  <Link href={href({ page: page - 1 })}>
                    <Icon>chevron_left</Icon>Précédent
                  </Link>
                ) : (
                  <span className={styles.disabled}>
                    <Icon>chevron_left</Icon>Précédent
                  </span>
                )}
                {page < totalPages ? (
                  <Link href={href({ page: page + 1 })}>
                    Suivant<Icon>chevron_right</Icon>
                  </Link>
                ) : (
                  <span className={styles.disabled}>
                    Suivant<Icon>chevron_right</Icon>
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function MatchesSkeleton() {
  return (
    <>
      <div className={styles.heading}>
        <h1>Matchs</h1>
      </div>
      <div className={styles.skeleton} aria-label="Chargement des matchs">
        {[1, 2, 3, 4, 5].map((n) => (
          <div className={styles.skeletonRow} key={n} />
        ))}
      </div>
    </>
  );
}
