import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import AuthedPage from "@/components/layout/AuthedPage";
import { STATUS_LABELS, teamCode } from "@/components/matches/MatchRow";
import { DjangoError } from "@/lib/django";
import { formatCountdown, formatDateTime, safeTimezone } from "@/lib/datetime";
import {
  getMatch,
  type MatchDetail,
  type MatchEvent,
  type MatchEventType,
} from "@/lib/referential";
import { currentUser } from "@/lib/session";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const STATUS_CLASSES: Record<MatchDetail["status"], string> = {
  SCHEDULED: styles.upcoming,
  LIVE: styles.live,
  FINISHED: styles.finished,
  POSTPONED: styles.postponed,
  SUSPENDED: styles.postponed,
  CANCELLED: styles.cancelled,
};

const EVENT_UI: Record<MatchEventType, { icon: string; label: string; tone: string }> = {
  GOAL: { icon: "sports_soccer", label: "But", tone: styles.iconGoal },
  PENALTY: { icon: "sports_soccer", label: "But sur penalty", tone: styles.iconGoal },
  OWN_GOAL: { icon: "sports_soccer", label: "But contre son camp", tone: styles.iconRed },
  YELLOW_CARD: { icon: "style", label: "Carton jaune", tone: styles.iconYellow },
  RED_CARD: { icon: "style", label: "Carton rouge", tone: styles.iconRed },
  SUBSTITUTION: { icon: "swap_horiz", label: "Remplacement", tone: "" },
  VAR: { icon: "videocam", label: "Décision VAR", tone: "" },
};

const TABS = ["Stats", "H2H", "Cotes", "Analyse", "Prédictions"];

function Icon({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`${styles.icon} ${className}`}>
      {children}
    </span>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();
  const tz = safeTimezone(user?.timezone);

  return (
    <AuthedPage>
      <div className={styles.page}>
        <Suspense key={id} fallback={<MatchSkeleton />}>
          <MatchContent id={id} tz={tz} />
        </Suspense>
      </div>
    </AuthedPage>
  );
}

async function MatchContent({ id, tz }: { id: string; tz: string }) {
  let match: MatchDetail;
  try {
    match = await getMatch(id);
  } catch (error) {
    if (error instanceof DjangoError && error.status === 404) notFound();
    throw error;
  }

  const hasScore = match.score_home !== null && match.score_away !== null;
  const live = match.status === "LIVE";
  const countdown = match.status === "SCHEDULED" ? formatCountdown(match.kickoff_at) : "";

  return (
    <>
      <div className={styles.breadcrumb}>
        <Link className={styles.back} href="/matches">
          <Icon>arrow_back</Icon>
          Matchs
        </Link>
        <span>Football</span>
        <Icon>chevron_right</Icon>
        <span>{match.competition.name}</span>
        {match.round !== null && (
          <>
            <Icon>chevron_right</Icon>
            <span>Journée {match.round}</span>
          </>
        )}
      </div>

      <section className={styles.hero}>
        <div className={styles.heroMeta}>
          <strong>{match.competition.name}</strong>
          <span>Saison {match.season}</span>
          <span>{formatDateTime(match.kickoff_at, tz)}</span>
        </div>

        <div className={styles.scoreRow}>
          <Link href={`/teams/${match.home_team.id}`} className={styles.teamBlock}>
            <div className={styles.crest}>{teamCode(match.home_team)}</div>
            <span className={styles.teamName}>{match.home_team.name}</span>
          </Link>

          <div className={styles.scoreBox}>
            <div className={`${styles.score} ${hasScore ? "" : styles.scoreVs}`}>
              {hasScore ? `${match.score_home} - ${match.score_away}` : "vs"}
            </div>
            <span className={`${styles.status} ${STATUS_CLASSES[match.status]}`}>
              {live && <span className={styles.pulse} />}
              {STATUS_LABELS[match.status]}
            </span>
            {countdown && <span className={styles.countdown}>Coup d&apos;envoi {countdown}</span>}
          </div>

          <Link href={`/teams/${match.away_team.id}`} className={styles.teamBlock}>
            <div className={styles.crest}>{teamCode(match.away_team)}</div>
            <span className={styles.teamName}>{match.away_team.name}</span>
          </Link>
        </div>

        <div className={styles.facts}>
          {match.venue && (
            <span>
              <Icon>stadium</Icon>
              {match.venue.name}
              {match.venue.city ? `, ${match.venue.city}` : ""}
            </span>
          )}
          {match.referee && (
            <span>
              <Icon>sports</Icon>
              Arbitre : {match.referee}
            </span>
          )}
        </div>
      </section>

      {match.status === "POSTPONED" && (
        <div className={styles.notice}>Ce match est reporté. La nouvelle date sera communiquée.</div>
      )}
      {match.status === "CANCELLED" && (
        <div className={styles.notice}>Ce match a été annulé.</div>
      )}
      {match.status === "SUSPENDED" && (
        <div className={styles.notice}>Ce match est actuellement suspendu.</div>
      )}

      <nav className={styles.tabs} aria-label="Sections du match">
        <span className={`${styles.tab} ${styles.tabActive}`} aria-current="page">
          Résumé
        </span>
        {TABS.map((tab) => (
          <span key={tab} className={`${styles.tab} ${styles.tabDisabled}`} aria-disabled="true">
            {tab}
            <small>Bientôt</small>
          </span>
        ))}
      </nav>

      <section className={styles.card}>
        <h2>Chronologie</h2>
        {match.events.length === 0 ? (
          <div className={styles.empty}>
            <Icon>event_note</Icon>
            Aucun événement enregistré.
          </div>
        ) : (
          <Timeline events={match.events} homeId={match.home_team.id} />
        )}
      </section>

      <div className={styles.predictionCard}>
        <Icon>insights</Icon>
        <div>
          <strong>Prédiction</strong>
          Les probabilités et leur incertitude seront disponibles avec le moteur de prédiction (Phase 8).
        </div>
      </div>
    </>
  );
}

function Timeline({ events, homeId }: { events: MatchEvent[]; homeId: string }) {
  return (
    <div className={styles.timeline}>
      <div className={styles.timelineSpine} />
      {events.map((event) => {
        const ui = EVENT_UI[event.type];
        const home = event.team_id === null || event.team_id === homeId;

        return (
          <div className={styles.eventRow} key={event.id}>
            <div className={home ? styles.eventHome : styles.eventAway}>
              <span className={styles.eventPlayer}>{event.player_name || ui.label}</span>
              {event.player_name && <span className={styles.eventKind}>{ui.label}</span>}
            </div>
            <span className={styles.eventNode}>
              <Icon className={ui.tone}>{ui.icon}</Icon>
            </span>
            <span className={styles.minuteLabel}>
              {event.minute}
              {event.extra_minute ? `+${event.extra_minute}` : ""}&apos;
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Chargement du match">
      <div className={styles.skeletonBlock} />
      <div className={styles.skeletonBlock} />
    </div>
  );
}
