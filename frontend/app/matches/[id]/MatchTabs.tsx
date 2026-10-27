 "use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Tab = "resume" | "stats" | "h2h";
type Scenario = "stats-nominale" | "h2h-nominale" | "h2h-low-sample" | "stats-empty" | "h2h-empty" | "loading" | "404";

const stats = [
  { label: "Possession de balle", home: "58%", away: "42%", left: 58, right: 42 },
  { label: "Tirs totaux", home: "14", away: "9", left: 61, right: 39 },
  { label: "Tirs cadrés", home: "6", away: "3", left: 67, right: 33 },
  { label: "Buts attendus (xG)", home: "1.84", away: "1.12", left: 62, right: 38 },
  { label: "Corners", home: "7", away: "4", left: 64, right: 36 },
  { label: "Fautes", home: "12", away: "15", left: 44, right: 56, reverse: true },
  { label: "Hors-jeu", home: "2", away: "3", left: 40, right: 60, reverse: true },
  { label: "Cartons jaunes", home: "2", away: "1", left: 67, right: 33 },
  { label: "Cartons rouges", home: "1", away: "0", left: 100, right: 0 },
  { label: "Arrêts du gardien", home: "2", away: "4", left: 33, right: 67, reverse: true },
  { label: "Passes", home: "542", away: "389", left: 58, right: 42 },
  { label: "Précision des passes", home: "88%", away: "81%", left: 52, right: 48 },
];

const events = [
  { minute: "18'", left: "K. Mbappé", leftDetail: "Passe décisive de O. Dembélé", right: "Action construite", score: "1 - 0", team: "home", icon: "⚽" },
  { minute: "34'", left: "Faute tactique", right: "C. Mbemba", rightDetail: "Antijeu au milieu", team: "away", icon: "🟨" },
  { minute: "45'", center: "Fin de la première période · 1 - 0" },
  { minute: "54'", left: "Vitinha", leftDetail: "Contestation verbale", right: "Rappel à l'ordre", team: "home", icon: "🟨" },
  { minute: "68'", left: "Tir du pied droit", right: "P. Aubameyang", rightDetail: "Frappe croisée lucarne", score: "1 - 1", team: "away", icon: "⚽" },
  { minute: "78'", left: "L. Beraldo", leftDetail: "Dernier défenseur", right: "Intervention illicite", team: "home", icon: "🟥" },
  { minute: "83'", left: "G. Ramos", leftDetail: "Passe de B. Barcola", right: "Tête plongeante", score: "2 - 1", team: "home", icon: "⚽" },
  { minute: "94'", center: "Coup de sifflet final · Score 2 - 1" },
];

const h2h = [
  ["24 Nov 2026", "Ligue 1 J12", "PSG", "2 - 1", "OM", "Parc des Princes"],
  ["16 Mar 2026", "Ligue 1 J26", "OM", "1 - 1", "PSG", "Vélodrome"],
  ["27 Oct 2025", "Ligue 1 J9", "OM", "0 - 3", "PSG", "Vélodrome"],
  ["31 Mar 2025", "Ligue 1 J27", "OM", "0 - 2", "PSG", "Vélodrome"],
  ["24 Sep 2024", "Ligue 1 J6", "PSG", "4 - 0", "OM", "Parc des Princes"],
  ["08 Fév 2024", "Coupe de France", "OM", "2 - 1", "PSG", "Vélodrome"],
];

const scenarios: { id: Scenario; label: string }[] = [
  { id: "stats-nominale", label: "1. Onglet Stats (Nominale)" },
  { id: "h2h-nominale", label: "2. Onglet H2H (28 matchs)" },
  { id: "h2h-low-sample", label: "3. H2H (< 5 matchs · Alerte)" },
  { id: "stats-empty", label: "4. État vide Stats" },
  { id: "h2h-empty", label: "5. État vide H2H" },
  { id: "loading", label: "6. Chargement (Skeleton)" },
  { id: "404", label: "7. Erreur (Match introuvable)" },
];

export default function MatchDetailsPage() {
  const [tab, setTab] = useState<Tab>("stats");
  const [scenario, setScenario] = useState<Scenario>("stats-nominale");
  const [sport, setSport] = useState("Football");

  const isLoading = scenario === "loading";
  const is404 = scenario === "404";
  const emptyStats = scenario === "stats-empty";
  const emptyH2h = scenario === "h2h-empty";
  const lowSample = scenario === "h2h-low-sample";
  const currentTab: Tab = scenario.startsWith("h2h") ? "h2h" : scenario.startsWith("stats") ? "stats" : tab;

  function chooseScenario(value: Scenario) {
    setScenario(value);
    if (value.startsWith("h2h")) setTab("h2h");
    if (value.startsWith("stats")) setTab("stats");
  }

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>⌁</div>
            <div><strong>Pronostique</strong><span>QUANT ENGINE</span></div>
          </div>
          <p className={styles.navCaption}>ARCHITECTURE ANALYTIQUE</p>
          <nav className={styles.sideNav}>
            {[
              ["▦", "Dashboard", "/dashboard"],
              ["⚽", "Sports", "/sports"],
              ["🏆", "Compétitions", "/competitions"],
              ["▣", "Matchs", "/matches"],
              ["♟", "Équipes", "/teams"],
              ["↗", "Value bets", "/value-bets"],
              ["⌘", "Combinaisons", "/combinaisons"],
              ["◎", "Cote cible", "/cote-cible"],
              ["◷", "Historique", "/historique"],
            ].map(([icon, label, href]) => (
              <Link key={label} href={href} className={`${styles.navItem} ${label === "Matchs" ? styles.navActive : ""}`}>
                <span>{icon}</span><span>{label}</span>
                {label === "Value bets" && <small className={styles.proTag}>▣ PRO</small>}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.apiBox}>
          <strong><i /> FLUX API QUANT</strong>
          <p><span>Latence :</span><b>42ms</b></p>
          <p><span>Statut :</span><b>Synchronisé</b></p>
        </div>
      </aside>

      <div className={styles.mainShell}>
        <header className={styles.topbar}>
          <div className={styles.sportsSwitch}>
            {["Football", "Basketball", "Tennis"].map(item => (
              <button key={item} onClick={() => setSport(item)} className={sport === item ? styles.sportActive : ""}>{item}</button>
            ))}
            <span className={styles.comingSoon}>Volleyball <small>Bientôt</small></span>
          </div>
          <div className={styles.userActions}>
            <Link href="/subscription" className={styles.premium}>♛ <span>Passer Premium</span></Link>
            <div className={styles.userInfo}><strong>Thomas Moreau</strong><span>Analyste Free</span></div>
            <div className={styles.avatar}>♙</div>
            <button aria-label="Déconnexion" className={styles.logout}>↪</button>
          </div>
        </header>
        <div className={styles.responsibleBar}>
          <span>⬡ Les pronostics sont des probabilités, jamais des certitudes. 18+ · Jouez de façon responsable.</span>
          <span>Modèle: v4.2.0-quant <b>Précision 30j: 68.4%</b></span>
        </div>

        <main className={styles.content}>
          <div className={styles.breadcrumbHeader}>
            <div className={styles.breadcrumbs}>
              <Link href="/matches" className={styles.backButton}>← <span>Matchs</span></Link>
              <span className={styles.slash}>/</span>
              <div>Football <span>›</span> France · Ligue 1 <span>›</span> Saison 2026/2027 <span>›</span> <b>12ème journée</b></div>
            </div>
            <div className={styles.matchBadges}><span>ID: L1-2026-M112</span><span className={styles.synced}><i /> Données synchronisées (Temps réel)</span></div>
          </div>

          {isLoading ? (
            <div className={styles.loadingPanel}><div className={styles.skeletonCircle} /><div className={styles.skeletonLine} /><div className={styles.skeletonLine} /><p>Chargement des données du match…</p></div>
          ) : is404 ? (
            <section className={styles.errorPanel}><div className={styles.errorIcon}>⌕</div><h2>Match introuvable</h2><p>La rencontre demandée (ID: L1-2026-M112) n’existe pas dans le référentiel actif ou a été déprogrammée par la ligue.</p><Link href="/matches" className={styles.darkButton}>← Retour au calendrier des matchs</Link></section>
          ) : (
            <div className={styles.pageStack}>
              <section className={styles.matchCard}>
                <div className={styles.statusBadge}>{scenario === "stats-nominale" || scenario === "h2h-nominale" ? "⚽ Terminé · 90’+4" : scenario === "h2h-low-sample" ? "⚽ Terminé · 90’+4" : "◷ Terminé · 90’+4"}</div>
                <div className={styles.matchup}>
                  <div className={styles.team}>
                    <div className={styles.teamLogo}>PSG</div>
                    <div><h1>Paris Saint-Germain</h1><span>Domicile</span></div>
                  </div>
                  <div className={styles.scoreBoard}><div><strong>2</strong><span>–</span><strong>1</strong></div><small>Mi-temps : 1 - 0</small></div>
                  <div className={`${styles.team} ${styles.awayTeam}`}>
                    <div className={styles.teamLogo}>OM</div>
                    <div><h1>Olympique de Marseille</h1><span>Extérieur</span></div>
                  </div>
                </div>
                <div className={styles.matchMeta}>
                  <span>▦ <span>Dimanche 24 Nov. 2026 · 20:45</span></span>
                  <span>▤ <span>Parc des Princes · 47 929 spectateurs</span></span>
                  <span>⚑ <span>Arbitre : François Letexier</span></span>
                  <span>☼ <span>11°C · Ciel couvert · Hum. 78%</span></span>
                </div>
              </section>

              <nav className={styles.tabs} aria-label="Onglets du match">
                <button className={currentTab === "resume" ? styles.tabActive : ""} onClick={() => { setTab("resume"); setScenario("stats-nominale"); }}>☷ <span>Résumé</span></button>
                <button className={currentTab === "stats" ? styles.tabActive : ""} onClick={() => { setTab("stats"); setScenario("stats-nominale"); }}>▥ <span>Stats</span></button>
                <button className={currentTab === "h2h" ? styles.tabActive : ""} onClick={() => { setTab("h2h"); setScenario("h2h-nominale"); }}>◷ <span>H2H</span></button>
                <button disabled>Cotes <small>Bientôt</small></button>
                <button disabled>Analyse <small>Bientôt</small></button>
                <button disabled>Prédictions <small>Bientôt</small></button>
              </nav>

              <div className={styles.columns}>
                <div className={styles.primaryColumn}>
                  {currentTab === "resume" && (
                    <section className={styles.panel}>
                      <div className={styles.panelHeading}><div><span className={styles.headingIcon}>◷</span><div><h2>Événements du match</h2><p>Chronologie des moments clés</p></div></div><span className={styles.legend}>● PSG　<span>● OM</span></span></div>
                      <div className={styles.timeline}>
                        {events.map((event, index) => event.center ? (
                          <div className={styles.timelineCenter} key={index}><span>{event.center}</span></div>
                        ) : (
                          <div className={styles.eventRow} key={index}>
                            <div className={styles.eventLeft}>{event.team === "home" ? <><strong>{event.left}</strong>{event.score && <b className={styles.eventScore}>{event.score}</b>}<small>{event.leftDetail}</small></> : <><em>{event.left}</em></>}</div>
                            <span className={`${styles.eventIcon} ${event.icon === "🟥" ? styles.redCard : event.icon === "🟨" ? styles.yellowCard : ""}`}>{event.icon}</span>
                            <div className={styles.eventRight}>{event.team === "away" ? <><strong>{event.right}</strong><small>{event.rightDetail}</small></> : <em>{event.right}</em>}</div>
                            <span className={styles.eventMinute}>{event.minute}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {currentTab === "stats" && (
                    <section className={styles.panel}>
                      <div className={styles.panelHeading}>
                        <div><span className={styles.headingIcon}>▥</span><div><h2>Statistiques du match</h2><p>Comparatif dynamique en temps réel</p></div></div>
                        <div className={styles.legend}><span>● PSG (Domicile)</span><span className={styles.awayLegend}>● OM (Extérieur)</span></div>
                      </div>
                      {emptyStats ? <EmptyState icon="▥" title="Statistiques indisponibles pour ce match" text="Le flux officiel n’a transmis aucune feuille de statistiques pour cette rencontre." /> : (
                        <div className={styles.statsList}>
                          {stats.map(stat => (
                            <div className={styles.statRow} key={stat.label}>
                              <div className={styles.statValues}><strong className={stat.reverse ? styles.neutralValue : ""}>{stat.home}</strong><span>{stat.label}</span><strong className={!stat.reverse ? styles.neutralValue : ""}>{stat.away}</strong></div>
                              <div className={styles.barPair}><div><i style={{ width: `${stat.left}%` }} className={stat.label.includes("rouges") ? styles.redFill : stat.label.includes("jaunes") ? styles.yellowFill : ""} /></div><div><i style={{ width: `${stat.right}%` }} /></div></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {currentTab === "h2h" && (
                    <div className={styles.h2hStack}>
                      {lowSample && <div className={styles.warning}><strong>⚠ Échantillon statistique restreint (&lt; 5 confrontations)</strong><p>Moins de 5 confrontations : ces statistiques ont une faible significativité statistique.</p></div>}
                      {emptyH2h ? <section className={styles.panel}><EmptyState icon="◷" title="Aucune confrontation précédente" text="Ces deux équipes ne se sont jamais rencontrées dans les compétitions enregistrées." /></section> : <>
                        <section className={styles.panel}>
                          <div className={styles.panelHeading}><div><span className={styles.headingIcon}>⇄</span><div><h2>Historique des confrontations directes (H2H)</h2><p>28 confrontations analysées toutes compétitions confondues</p></div></div><span className={styles.competitionTag}>Ligue 1 &amp; Coupe</span></div>
                          <div className={styles.h2hSummary}>
                            <div className={styles.h2hLabels}><span>● Victoires PSG : <b>15 (54%)</b></span><span>● Nuls : <b>6 (21%)</b></span><span>● Victoires OM : <b>7 (25%)</b></span></div>
                            <div className={styles.triBar}><i /><i /><i /></div>
                          </div>
                          <div className={styles.metricGrid}>
                            <Metric title="Buts marqués" value="48 - 29" detail="+19 PSG" />
                            <Metric title="Moy. buts/match" value="2.75" detail="Par rencontre" />
                            <Metric title="Les deux marquent" value="16/28 (57.1%)" detail="BTTS Fréquence" />
                            <Metric title="Plus de 2,5 buts" value="17/28 (60.7%)" detail="Seuil > 2.5" />
                          </div>
                        </section>
                        <section className={styles.panel}>
                          <div className={styles.panelHeading}><div><div><h2>Dernières confrontations directes</h2><p>Chronologique décroissant</p></div></div></div>
                          <div className={styles.h2hList}>{h2h.map((row, i) => <div className={styles.h2hRow} key={i}><div className={styles.h2hDate}><span>{row[0]}</span><small>{row[1]}</small></div><div className={styles.h2hScore}><strong>{row[2]}</strong><b>{row[3]}</b><strong>{row[4]}</strong></div><span className={styles.venue}>{row[5]}</span></div>)}</div>
                        </section>
                      </>}
                    </div>
                  )}
                </div>

                <aside className={styles.secondaryColumn}>
                  <section className={styles.predictionPanel}>
                    <div className={styles.predictionTitle}><strong>▥ PRÉDICTION QUANTITATIVE</strong><span>Phase 8</span></div>
                    <div className={styles.lockedBox}><span>♙</span><strong>Disponible avec la Phase 8</strong><small>Modèle Poisson &amp; Dixon-Coles calibré</small></div>
                    <div className={styles.probabilities}>
                      {[["Proba PSG (1)", "52.4%", 52], ["Proba Nul (X)", "26.1%", 26], ["Proba OM (2)", "21.5%", 21]].map(([label, value, width]) => <div key={String(label)}><div><span>{label}</span><b>{value}</b></div><i><span style={{ width: `${width}%` }} /></i></div>)}
                    </div>
                    <p>Le moteur probabiliste calculera automatiquement les distributions de scores, l’espérance de buts xG et les probabilités 1X2 dès l’activation du module ML.</p>
                  </section>
                  <section className={styles.panel}>
                    <div className={styles.officialTitle}><h2>Métriques officielles</h2><span>Post-match</span></div>
                    <OfficialMetric label="Possession" home="58%" away="42%" left={58} />
                    <OfficialMetric label="Tirs (cadrés)" home="14 (6)" away="9 (3)" />
                    <OfficialMetric label="xG indicatif" home="1.84" away="1.12" left={62} />
                    <OfficialMetric label="Fautes commises" home="12" away="15" />
                  </section>
                </aside>
              </div>
            </div>
          )}

          <section className={styles.inspector}>
            <div className={styles.inspectorHeading}><div><strong>⚙ INSPECTEUR D’ÉTATS D’INTERFACE</strong><span>Prototype Sandbox</span></div><p>Basculez entre les scénarios d’affichage réactifs des onglets et données :</p></div>
            <div className={styles.scenarioButtons}>{scenarios.map(item => <button key={item.id} onClick={() => chooseScenario(item.id)} className={scenario === item.id ? styles.scenarioActive : ""}>{item.label}</button>)}</div>
          </section>
        </main>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <div className={styles.emptyState}><span>{icon}</span><h3>{title}</h3><p>{text}</p></div>;
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className={styles.metricCard}><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function OfficialMetric({ label, home, away, left }: { label: string; home: string; away: string; left?: number }) {
  return <div className={styles.officialMetric}><div><strong>{home}</strong><span>{label}</span><strong>{away}</strong></div>{left !== undefined && <div className={styles.officialBar}><i style={{ width: `${left}%` }} /><i style={{ width: `${100 - left}%` }} /></div>}</div>;
}
