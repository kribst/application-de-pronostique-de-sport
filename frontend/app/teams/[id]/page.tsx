import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import AuthedPage from "@/components/layout/AuthedPage";
import { DjangoError } from "@/lib/django";
import { getTeam, type TeamDetail } from "@/lib/referential";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const SPORT_LABELS: Record<string, string> = { football: "Football" };

function Icon({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className={styles.icon}>
      {children}
    </span>
  );
}

function initials(name: string, shortName: string): string {
  if (shortName) return shortName.slice(0, 4).toUpperCase();

  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AuthedPage>
      <div className={styles.page}>
        <Suspense key={id} fallback={<TeamSkeleton />}>
          <TeamContent id={id} />
        </Suspense>
      </div>
    </AuthedPage>
  );
}

async function TeamContent({ id }: { id: string }) {
  let team: TeamDetail;
  try {
    team = await getTeam(id);
  } catch (error) {
    if (error instanceof DjangoError && error.status === 404) notFound();
    throw error;
  }

  const code = initials(team.name, team.short_name);
  const current = team.participations.filter((p) => p.season.is_current);
  const mainCompetition = current[0]?.competition.name;

  const facts = [
    team.country && { icon: "public", text: team.country.name },
    team.founded_year && { icon: "calendar_today", text: `Fondée en ${team.founded_year}` },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <>
      <section className={styles.breadcrumbRow}>
        <div className={styles.breadcrumbLeft}>
          <Link className={styles.backButton} href="/teams">
            <Icon>arrow_back</Icon>
            Équipes
          </Link>
          <div className={styles.breadcrumb}>
            {SPORT_LABELS[team.sport] ?? team.sport}
            {mainCompetition && (
              <>
                <Icon>chevron_right</Icon>
                {mainCompetition}
              </>
            )}
            <Icon>chevron_right</Icon>
            <strong>{team.name}</strong>
          </div>
        </div>
      </section>

      <div className={styles.teamState}>
        <section className={styles.teamHero}>
          <div className={styles.crest}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="currentColor"
                strokeDasharray="3 3"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="50" cy="50" r="38" stroke="currentColor" fill="none" />
              <path d="M50 4v8 M50 88v8 M4 50h8 M88 50h8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <strong>{code}</strong>
          </div>

          <div className={styles.teamDetails}>
            <div className={styles.teamTitleRow}>
              <h1>{team.name}</h1>
            </div>

            {facts.length > 0 && (
              <div className={styles.teamFacts}>
                {facts.map((fact, index) => (
                  <span key={fact.text} style={{ display: "contents" }}>
                    {index > 0 && <i />}
                    <span>
                      <Icon>{fact.icon}</Icon>
                      {fact.text}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {team.venue ? (
              <div className={styles.stadium}>
                <Icon>stadium</Icon>
                <strong>
                  {team.venue.name}
                  {team.venue.city ? `, ${team.venue.city}` : ""}
                </strong>
                {team.venue.capacity ? (
                  <>
                    <span>·</span>
                    <span>{team.venue.capacity.toLocaleString("fr-FR")} places</span>
                  </>
                ) : null}
              </div>
            ) : (
              <div className={styles.infoBox}>
                <Icon>info</Icon>
                Aucun stade enregistré pour cette équipe.
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Compétitions</h2>
            <p>Engagements pour la saison en cours et archives.</p>
          </div>
          {team.participations.length > 0 ? (
            <div className={styles.competitionList}>
              {team.participations.map((p) => (
                <Link
                  key={`${p.competition.id}-${p.season.id}`}
                  href={`/competitions/${p.competition.id}`}
                  className={p.season.is_current ? styles.competitionActive : styles.competition}
                >
                  <Icon>{p.season.is_current ? "emoji_events" : "history"}</Icon>
                  {p.competition.name} · {p.season.label}
                  {p.season.is_current && <Icon>check_circle</Icon>}
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.pendingIcon}>
                <Icon>sports_soccer</Icon>
              </div>
              <h2>Aucune compétition pour cette saison.</h2>
              <p>Cette équipe n&apos;est engagée dans aucune compétition enregistrée.</p>
              <Link className={styles.primaryButton} href="/competitions">
                <Icon>trophy</Icon>
                Voir les compétitions
              </Link>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Effectif et forme</h2>
            <p>Disponibles avec l&apos;arrivée des joueurs et des matchs.</p>
          </div>
          <div className={styles.pendingPanel}>
            <div className={styles.pendingIcon}>
              <Icon>groups</Icon>
            </div>
            <h3>Effectif et forme</h3>
            <p>Ils s&apos;afficheront ici avec les joueurs et les matchs (phases suivantes).</p>
          </div>
          <div className={styles.statsGrid}>
            {[
              { icon: "insights", title: "Forme sur 5 matchs" },
              { icon: "event", title: "Prochain match" },
              { icon: "format_list_numbered", title: "Classement" },
            ].map((card) => (
              <article className={styles.statCard} key={card.title}>
                <div className={styles.statHeading}>
                  <strong>
                    <Icon>{card.icon}</Icon>
                    {card.title}
                  </strong>
                  <span>Bientôt</span>
                </div>
                <p className={styles.statValue}>—</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function TeamSkeleton() {
  return (
    <section className={styles.skeletonState} aria-label="Chargement en cours">
      <div className={styles.skeletonHero}>
        <span />
        <div>
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className={styles.skeletonButtons}>
        <i />
        <i />
      </div>
      <div className={styles.skeletonBlock} />
    </section>
  );
}
