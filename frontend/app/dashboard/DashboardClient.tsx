"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";

import { hasPremiumAccess, roleLabel, type AuthUser } from "@/lib/auth-types";
import type { Match as ApiMatch } from "@/lib/referential";
import "./dashboard.css";
import MatchesToday from "./MatchesToday";

const navHrefs: Record<string, string> = {
  Dashboard: "/dashboard",
  Sports: "/sports",
  Matchs: "/matches",
  "Compétitions": "/competitions",
  "Équipes": "/teams",
};

const navItems = [
  ["query_stats", "Dashboard"],
  ["category", "Sports"],
  ["sports_soccer", "Matchs"],
  ["trophy", "Compétitions"],
  ["shield", "Équipes"],
  ["trending_up", "Value bets", "Pro"],
  ["account_tree", "Combinaisons"],
  ["filter_center_focus", "Cote cible"],
  ["tune", "Optimiseur", "Pro"],
  ["history", "Historique"],
  ["biotech", "Backtesting", "Pro"],
  ["account_balance_wallet", "Bankroll", "Pro"],
  ["smart_toy", "Assistant IA", "Pro"],
];

const soonItems = [
  ["newspaper", "Actualités"],
  ["bookmark", "Favoris"],
  ["notifications_active", "Alertes"],
];

function MaterialIcon({ children }: { children: React.ReactNode }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (!open) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open, onClose]);

  return (
    <aside id="app-sidebar" className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-content">
        <div className="brand">
          <div className="brand-logo">
            <span className="brand-mark">P</span>
          </div>

          <div>
            <span className="brand-name">Pronostique</span>
            <span className="brand-subtitle">Quant Engine</span>
          </div>
        </div>

        <div className="sidebar-scroll">
          <div className="nav-section-title">
            Analytique Quantitative
          </div>

          <nav className="main-nav">
            {navItems.map(([icon, label, badge]) => {
              const href = navHrefs[label];
              const active =
                href !== undefined &&
                (pathname === href || pathname.startsWith(`${href}/`));
              const content = (
                <>
                  <div className="nav-item-left">
                    <MaterialIcon>{icon}</MaterialIcon>
                    <span>{label}</span>
                  </div>

                  {badge && (
                    <span className="pro-badge">
                      <MaterialIcon>lock</MaterialIcon>
                      {badge}
                    </span>
                  )}
                </>
              );

              return href ? (
                <Link
                  href={href}
                  key={label}
                  onClick={onClose}
                  className={`nav-item ${active ? "active" : ""}`}
                >
                  {content}
                </Link>
              ) : (
                <div key={label} className="nav-item" aria-disabled="true">
                  {content}
                </div>
              );
            })}
          </nav>

          <div className="nav-section-title soon-title">
            Bientôt disponible
          </div>

          <div className="soon-items">
            {soonItems.map(([icon, label]) => (
              <div className="soon-item" key={label}>
                <MaterialIcon>{icon}</MaterialIcon>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-status">
          <div className="status-line">
            <span className="status-dot" />
            <strong>v2.4 Quant Models Active</strong>
          </div>
          <p>Algorithmes calibrés sur 4.2M cotes</p>
        </div>
      </div>
    </aside>
  );
}

type HeaderProps = {
  user: AuthUser;
  open: boolean;
  onMenuClick: () => void;
};

function Header({ user, open, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const premium = hasPremiumAccess(user);

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Les cookies sont effaces : on recharge pour repasser par le proxy.
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-main">
        <div className="header-left">
          <button type="button" className="menu-button" aria-label="Ouvrir le menu" aria-expanded={open} aria-controls="app-sidebar" onClick={onMenuClick}>
            <MaterialIcon>menu</MaterialIcon>
          </button>
          <div className="search-box">
            <MaterialIcon>search</MaterialIcon>
            <input
              type="text"
              placeholder="Rechercher une équipe, un match..."
            />
          </div>

          <div className="sport-switcher">
            <button className="sport-active" type="button">
              <span />
              Football
            </button>

            <button type="button">
              Basketball <small>(Bientôt)</small>
            </button>

            <button type="button">
              Tennis <small>(Bientôt)</small>
            </button>
          </div>
        </div>

        <div className="header-right">
          <div className="language-switcher">
            <button className="language-active" type="button">
              FR
            </button>
            <button type="button">EN</button>
          </div>

          <button className="notification-button" type="button">
            <MaterialIcon>notifications</MaterialIcon>
            <span className="notification-dot" />
          </button>

          <div className="profile">
            <div className="profile-info">
              <div className="profile-name">
                <strong>{user.username}</strong>
                <span>{roleLabel(user)}</span>
              </div>

              <small>ID: {user.id.slice(0, 8).toUpperCase()}</small>
            </div>

            {premium ? null : (
              <button className="premium-button" type="button">
                Passer Premium
              </button>
            )}

            <button
              className="signout-button"
              disabled={signingOut}
              onClick={handleSignOut}
              title="Se déconnecter"
              type="button"
            >
              <MaterialIcon>logout</MaterialIcon>

              <span className="signout-label">
                {signingOut ? "Déconnexion..." : "Déconnexion"}
              </span>
            </button>

            <div className="avatar">
              <MaterialIcon>person</MaterialIcon>
            </div>
          </div>
        </div>
      </div>

      <div className="responsible-bar">
        <MaterialIcon>gavel</MaterialIcon>
        <span>
          Les pronostics sont des probabilités, jamais des certitudes.
          18+ · Jouez de façon responsable.
        </span>
      </div>
    </header>
  );
}

function KpiCards() {
  return (
    <section className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-header">
          <span>Matchs aujourd&apos;hui</span>
          <div className="kpi-icon">
            <MaterialIcon>sports_soccer</MaterialIcon>
          </div>
        </div>

        <div className="kpi-value-row">
          <strong>14</strong>
          <span>8 sous modèle quant</span>
        </div>

        <p>Ligue 1, Premier League, La Liga</p>

        <div className="progress">
          <div style={{ width: "57%" }} />
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Prédictions restantes</span>
          <span className="quota-badge">Quota Free</span>
        </div>

        <div className="kpi-value-row between">
          <strong>
            3 <small>/ 5</small>
          </strong>
          <span>60 % utilisé</span>
        </div>

        <div className="progress progress-large">
          <div style={{ width: "60%" }} />
        </div>

        <p>
          <MaterialIcon>schedule</MaterialIcon>
          Réinitialisation à 00:00 UTC
        </p>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>Précision modèle (30 j)</span>
          <span className="model-badge">Dixon-Coles + MC</span>
        </div>

        <div className="kpi-value-row">
          <strong>68.4 %</strong>
          <span>± 1.8 %</span>
        </div>

        <div className="brier-row">
          <span>Brier Score calibré :</span>
          <strong>0.178</strong>
        </div>

        <div className="progress">
          <div style={{ width: "68%" }} />
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span>ROI simulé backtesté</span>
          <span className="roi-badge">
            <MaterialIcon>trending_up</MaterialIcon>
            +1.4 % ce mois
          </span>
        </div>

        <div className="kpi-value-row">
          <strong>+8.62 %</strong>
          <span>plat</span>
        </div>

        <p>Sur 1 420 sélections quantifiées</p>

        <div className="progress">
          <div style={{ width: "82%" }} />
        </div>
      </div>
    </section>
  );
}

function TargetOddsCard() {
  const [targetOdds, setTargetOdds] = useState("5.50");
  const [tolerance, setTolerance] = useState("± 5 %");

  return (
    <div className="tool-card">
      <div className="card-heading">
        <div>
          <MaterialIcon>filter_center_focus</MaterialIcon>
          <h3>Cote cible rapide</h3>
        </div>

        <span className="algorithm-badge">Algorithme Greedy</span>
      </div>

      <p>
        Générez des assemblages optimisés mathématiquement selon votre
        horizon de risque.
      </p>

      <div className="field-group">
        <label htmlFor="target-odds">
          <span>Cote globale recherchée</span>
          <span>Valeur : {targetOdds}</span>
        </label>

        <div className="number-input">
          <input
            id="target-odds"
            type="number"
            step="0.10"
            value={targetOdds}
            onChange={(e) => setTargetOdds(e.target.value)}
          />
          <span>DÉC</span>
        </div>
      </div>

      <div className="field-group">
        <span className="field-label">
          Tolérance de convergence
        </span>

        <div className="tolerance-group">
          {["± 1 %", "± 5 %", "± 10 %", "Perso"].map((value) => (
            <button
              key={value}
              type="button"
              className={tolerance === value ? "selected" : ""}
              onClick={() => setTolerance(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="risk-box">
        <div>
          <MaterialIcon>shield</MaterialIcon>
          <div>
            <strong>Profil de risque</strong>
            <span>Kelly Fractionnaire (1/4)</span>
          </div>
        </div>

        <span>Prudent</span>
      </div>

      <button className="generate-button" type="button">
        Générer des scénarios
        <MaterialIcon>bolt</MaterialIcon>
      </button>

      <p className="tool-note">
        Recherche combinatoire bornée sans corrélation intra-match.
      </p>
    </div>
  );
}

function ValueBetsCard() {
  return (
    <div className="tool-card value-card">
      <div className="card-heading">
        <div>
          <MaterialIcon>trending_up</MaterialIcon>
          <h3>Value bets du jour</h3>
        </div>

        <span className="locked-badge">
          <MaterialIcon>lock</MaterialIcon>
          Pro
        </span>
      </div>

      <p>
        Signaux à espérance positive (+EV) calculés par divergence marché.
      </p>

      <div className="blurred-feed">
        <div className="feed-content">
          <div>
            <strong>Atalanta vs AS Roma</strong>
            <span>Edge +6.2 %</span>
          </div>
          <small>Marché 1X2 · Domicile</small>

          <hr />

          <div>
            <strong>Villarreal vs Séville FC</strong>
            <span>Edge +4.8 %</span>
          </div>
        </div>

        <div className="lock-overlay">
          <div className="lock-circle">
            <MaterialIcon>lock</MaterialIcon>
          </div>

          <strong>2 opportunités quantitatives détectées</strong>

          <span>
            Réservé aux comptes d&apos;analyse certifiés Pro &amp; Syndicate.
          </span>
        </div>
      </div>

      <button className="unlock-button" type="button">
        Débloquer les signaux Value Bet
        <MaterialIcon>key</MaterialIcon>
      </button>
    </div>
  );
}

function PremiumCard() {
  return (
    <div className="premium-card">
      <div className="premium-top">
        <span>Accès Institutionnel</span>
        <span className="premium-dot" />
      </div>

      <div>
        <h4>Passez à la vitesse supérieure</h4>
        <p>
          Exploitez toute la puissance des modèles prédictifs continus.
        </p>
      </div>

      <ul>
        <li>
          <MaterialIcon>check_circle</MaterialIcon>
          Simulations Monte Carlo illimitées (100k+ tirages)
        </li>
        <li>
          <MaterialIcon>check_circle</MaterialIcon>
          Moteur Value Bet temps réel & chutes de cotes
        </li>
        <li>
          <MaterialIcon>check_circle</MaterialIcon>
          Optimiseur combiné & tolérance de cote sur mesure
        </li>
        <li>
          <MaterialIcon>check_circle</MaterialIcon>
          Assistant IA conversationnel & explicabilité
        </li>
      </ul>

      <button type="button">
        Activer l&apos;offre Premium (Essai 7 jours)
        <MaterialIcon>verified</MaterialIcon>
      </button>
    </div>
  );
}

function RecentCombinations() {
  return (
    <div className="recent-card">
      <div className="section-header">
        <div>
          <h3>Dernières combinaisons générées</h3>
          <span>
            Historique des assemblages générés par l&apos;algorithme
            d&apos;optimisation
          </span>
        </div>

        <button type="button">
          Voir tout l&apos;historique
          <MaterialIcon>chevron_right</MaterialIcon>
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Horodatage</th>
              <th>Sélections</th>
              <th>Cote Cumulée</th>
              <th>Probabilité Modèle</th>
              <th>Statut</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <strong>Aujourd&apos;hui 14:15</strong>
                <small>Cible 5.00 ± 5%</small>
              </td>
              <td>
                <span className="count">3</span>
                sélections (1X2, BTTS)
              </td>
              <td>
                <strong className="odd-value">4.85</strong>
              </td>
              <td>
                <strong>22.6 %</strong>
                <small>± 2.1 %</small>
              </td>
              <td>
                <span className="status current">
                  <span /> En cours
                </span>
              </td>
            </tr>

            <tr>
              <td>
                <strong>Hier 20:30</strong>
                <small>Cible 3.00 ± 5%</small>
              </td>
              <td>
                <span className="count">2</span>
                sélections (+2.5 buts)
              </td>
              <td>
                <strong className="odd-value">3.20</strong>
              </td>
              <td>
                <strong>36.1 %</strong>
                <small>± 1.9 %</small>
              </td>
              <td>
                <span className="status validated">
                  <span /> Validé
                </span>
              </td>
            </tr>

            <tr>
              <td>
                <strong>22 Mai 18:40</strong>
                <small>Cible 8.00 ± 5%</small>
              </td>
              <td>
                <span className="count">4</span>
                sélections (Mixte)
              </td>
              <td>
                <strong className="odd-value">8.10</strong>
              </td>
              <td>
                <strong>14.2 %</strong>
                <small>± 1.4 %</small>
              </td>
              <td>
                <span className="status failed">
                  <span /> Non validé
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalibrationCard() {
  return (
    <div className="calibration-card">
      <div className="section-header">
        <div>
          <h3>Calibration du modèle</h3>
          <span>Probabilité prédite vs Fréquence observée</span>
        </div>

        <MaterialIcon>insights</MaterialIcon>
      </div>

      <div className="chart-container">
        <svg viewBox="0 0 280 150">
          <line
            className="chart-grid"
            x1="30"
            x2="260"
            y1="20"
            y2="20"
          />
          <line
            className="chart-grid"
            x1="30"
            x2="260"
            y1="65"
            y2="65"
          />
          <line
            className="chart-grid"
            x1="30"
            x2="260"
            y1="110"
            y2="110"
          />

          <line
            className="chart-axis"
            x1="30"
            x2="30"
            y1="20"
            y2="110"
          />

          <line
            className="chart-axis"
            x1="30"
            x2="260"
            y1="110"
            y2="110"
          />

          <line
            className="ideal-line"
            x1="30"
            x2="260"
            y1="110"
            y2="20"
          />

          <polygon
            className="confidence-area"
            points="30,110 70,95 110,80 160,58 210,38 260,20 260,30 210,48 160,70 110,92 70,105 30,110"
          />

          <polyline
            className="observed-line"
            points="30,110 70,98 115,83 160,63 205,44 260,24"
          />

          {[
            [70, 98],
            [115, 83],
            [160, 63],
            [205, 44],
            [260, 24],
          ].map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              className="chart-point"
              cx={cx}
              cy={cy}
              r="3.5"
            />
          ))}

          <text x="30" y="125">0%</text>
          <text x="145" y="125">50%</text>
          <text x="260" y="125">100%</text>
          <text x="15" y="25">1</text>
          <text x="15" y="112">0</text>
        </svg>
      </div>

      <div className="chart-legend">
        <div>
          <span className="legend-line ideal" />
          Diagonale idéale
        </div>

        <div>
          <span className="legend-line observed" />
          Observé (Brier: 0.178)
        </div>

        <span className="confidence-label">IC 95 %</span>
      </div>
    </div>
  );
}

export default function DashboardClient({
  user,
  todayMatches,
  todayTotal,
  tz,
}: {
  user: AuthUser;
  todayMatches: ApiMatch[] | null;
  todayTotal: number;
  tz: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="dashboard">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="dashboard-content">
        <Header user={user} open={menuOpen} onMenuClick={() => setMenuOpen((v) => !v)} />

        <main className="main-content">
          <div className="dashboard-background" />

          <div className="dashboard-container">
            <section className="welcome-section">
              <div>
                <div className="welcome-title">
                  <h1>Bonjour {user.username}</h1>
                  <span>👋</span>

                  <div className="terminal-badge">
                    <span />
                    Terminal v2.4 Actif
                  </div>
                </div>

                <p>
                  Console d&apos;Analyse Quantitative &amp; Probabiliste ·
                  Modèles mathématiques Dixon-Coles calibrés
                </p>
              </div>

              <div className="date-filter">
                <div className="date">
                  <MaterialIcon>calendar_today</MaterialIcon>
                  Aujourd&apos;hui, 24 Mai 2025
                </div>

                <span>8 rencontres analysées par les modèles</span>

                <button type="button" title="Actualiser le flux">
                  <MaterialIcon>sync</MaterialIcon>
                </button>
              </div>
            </section>

            <KpiCards />

            <section className="workspace">
              <div className="matches-column">
                <MatchesToday matches={todayMatches} total={todayTotal} tz={tz} />
              </div>

              <div className="tools-column">
                <TargetOddsCard />
                <ValueBetsCard />
                {hasPremiumAccess(user) ? null : <PremiumCard />}
              </div>
            </section>

            <section className="bottom-section">
              <RecentCombinations />
              <CalibrationCard />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
