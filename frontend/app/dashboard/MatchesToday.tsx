import Link from "next/link";

import MatchRow from "@/components/matches/MatchRow";
import type { Match } from "@/lib/referential";

import styles from "./matchesToday.module.css";

const MAX_ROWS = 6;

/**
 * Section "Matchs du jour" du dashboard (design Stitch), alimentee par l'API.
 * `matches` vaut null quand le chargement a echoue.
 */
export default function MatchesToday({
  matches,
  total,
  tz,
}: {
  matches: Match[] | null;
  total: number;
  tz: string;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headingGroup}>
          <div className={styles.headingIcon}>
            <span aria-hidden="true" className="material-symbols-outlined">
              sports_soccer
            </span>
          </div>
          <div>
            <h2 className={styles.title}>Matchs du jour</h2>
            <p className={styles.subtitle}>
              {matches
                ? `${total} match${total > 1 ? "s" : ""} aujourd'hui · heures de ${tz}`
                : "Calendrier et suivi en direct des rencontres"}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.viewAll} href="/matches">
            <span>Voir tout</span>
            <span aria-hidden="true" className="material-symbols-outlined">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>

      {matches === null ? (
        <div className={styles.matchesList}>
          <p className={styles.errorState}>
            Impossible de charger les matchs du jour. Recharge la page dans un instant.
          </p>
        </div>
      ) : matches.length === 0 ? (
        <div className={`${styles.matchesList} ${styles.emptyState}`}>
          <div aria-hidden="true" className={`material-symbols-outlined ${styles.emptyIcon}`}>
            event_busy
          </div>
          <div className={styles.emptyCopy}>
            <h3>Aucun match aujourd&apos;hui</h3>
            <p>Aucune rencontre n&apos;est programmée aujourd&apos;hui. Consulte le calendrier complet.</p>
          </div>
          <Link className={styles.calendarButton} href="/matches">
            Voir le calendrier complet
          </Link>
        </div>
      ) : (
        <div className={styles.matchesList}>
          {matches.slice(0, MAX_ROWS).map((match) => (
            <MatchRow key={match.id} match={match} tz={tz} />
          ))}
        </div>
      )}
    </section>
  );
}
