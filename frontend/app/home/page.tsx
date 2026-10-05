import React from "react";
import "./home.css";

const FormBadge = ({ value }: { value: string }) => {
  const className =
    value === "V"
      ? "form-badge win"
      : value === "D"
      ? "form-badge loss"
      : "form-badge draw";

  return <span className={className}>{value}</span>;
};

const FeatureCheck = ({
  children,
  disabled = false,
  star = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  star?: boolean;
}) => (
  <div className={`feature-row ${disabled ? "disabled" : ""} ${star ? "star" : ""}`}>
    <span className="material-symbols-outlined feature-icon">
      {star ? "star" : disabled ? "close" : "check"}
    </span>
    <span>{children}</span>
  </div>
);

const SportPulseHome: React.FC = () => {
  return (
    <div className="sportpulse-page">
      {/* =========================
          HEADER
      ========================== */}
      <header className="top-header">
        <div className="header-container">
          <div className="brand-area">
            <a href="#" className="brand">
              <div className="brand-logo">
                <span className="material-symbols-outlined">query_stats</span>
              </div>

              <div className="brand-content">
                <div className="brand-title-row">
                  <span className="brand-name">
                    SportPulse<span>AI</span>
                  </span>

                  <span className="quant-badge">Quant Engine</span>
                </div>
              </div>
            </a>

            <div className="model-status">
              <span className="status-dot" />
              <span>v2.4 Quant Models Active</span>
            </div>

            <nav className="main-nav">
              <a href="#fonctionnalites">Fonctionnalités</a>
              <a href="#methode">Méthodologie</a>
              <a href="#offres">Offres</a>
              <a href="#jeu-responsable">Jeu responsable</a>
            </nav>
          </div>

          <div className="header-actions">
            <a href="/auth/login" className="login-link">
              Se connecter
            </a>

            <a href="/auth/register" className="primary-button small">
              <span>Créer un compte</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* =========================
            HERO
        ========================== */}
        <section className="hero-section">
          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />

          <div className="hero-container">
            <div className="hero-grid">
              {/* HERO LEFT */}
              <div className="hero-content">
                <div className="engine-pill">
                  <span className="status-dot" />
                  <span>
                    Moteur Stochastique Dixon-Coles v4.2
                  </span>
                </div>

                <h1>
                  Des probabilités,
                  <br />
                  <span>pas des certitudes.</span>
                </h1>

                <p className="hero-description">
                  Une plateforme d&apos;ingénierie quantitative qui transforme des
                  millions de données de matchs en probabilités calibrées,
                  transparentes et explicables pour éclairer vos analyses
                  sportives.
                </p>

                <div className="hero-actions">
                  <a href="/auth/register" className="primary-button large">
                    <span>Créer un compte gratuit</span>
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </a>

                  <a href="#demo" className="secondary-button large">
                    <span className="material-symbols-outlined">
                      play_circle
                    </span>
                    <span>Voir le modèle en direct</span>
                  </a>
                </div>

                <div className="telemetry">
                  <div className="verified-icon">
                    <span className="material-symbols-outlined">
                      verified
                    </span>
                  </div>

                  <p>
                    Modèles Dixon-Coles &amp; Poisson • Brier score{" "}
                    <strong>0.178</strong> • Zéro certitude artificielle
                  </p>
                </div>
              </div>

              {/* HERO RIGHT */}
              <div className="match-preview-wrapper" id="demo">
                <div className="match-card-halo" />

                <div className="match-card">
                  <div className="match-card-header">
                    <div className="league-info">
                      <span className="material-symbols-outlined">
                        query_stats
                      </span>

                      <span>
                        Ligue 1 • 34<sup>e</sup> Journée
                      </span>
                    </div>

                    <span className="model-badge">
                      Dixon-Coles (100k MC)
                    </span>
                  </div>

                  {/* TEAMS */}
                  <div className="teams-grid">
                    <div className="team home-team">
                      <div className="team-name-row">
                        <strong>Paris Saint-Germain</strong>
                        <span className="team-type">DOM</span>
                      </div>

                      <div className="form-row">
                        <FormBadge value="V" />
                        <FormBadge value="V" />
                        <FormBadge value="N" />
                        <FormBadge value="V" />
                        <FormBadge value="D" />

                        <span className="xg">xG 2.41</span>
                      </div>
                    </div>

                    <div className="team away-team">
                      <div className="team-name-row">
                        <span className="team-type">EXT</span>
                        <strong>Olympique de Marseille</strong>
                      </div>

                      <div className="form-row">
                        <span className="xg">xG 1.34</span>

                        <FormBadge value="V" />
                        <FormBadge value="D" />
                        <FormBadge value="V" />
                        <FormBadge value="N" />
                        <FormBadge value="V" />
                      </div>
                    </div>
                  </div>

                  {/* PROBABILITIES */}
                  <div className="probability-box">
                    <div className="probability-header">
                      <strong>DISTRIBUTION PROBABILISTE 1X2</strong>
                      <span>Intervalle de confiance 95%</span>
                    </div>

                    <div className="probability-bar">
                      <div className="prob-home" />
                      <div className="prob-draw" />
                      <div className="prob-away" />
                    </div>

                    <div className="probability-grid">
                      <div className="probability-item">
                        <span className="cyan-label">1 (Domicile)</span>
                        <strong>51%</strong>
                        <small>± 4%</small>
                      </div>

                      <div className="probability-item">
                        <span className="gray-label">X (Nul)</span>
                        <strong>27%</strong>
                        <small>± 3%</small>
                      </div>

                      <div className="probability-item">
                        <span className="amber-label">2 (Extérieur)</span>
                        <strong>22%</strong>
                        <small>± 3%</small>
                      </div>
                    </div>
                  </div>

                  {/* SECONDARY MARKETS */}
                  <div className="markets-grid">
                    <div className="market-card">
                      <span>Les 2 marquent</span>

                      <div>
                        <strong>Oui 58%</strong>
                        <small>±4%</small>
                      </div>
                    </div>

                    <div className="market-card">
                      <span>Plus 2.5 buts</span>

                      <div>
                        <strong>61%</strong>
                        <small>±5%</small>
                      </div>
                    </div>

                    <div className="market-card">
                      <span>Précision Modèle</span>

                      <div>
                        <strong className="green-text">0.174</strong>
                        <small>Brier</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            METHODOLOGY
        ========================== */}
        <section className="method-section" id="methode">
          <div className="section-container">
            <div className="section-heading split-heading">
              <div>
                <span className="section-label">
                  Architecture Méthodologique
                </span>

                <h2>De la donnée brute à la décision éclairée</h2>
              </div>

              <p>
                Chaque estimation découle d&apos;un pipeline séquentiel strict
                garantissant l&apos;absence de biais cognitif et de surapprentissage
                temporel.
              </p>
            </div>

            <div className="process-grid">
              {/* STEP 1 */}
              <div className="process-card">
                <div>
                  <div className="process-top">
                    <span className="phase cyan">PHASE 01</span>

                    <span className="material-symbols-outlined cyan-icon">
                      database
                    </span>
                  </div>

                  <h3>01. Données collectées</h3>

                  <p>
                    Ingestion multi-sources continue : calendriers,
                    compositions officielles, météo, historiques H2H, métriques
                    avancées xG/xGA, ainsi que la dynamique des cotes et
                    volumes institutionnels en temps réel.
                  </p>
                </div>

                <div className="process-footer">
                  <span>Flux ingérés</span>
                  <strong>1 420 000+ points/j</strong>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="process-card">
                <div>
                  <div className="process-top">
                    <span className="phase emerald">PHASE 02</span>

                    <span className="material-symbols-outlined emerald-icon">
                      calculate
                    </span>
                  </div>

                  <h3>02. Modèles calibrés</h3>

                  <p>
                    Élimination des biais par régression logistique, modèles
                    stochastiques bivariés Poisson et Dixon-Coles avec
                    validation croisée temporelle stricte.
                  </p>
                </div>

                <div className="process-footer">
                  <span>Fonction de perte</span>
                  <strong className="green-text">
                    Log-Loss Minimisée
                  </strong>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="process-card">
                <div>
                  <div className="process-top">
                    <span className="phase amber">PHASE 03</span>

                    <span className="material-symbols-outlined amber-icon">
                      hub
                    </span>
                  </div>

                  <h3>03. Combinaisons cote cible</h3>

                  <p>
                    Algorithme d&apos;optimisation combinatoire générant des
                    scénarios probabilistes selon votre profil d&apos;analyse et
                    tolérance paramétrable.
                  </p>
                </div>

                <div className="process-footer">
                  <span>Optimisation</span>
                  <strong className="amber-text">
                    Greedy + Monte Carlo
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            FEATURES
        ========================== */}
        <section className="features-section" id="fonctionnalites">
          <div className="section-container">
            <div className="section-heading">
              <span className="section-label">Modules Quantitatifs</span>

              <h2>Capacités analytiques de précision</h2>

              <p>
                Des outils mathématiques d&apos;ordinaire réservés aux desks de
                pricing institutionnels, désormais accessibles pour auditer
                chaque ligne.
              </p>
            </div>

            <div className="feature-grid">
              {/* FEATURE 1 */}
              <div className="feature-card">
                <div>
                  <div className="feature-header">
                    <div className="feature-title">
                      <div className="feature-icon-box teal">
                        <span className="material-symbols-outlined">
                          analytics
                        </span>
                      </div>

                      <h3>Analyse de match approfondie</h3>
                    </div>

                    <span className="module-badge">BAYES-V2</span>
                  </div>

                  <p>
                    Décomposition bayésienne exhaustive, confrontation
                    historique H2H pondérée par l&apos;antériorité, impact quantifié
                    des absences sur les xG et dynamique offensive/défensive
                    normalisée par ligue.
                  </p>
                </div>

                <div className="mini-panel">
                  <div className="mini-row">
                    <span>Facteur d&apos;impact absence clé</span>
                    <strong className="rose-text">
                      -0.42 xG projeté
                    </strong>
                  </div>

                  <div className="impact-bar">
                    <div />
                    <span />
                  </div>

                  <div className="mini-row muted">
                    <span>Pondération domicile ajustée : +14%</span>
                    <span>Régression moyenne : 86%</span>
                  </div>
                </div>
              </div>

              {/* FEATURE 2 */}
              <div className="feature-card">
                <div>
                  <div className="feature-header">
                    <div className="feature-title">
                      <div className="feature-icon-box cyan">
                        <span className="material-symbols-outlined">
                          shuffle
                        </span>
                      </div>

                      <h3>Simulation Monte Carlo</h3>
                    </div>

                    <span className="module-badge">100 000 ITER</span>
                  </div>

                  <p>
                    10 000 à 100 000+ itérations stochastiques par rencontre
                    pour cartographier la distribution exacte des scores
                    probables et révéler la marge d&apos;incertitude réelle.
                  </p>
                </div>

                <div className="mini-panel">
                  <div className="mini-row">
                    <span>Densité stochastique des scores</span>
                    <strong className="cyan-text">Mode : 2 - 1</strong>
                  </div>

                  <div className="histogram">
                    <div>
                      <span style={{ height: "48px" }} />
                      <small>2-1 (14%)</small>
                    </div>

                    <div>
                      <span style={{ height: "36px" }} />
                      <small>1-1 (11%)</small>
                    </div>

                    <div>
                      <span style={{ height: "28px" }} />
                      <small>2-0 (9%)</small>
                    </div>

                    <div>
                      <span style={{ height: "18px" }} />
                      <small>1-2 (6%)</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* FEATURE 3 */}
              <div className="feature-card">
                <div>
                  <div className="feature-header">
                    <div className="feature-title">
                      <div className="feature-icon-box amber">
                        <span className="material-symbols-outlined">
                          tune
                        </span>
                      </div>

                      <h3>Moteur Cote Cible</h3>
                    </div>

                    <span className="module-badge">GREEDY OPT</span>
                  </div>

                  <p>
                    Algorithme combinatoire glouton permettant de construire
                    des scénarios rigoureusement calculés autour d&apos;une cote
                    recherchée.
                  </p>
                </div>

                <div className="target-panel">
                  <div>
                    <span>Cote cible paramétrée</span>
                    <strong>
                      5.50 <small>(±5%)</small>
                    </strong>
                  </div>

                  <div className="vertical-divider" />

                  <div className="target-right">
                    <span>Scénario résolu (3 sélections)</span>
                    <strong>
                      Cote 5.48 •{" "}
                      <em>P: 18.2%</em>
                    </strong>
                  </div>
                </div>
              </div>

              {/* FEATURE 4 */}
              <div className="feature-card">
                <div>
                  <div className="feature-header">
                    <div className="feature-title">
                      <div className="feature-icon-box emerald">
                        <span className="material-symbols-outlined">
                          history
                        </span>
                      </div>

                      <h3>Backtesting &amp; Calibration Publique</h3>
                    </div>

                    <span className="module-badge">OPEN AUDIT</span>
                  </div>

                  <p>
                    Audit rétrospectif permanent de nos modèles prédictifs.
                    Consultez en temps réel la courbe de calibration et
                    l&apos;évolution de notre Brier score.
                  </p>
                </div>

                <div className="calibration-panel">
                  <svg viewBox="0 0 100 40">
                    <line
                      x1="5"
                      y1="35"
                      x2="95"
                      y2="5"
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    <path
                      d="M 5 36 Q 30 27 50 20 T 95 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    <circle cx="50" cy="20" r="3" fill="currentColor" />
                    <circle cx="95" cy="6" r="3" fill="currentColor" />
                  </svg>

                  <div>
                    <span>Brier Score Global</span>
                    <strong>0.178 (4 saisons)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            PRICING
        ========================== */}
        <section className="pricing-section" id="offres">
          <div className="section-container">
            <div className="pricing-heading">
              <span className="section-label">Niveaux d&apos;accès</span>

              <h2>Tarification structurée et transparente</h2>

              <p>
                Sélectionnez le niveau de puissance de calcul requis pour vos
                modèles statistiques.
              </p>
            </div>

            <div className="pricing-grid">
              {/* FREE */}
              <div className="pricing-card">
                <div>
                  <div className="pricing-card-header">
                    <div>
                      <span>Accès Standard</span>
                      <h3>Compte Gratuit</h3>
                    </div>

                    <span className="plan-badge">
                      Sans engagement
                    </span>
                  </div>

                  <div className="price">
                    <strong>0 €</strong>
                    <span>/ pour toujours</span>
                  </div>

                  <div className="features-list">
                    <FeatureCheck>
                      <strong>5 analyses</strong> de match complètes par jour
                    </FeatureCheck>

                    <FeatureCheck>
                      Simulation Monte Carlo standard (
                      <strong>1 000 tirages</strong>)
                    </FeatureCheck>

                    <FeatureCheck>
                      Générateur de cote cible (
                      <strong>±10%</strong>)
                    </FeatureCheck>

                    <FeatureCheck>
                      Marchés majeurs couverts (1X2, Plus/Moins 2.5, BTTS)
                    </FeatureCheck>

                    <FeatureCheck disabled>
                      Signaux Value Bet probabilistes (+EV)
                    </FeatureCheck>

                    <FeatureCheck disabled>
                      Backtesting complet et gestionnaire Kelly
                    </FeatureCheck>
                  </div>
                </div>

                <a href="#" className="free-button">
                  Ouvrir un accès standard
                </a>
              </div>

              {/* PREMIUM */}
              <div className="pricing-card premium">
                <div className="premium-top-line" />

                <div>
                  <div className="pricing-card-header">
                    <div>
                      <span className="amber-text">
                        Accès Institutionnel
                      </span>

                      <h3>Compte Premium</h3>
                    </div>

                    <span className="premium-badge">
                      ACCÈS INTÉGRAL
                    </span>
                  </div>

                  <div className="price">
                    <strong>29 €</strong>

                    <span>
                      / mois • Facturé annuellement ou sans engagement
                    </span>
                  </div>

                  <div className="features-list">
                    <FeatureCheck>
                      <strong>Analyses illimitées</strong> sur l&apos;intégralité
                      des championnats
                    </FeatureCheck>

                    <FeatureCheck>
                      Monte Carlo haute résolution (
                      <strong>100 000 tirages MC</strong>)
                    </FeatureCheck>

                    <FeatureCheck>
                      Moteur cote cible à tolérance ultra-fine (
                      <strong>±1%, ±5% ou libre</strong>)
                    </FeatureCheck>

                    <FeatureCheck star>
                      <strong>Signaux Value Bet (+EV)</strong> en temps réel
                      avec alerte d&apos;écart
                    </FeatureCheck>

                    <FeatureCheck>
                      Assistant explicatif et décomposition des variables xG
                    </FeatureCheck>

                    <FeatureCheck>
                      Exportation CSV des cotes projetées et dimensionnement
                      Kelly
                    </FeatureCheck>
                  </div>
                </div>

                <a href="#" className="premium-button">
                  <span>Activer l&apos;Accès Institutionnel</span>

                  <span className="material-symbols-outlined">
                    bolt
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            RESPONSIBLE GAMING
        ========================== */}
        <aside
          className="responsible-bar"
          id="jeu-responsable"
          aria-label="Mise en garde jeu responsable"
        >
          <div className="responsible-container">
            <div className="responsible-text">
              <span className="age-badge">18+</span>

              <p>
                Les pronostics ne garantissent aucun gain. Jouez de façon
                responsable. Évaluez systématiquement les probabilités avec
                discernement.
              </p>
            </div>

            <div className="support-box">
              <span className="material-symbols-outlined">
                support_agent
              </span>

              <span>
                Aide &amp; écoute : 09 74 75 13 13 (appel non surtaxé)
              </span>
            </div>
          </div>
        </aside>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="material-symbols-outlined">
                query_stats
              </span>
            </div>

            <span>
              © 2025 SportPulse AI. Modèles stochastiques prédictifs. Tous
              droits réservés.
            </span>
          </div>

          <nav className="footer-nav">
            <a href="#">Mentions légales</a>
            <a href="#">CGU</a>
            <a href="#jeu-responsable">Jeu responsable</a>
            <a href="#">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default SportPulseHome;