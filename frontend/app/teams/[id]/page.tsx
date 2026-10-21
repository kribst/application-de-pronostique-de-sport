 "use client";

import { useState } from "react";
import styles from "./page.module.css";

type TeamState = "nominal" | "nostadium" | "noleagues" | "error" | "skeleton";

const states: { id: TeamState; label: string }[] = [
  { id: "nominal", label: "1. Nominale (PSG)" },
  { id: "nostadium", label: "2. Sans stade" },
  { id: "noleagues", label: "3. Sans compétition" },
  { id: "error", label: "4. Erreur 404" },
  { id: "skeleton", label: "5. Skeleton" },
];

function Icon({ children, className = "" }: { children: string; className?: string }) {
  return <span aria-hidden="true" className={`${styles.icon} ${className}`}>{children}</span>;
}

export default function TeamsPage() {
  const [activeState, setActiveState] = useState<TeamState>("nominal");

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brand}>
            <div className={styles.brandIcon}><Icon>query_stats</Icon></div>
            <div className={styles.brandText}>
              <strong>Pronostique</strong>
              <span>QUANT ENGINE</span>
            </div>
            <span className={styles.version}>v2.4</span>
          </div>

          <div className={styles.navigation}>
            <p className={styles.navHeading}>Analyse &amp; Modélisation</p>
            <nav>
              <a href="#"><Icon>grid_view</Icon>Dashboard</a>
              <a href="#"><Icon>sports_soccer</Icon>Sports</a>
              <a href="#"><Icon>trophy</Icon>Compétitions</a>
              <a href="#" className={styles.navActive}><Icon>groups</Icon>Équipes</a>
              <a href="#" className={styles.navWithBadge}><span><Icon>trending_up</Icon>Value bets</span><b><Icon>lock</Icon> PRO</b></a>
              <a href="#"><Icon>alt_route</Icon>Combinaisons</a>
              <a href="#"><Icon>adjust</Icon>Cote cible</a>
              <a href="#"><Icon>history</Icon>Historique</a>
            </nav>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.apiStatus}>
            <div className={styles.apiTitle}>Flux API Quant <span className={styles.statusDot} /></div>
            <span>Latence: 42ms · Synchronisé</span>
          </div>
          <div className={styles.copyright}>© 2024 Quant Engine <Icon>terminal</Icon></div>
        </div>
      </aside>

      <div className={styles.contentShell}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.sports}>
              <button className={styles.sportActive}><Icon>sports_soccer</Icon>Football</button>
              <button disabled className={styles.sportDisabled}><Icon>sports_basketball</Icon>Basketball <small>Bientôt</small></button>
              <button disabled className={styles.sportDisabled}><Icon>sports_tennis</Icon>Tennis <small>Bientôt</small></button>
              <button disabled className={styles.sportDisabled}><Icon>sports_volleyball</Icon>Volleyball <small>Bientôt</small></button>
            </div>
            <div className={styles.userActions}>
              <button className={styles.premium}><Icon>workspace_premium</Icon>Passer Premium</button>
              <div className={styles.user}>
                <div className={styles.avatar}>TM</div>
                <div className={styles.userInfo}><strong>Thomas Moreau</strong><span>Analyste Free</span></div>
              </div>
              <button className={styles.iconButton} title="Déconnexion" type="button"><Icon>logout</Icon></button>
            </div>
          </div>
          <div className={styles.warning}><Icon>warning</Icon>Les pronostics sont des probabilités, jamais des certitudes. 18+ · Jouez de façon responsable.</div>
        </header>

        <main className={styles.main}>
          <section className={styles.breadcrumbRow}>
            <div className={styles.breadcrumbLeft}>
              <a className={styles.backButton} href="#"><Icon>arrow_back</Icon>Équipes</a>
              <div className={styles.breadcrumb}>Référentiel <Icon>chevron_right</Icon> Football <Icon>chevron_right</Icon> Ligue 1 <Icon>chevron_right</Icon> <strong>Paris Saint-Germain</strong></div>
            </div>
            <div className={styles.metaBadges}>
              <span className={styles.idBadge}><Icon>database</Icon>ID: PSG-L1-FR</span>
              <span className={styles.syncBadge}><Icon>verified</Icon>Pipeline synchronisé</span>
            </div>
          </section>

          {activeState === "nominal" && (
            <div className={styles.teamState}>
              <section className={styles.teamHero}>
                <div className={styles.crest}>
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1.5" fill="none" />
                    <circle cx="50" cy="50" r="38" stroke="currentColor" fill="none" />
                    <path d="M50 4v8 M50 88v8 M4 50h8 M88 50h8" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <strong>PSG</strong>
                </div>
                <div className={styles.teamDetails}>
                  <div className={styles.teamTitleRow}>
                    <h1>Paris Saint-Germain</h1>
                    <span className={styles.activeBadge}><i />Franchise active · Indexée v2.4</span>
                  </div>
                  <div className={styles.teamFacts}>
                    <span><Icon>public</Icon>France</span><i />
                    <span><Icon>calendar_today</Icon>Fondée en 1970</span><i />
                    <span><Icon>tag</Icon>Code LFP : PSG</span>
                  </div>
                  <div className={styles.stadium}><Icon>stadium</Icon><strong>Parc des Princes, Paris</strong><span>·</span><span>47 929 places</span><span>·</span><span>Pelouse hybride</span></div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeading}><h2>Compétitions</h2><p>Engagements pour la saison en cours et archives officielles.</p></div>
                <div className={styles.competitionList}>
                  <button className={styles.competitionActive}><Icon>emoji_events</Icon>Ligue 1 · 2026/2027<Icon>check_circle</Icon></button>
                  <button className={styles.competitionActive}><Icon>military_tech</Icon>Ligue des champions · 2026/2027<Icon>check_circle</Icon></button>
                  <button className={styles.competition}><Icon>history</Icon>Ligue 1 · 2025/2026</button>
                  <button className={styles.competition}><Icon>history</Icon>Ligue des champions · 2025/2026</button>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionTitleRow}>
                  <div className={styles.sectionHeading}><h2>Effectif et forme</h2><p>Modèles prédictifs quantitatifs en cours d'intégration.</p></div>
                  <span className={styles.pipeline}><Icon>tune</Icon>Pipeline v2</span>
                </div>
                <div className={styles.pendingPanel}>
                  <div className={styles.pendingIcon}><Icon>groups</Icon></div>
                  <h3>Effectif et forme</h3>
                  <p>Ils s'afficheront ici avec les joueurs et les matchs (phases suivantes).</p>
                  <span className={styles.pendingTag}><Icon>sync_problem</Icon>En attente de l'activation des pipelines sync_players et sync_injuries (Phase V2).</span>
                </div>
                <div className={styles.statsGrid}>
                  <article className={styles.statCard}>
                    <div className={styles.statHeading}><strong><Icon>insights</Icon>Forme sur 5 matchs</strong><span>Bientôt</span></div>
                    <div className={styles.formStats}><div className={styles.formResults}>{["V", "V", "N", "V", "D"].map((result, i) => <span key={`${result}-${i}`}>{result}</span>)}</div><div className={styles.xg}><small>xG Diff</small><strong>+1.42</strong></div></div>
                    <div className={styles.progress}><span /></div>
                  </article>
                  <article className={styles.statCard}>
                    <div className={styles.statHeading}><strong><Icon>event</Icon>Prochain match</strong><span>Bientôt</span></div>
                    <div className={styles.nextMatch}><strong><i>PSG</i> vs <i>OM</i></strong><span>Dim. 20:45</span></div>
                    <p className={styles.statFoot}><Icon>location_on</Icon>Parc des Princes · J28 Ligue 1</p>
                  </article>
                  <article className={styles.statCard}>
                    <div className={styles.statHeading}><strong><Icon>format_list_numbered</Icon>Classement</strong><span>Bientôt</span></div>
                    <div className={styles.rank}><div><strong>1<sup>er</sup></strong><span>Ligue 1</span></div><span>62 pts　·　+38 DB</span></div>
                    <p className={styles.statFoot}><Icon>arrow_drop_up</Icon>Maintien du rang depuis 14 journées</p>
                  </article>
                </div>
              </section>
            </div>
          )}

          {activeState === "nostadium" && (
            <section className={styles.alternateCard}>
              <div className={styles.smallCrest}>FCS</div>
              <div><div className={styles.teamTitleRow}><h1>FC Saint-Denis</h1><span className={styles.neutralBadge}>Division Régionale</span></div>
                <p>France · Fondée en 1982 · Code FFF : 520441</p>
                <div className={styles.infoBox}><Icon>info</Icon>Aucun stade propriétaire enregistré dans le référentiel quantitatif. Rencontres disputées sur installations municipales neutres.</div>
              </div>
            </section>
          )}

          {activeState === "noleagues" && (
            <section className={styles.emptyState}><div className={styles.pendingIcon}><Icon>sports_soccer</Icon></div><h2>Aucune compétition pour cette saison.</h2><p>Ce club n'est actuellement engagé dans aucun championnat ou tournoi officiel synchronisé pour le cycle 2026/2027.</p><button className={styles.primaryButton}><Icon>history</Icon>Consulter l'archive des saisons antérieures</button></section>
          )}

          {activeState === "error" && (
            <section className={styles.emptyState}><div className={styles.errorIcon}><Icon>error_outline</Icon></div><h2>Équipe introuvable</h2><p>L'identifiant d'équipe demandé n'existe pas ou a été archivé du catalogue de modélisation prédictive.</p><a className={styles.primaryButton} href="#"><Icon>arrow_back</Icon>Retour aux équipes</a></section>
          )}

          {activeState === "skeleton" && (
            <section className={styles.skeletonState} aria-label="Chargement en cours"><div className={styles.skeletonHero}><span /><div><i /><i /><i /></div></div><div className={styles.skeletonButtons}><i /><i /></div><div className={styles.skeletonBlock} /></section>
          )}

          <footer className={styles.inspector}>
            <div className={styles.inspectorTitle}><Icon>tune</Icon><strong>Inspecteur d'états UI (Cahier des charges)</strong></div>
            <div className={styles.stateButtons}>
              {states.map((state) => <button key={state.id} type="button" onClick={() => setActiveState(state.id)} className={activeState === state.id ? styles.stateButtonActive : styles.stateButton}>{state.label}</button>)}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
