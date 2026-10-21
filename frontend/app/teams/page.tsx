"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type Team = {
  code: string;
  name: string;
  country: string;
  league: string;
  stadium: string;
};

const teams: Team[] = [
  { code: "PSG", name: "Paris Saint-Germain", country: "France", league: "Ligue 1", stadium: "Parc des Princes" },
  { code: "RMA", name: "Real Madrid", country: "Espagne", league: "La Liga", stadium: "Santiago Bernabéu" },
  { code: "FCB", name: "FC Barcelone", country: "Espagne", league: "La Liga", stadium: "Spotify Camp Nou" },
  { code: "MCI", name: "Manchester City", country: "Angleterre", league: "Premier League", stadium: "Etihad Stadium" },
  { code: "BAY", name: "Bayern Munich", country: "Allemagne", league: "Bundesliga", stadium: "Allianz Arena" },
  { code: "INT", name: "Inter Milan", country: "Italie", league: "Serie A", stadium: "Giuseppe Meazza" },
  { code: "ARS", name: "Arsenal", country: "Angleterre", league: "Premier League", stadium: "Emirates Stadium" },
  { code: "LIV", name: "Liverpool", country: "Angleterre", league: "Premier League", stadium: "Anfield" },
  { code: "JUV", name: "Juventus", country: "Italie", league: "Serie A", stadium: "Allianz Stadium" },
  { code: "OM", name: "Olympique de Marseille", country: "France", league: "Ligue 1", stadium: "Orange Vélodrome" },
  { code: "ATM", name: "Atlético de Madrid", country: "Espagne", league: "La Liga", stadium: "Cívitas Metropolitano" },
  { code: "BVB", name: "Borussia Dortmund", country: "Allemagne", league: "Bundesliga", stadium: "Signal Iduna Park" },
];

const leagueFilters = [
  { label: "Toutes", value: "all", count: "12/40" },
  { label: "Premier League", value: "Premier League", count: "3" },
  { label: "La Liga", value: "La Liga", count: "3" },
  { label: "Ligue 1", value: "Ligue 1", count: "2" },
  { label: "Bundesliga", value: "Bundesliga", count: "2" },
  { label: "Serie A", value: "Serie A", count: "2" },
  { label: "Ligue des champions", value: "Ligue des champions" },
  { label: "Ligue Europa", value: "Ligue Europa" },
];

type ViewState = "grid" | "loading" | "empty" | "error";

const navItems = [
  ["grid_view", "Dashboard"],
  ["sports_soccer", "Sports"],
  ["trophy", "Compétitions"],
  ["groups", "Équipes"],
  ["trending_up", "Value bets"],
  ["alt_route", "Combinaisons"],
  ["adjust", "Cote cible"],
  ["history", "Historique"],
];

function Icon({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>;
}

export default function TeamsPage() {
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState("all");
  const [view, setView] = useState<ViewState>("grid");
  const [page, setPage] = useState(1);
  const [retrying, setRetrying] = useState(false);

  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    return teams.filter((team) => {
      const matchesLeague = league === "all" || team.league.toLocaleLowerCase("fr") === league.toLocaleLowerCase("fr");
      const searchable = `${team.name} ${team.code} ${team.country} ${team.stadium}`.toLocaleLowerCase("fr");
      return matchesLeague && (!normalized || searchable.includes(normalized));
    });
  }, [query, league]);

  function selectLeague(value: string) {
    setLeague(value);
    setPage(1);
    setView("grid");
  }

  function resetFilters() {
    setQuery("");
    setLeague("all");
    setPage(1);
    setView("grid");
  }

  function retryFetch() {
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      setView("grid");
    }, 700);
  }

  const visibleTeams = page === 1 ? filteredTeams : [];

  return (
    <div className={styles.appShell}>
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
          <div className={styles.navSection}>
            <div className={styles.sectionLabel}>Analyse &amp; Modélisation</div>
            <nav className={styles.navigation}>
              {navItems.map(([icon, label]) => (
                <a key={label} href="#" className={`${styles.navLink} ${label === "Équipes" ? styles.navActive : ""}`}>
                  <Icon>{icon}</Icon><span>{label}</span>
                  {label === "Value bets" && <span className={styles.proBadge}><Icon>lock</Icon> PRO</span>}
                </a>
              ))}
            </nav>
          </div>
        </div>
        <div className={styles.sidebarFooter}>
          <div className={styles.apiStatus}>
            <div className={styles.apiStatusTitle}><span>Flux API Quant</span><span className={styles.statusDot} /></div>
            <code>Latence: 42ms · Synchronisé</code>
          </div>
          <div className={styles.copyright}><span>© 2024 Quant Engine</span><Icon>terminal</Icon></div>
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topHeader}>
          <div className={styles.headerMain}>
            <div className={styles.sportSelector}>
              <button className={styles.sportActive}><Icon>sports_soccer</Icon>Football</button>
              <button className={styles.sportDisabled} disabled><Icon>sports_basketball</Icon>Basketball <small>Bientôt</small></button>
              <button className={styles.sportDisabled} disabled><Icon>sports_tennis</Icon>Tennis <small>Bientôt</small></button>
              <button className={styles.sportDisabled} disabled><Icon>sports_volleyball</Icon>Volleyball <small>Bientôt</small></button>
            </div>
            <div className={styles.userActions}>
              <button className={styles.premiumButton}><Icon>workspace_premium</Icon>Passer Premium</button>
              <span className={styles.headerDivider} />
              <div className={styles.userInfo}><span className={styles.avatar}>TM</span><span><strong>Thomas Moreau</strong><small>Analyste Free</small></span></div>
              <button className={styles.iconButton} title="Déconnexion"><Icon>logout</Icon></button>
            </div>
          </div>
          <div className={styles.warningBanner}><Icon>warning</Icon>Les pronostics sont des probabilités, jamais des certitudes. 18+ · Jouez de façon responsable.</div>
        </header>

        <main className={styles.content}>
          <div className={styles.pageHeading}>
            <div><h1>Équipes</h1><p>40 équipes de football indexées pour modélisation des probabilités et expectatives de jeu.</p></div>
            <div className={styles.indexBadge}><span />Index football : 40 franchises</div>
          </div>

          <form className={styles.searchPanel} onSubmit={(event) => { event.preventDefault(); setView(filteredTeams.length ? "grid" : "empty"); }}>
            <div className={styles.searchInputWrap}><Icon>search</Icon><input aria-label="Rechercher une équipe" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setView("grid"); }} placeholder="Rechercher une équipe (nom, pays, stade, code)..." type="search" /></div>
            <button className={styles.searchButton} type="submit"><Icon>search</Icon>Rechercher</button>
          </form>

          <div className={styles.filterRow}>
            {leagueFilters.map((item) => (
              <button key={item.value} type="button" onClick={() => selectLeague(item.value)} className={`${styles.leaguePill} ${league === item.value ? styles.leaguePillActive : ""}`}>
                {item.value === "Ligue des champions" && <Icon>stars</Icon>}
                {item.value === "Ligue Europa" && <Icon>shield</Icon>}
                <span>{item.label}</span>{item.count && <small>{item.count}</small>}
              </button>
            ))}
          </div>

          <div className={styles.stateTabs}>
            <div className={styles.tabsList}>
              <button className={view === "grid" ? styles.tabActive : ""} onClick={() => setView("grid")} type="button">Grille active (12 équipes)</button>
              <button className={view === "loading" ? styles.tabActive : ""} onClick={() => setView("loading")} type="button">État Chargement (Skeleton)</button>
              <button className={view === "empty" ? styles.tabActive : ""} onClick={() => setView("empty")} type="button">État Aucun résultat</button>
              <button className={view === "error" ? styles.tabActive : ""} onClick={() => setView("error")} type="button">État Erreur réseau</button>
            </div>
            <span className={styles.demoLabel}>Démonstrateur d'états UI</span>
          </div>

          {view === "grid" && (
            <section className={styles.teamSection}>
              {visibleTeams.length ? (
                <div className={styles.teamGrid}>
                  {visibleTeams.map((team) => (
                    <article key={team.code} className={styles.teamCard}>
                      <div className={styles.teamCardTop}>
                        <div className={styles.teamCode}>{team.code}</div>
                        <span className={styles.leagueTag}>{team.league}</span>
                      </div>
                      <div className={styles.teamDetails}><h2>{team.name}</h2><p>{team.country}</p></div>
                      <div className={styles.stadium}><Icon>stadium</Icon><span>{team.stadium}</span><Icon className={styles.arrowIcon}>arrow_forward</Icon></div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState onReset={resetFilters} />
              )}
              <div className={styles.pagination}>
                <div><span className={styles.statusDot} />Page <strong>{page}</strong> sur <strong>2</strong> ({visibleTeams.length} affichées sur 40 clubs)</div>
                <div className={styles.paginationControls}>
                  <button disabled={page === 1} onClick={() => setPage(1)} type="button"><Icon>chevron_left</Icon>Précédent</button>
                  <button className={page === 1 ? styles.pageActive : ""} onClick={() => setPage(1)} type="button">1</button>
                  <button className={page === 2 ? styles.pageActive : ""} onClick={() => setPage(2)} type="button">2</button>
                  <button className={styles.nextButton} onClick={() => setPage(2)} type="button">Suivant<Icon>chevron_right</Icon></button>
                </div>
              </div>
            </section>
          )}

          {view === "loading" && <div className={styles.loadingView}><div className={styles.loadingNotice}><span className={styles.statusDot} />Chargement des équipes en cours...<code>API /v2/teams • 200 Pending</code></div><div className={styles.teamGrid}>{[1, 2, 3, 4].map((n) => <div className={styles.skeletonCard} key={n}><div className={styles.skeletonTop}><span /><span /></div><div className={styles.skeletonLine} /><div className={styles.skeletonShort} /><div className={styles.skeletonBottom} /></div>)}</div></div>}

          {view === "empty" && <EmptyState onReset={resetFilters} />}

          {view === "error" && <div className={styles.errorPanel}><div className={styles.errorIcon}><Icon>cloud_off</Icon></div><div className={styles.errorText}><h2>Erreur réseau</h2><p>Impossible de charger les équipes. Réessaie dans un instant.</p><code>Code erreur : API_TIMEOUT (42ms timeout exceeded)</code></div><button onClick={retryFetch} type="button"><Icon className={retrying ? styles.spinning : ""}>refresh</Icon>Réessayer</button></div>}
        </main>
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return <div className={styles.emptyState}><div className={styles.emptyIcon}><Icon>search_off</Icon></div><h2>Aucune équipe</h2><p>Aucune équipe ne correspond à ces filtres.</p><button onClick={onReset} type="button"><Icon>filter_alt_off</Icon>Réinitialiser les filtres</button></div>;
}
