import Link from "next/link";

import styles from "@/app/dashboard/matchesToday.module.css";
import { formatTime } from "@/lib/datetime";
import type { Match, MatchStatus, MatchTeam } from "@/lib/referential";

/** Code affiche dans le rond : nom court s'il existe, sinon les initiales. */
export function teamCode(team: Pick<MatchTeam, "name" | "short_name">): string {
  if (team.short_name) return team.short_name.slice(0, 4).toUpperCase();

  return team.name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export const STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: "À venir",
  LIVE: "EN DIRECT",
  FINISHED: "Terminé",
  POSTPONED: "Reporté",
  CANCELLED: "Annulé",
  SUSPENDED: "Suspendu",
};

export const STATUS_CLASSES: Record<MatchStatus, string> = {
  SCHEDULED: styles.upcoming,
  LIVE: styles.live,
  FINISHED: styles.finished,
  POSTPONED: styles.postponed,
  CANCELLED: styles.cancelled,
  SUSPENDED: styles.postponed,
};

/** Une ligne de match, partagee par /matches et la section "Matchs du jour" du dashboard. */
export default function MatchRow({ match, tz }: { match: Match; tz: string }) {
  const hasScore = match.score_home !== null && match.score_away !== null;
  const live = match.status === "LIVE";

  return (
    <Link href={`/matches/${match.id}`} className={styles.matchRow}>
      <div className={styles.matchMain}>
        <span className={live ? `${styles.time} ${styles.liveTime}` : styles.time}>
          {formatTime(match.kickoff_at, tz)}
        </span>
        <div className={styles.teams}>
          <div className={styles.team}>
            <span className={styles.teamCode}>{teamCode(match.home_team)}</span>
            <span className={styles.teamName}>{match.home_team.name}</span>
          </div>
          <span className={`${styles.score} ${hasScore ? styles.hasScore : ""}`}>
            {hasScore ? `${match.score_home} - ${match.score_away}` : "vs"}
          </span>
          <div className={styles.team}>
            <span className={styles.teamName}>{match.away_team.name}</span>
            <span className={styles.teamCode}>{teamCode(match.away_team)}</span>
          </div>
        </div>
      </div>
      <div className={styles.matchMeta}>
        <span className={`${styles.status} ${STATUS_CLASSES[match.status]}`}>
          {live && <span className={styles.pulseDot} />}
          {STATUS_LABELS[match.status]}
        </span>
        <span className={styles.competition}>{match.competition.name}</span>
        <span aria-hidden="true" className={`material-symbols-outlined ${styles.chevron}`}>
          chevron_right
        </span>
      </div>
    </Link>
  );
}
