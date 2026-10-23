"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import AuthedPage from "@/components/layout/AuthedPage";
import { currentUser } from "@/lib/session";
import styles from "./page.module.css";

type Tolerance = "± 1 %" | "± 5 %" | "± 10 %" | "Perso";

interface MatchRow {
  id: string;
  time: string;
  home: string;
  homeShort: string;
  away: string;
  awayShort: string;
  score: string;
  status: "live" | "upcoming" | "finished";
  league: string;
}

const MATCHES: MatchRow[] = [
  {
    id: "1",
    time: "72'",
    home: "Paris Saint-Germain",
    homeShort: "PSG",
    away: "Olympique de Marseille",
    awayShort: "OM",
    score: "2 - 1",
    status: "live",
    league: "Ligue 1",
  },
  {
    id: "2",
    time: "20:45",
    home: "Olympique Lyonnais",
    homeShort: "OL",
    away: "AS Monaco",
    awayShort: "ASM",
    score: "vs",
    status: "upcoming",
    league: "Ligue 1",
  },
  {
    id: "3",
    time: "18:30",
    home: "Manchester City",
    homeShort: "MCI",
    away: "Liverpool FC",
    awayShort: "LIV",
    score: "2 - 2",
    status: "finished",
    league: "Premier League",
  },
  {
    id: "4",
    time: "21:00",
    home: "Arsenal",
    homeShort: "ARS",
    away: "Chelsea FC",
    awayShort: "CHE",
    score: "vs",
    status: "upcoming",
    league: "Premier League",
  },
];

const COMBINATIONS = [
  {
    timestamp: "Aujourd'hui 14:15",
    target: "Cible 5.00 ± 5%",
    selections: 3,
    selectionLabel: "sélections (1X2, BTTS)",
    odd: "4.85",
    prob: "22.6 %",
    probMargin: "± 2.1 %",
    status: "En cours",
    statusColor: "bg-surface-container-high text-on-surface",
    dotColor: "bg-on-tertiary-container",
  },
  {
    timestamp: "Hier 20:30",
    target: "Cible 3.00 ± 5%",
    selections: 2,
    selectionLabel: "sélections (+2.5 buts)",
    odd: "3.20",
    prob: "36.1 %",
    probMargin: "± 1.9 %",
    status: "Validé",
    statusColor: "bg-surface-container-high text-on-surface",
    dotColor: "bg-primary",
  },
  {
    timestamp: "22 Mai 18:40",
    target: "Cible 8.00 ± 5%",
    selections: 4,
    selectionLabel: "sélections (Mixte)",
    odd: "8.10",
    prob: "14.2 %",
    probMargin: "± 1.4 %",
    status: "Non validé",
    statusColor: "bg-surface-variant text-on-surface-variant",
    dotColor: "bg-secondary",
  },
];

function MatchRowComponent({ match }: { match: MatchRow }) {
  const statusConfig: Record<
    MatchRow["status"],
    { label: string; badge: string; dot: string }
  > = {
    live: {
      label: "EN DIRECT",
      badge: "bg-red-100 text-red-700",
      dot: "bg-red-500 animate-pulse",
    },
    upcoming: {
      label: "À venir",
      badge: "bg-[#f1f5f9] text-[#475569]",
      dot: "",
    },
    finished: {
      label: "Terminé",
      badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      dot: "",
    },
  } as Record<
    MatchRow["status"],
    { label: string; badge: string; dot: string }
  >;

  const status = statusConfig[match.status];

  return (
    <div
      className={`${styles.matchRow} flex flex-col sm:flex-row items-center justify-between p-4 gap-3 cursor-pointer group`}
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2 min-w-[70px]">
          <span
            className={`font-code-sm text-xs ${
              match.status === "live"
                ? "font-semibold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200"
                : "font-medium text-secondary"
            }`}
          >
            {match.time}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#f1f5f9] flex items-center justify-center font-bold text-xs text-on-surface">
              {match.homeShort}
            </span>
            <span className="font-medium text-sm text-on-surface hidden md:inline">
              {match.home}
            </span>
          </div>
          <div className="px-2.5 py-0.5 rounded-md bg-[#0f172a] text-white font-code-sm text-xs font-bold tracking-widest">
            {match.score}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-on-surface hidden md:inline">
              {match.away}
            </span>
            <span className="w-7 h-7 rounded-lg bg-[#f1f5f9] flex items-center justify-center font-bold text-xs text-on-surface">
              {match.awayShort}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.badge}`}
        >
          {status.dot && (
            <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
          )}
          {status.label}
        </span>
        <span className="font-code-sm text-xs text-secondary hidden lg:inline">
          {match.league}
        </span>
        <span className="material-symbols-outlined text-[18px] text-secondary chevronRight group-hover:text-primary group-hover:translate-x-0.5 transition-all">
          chevron_right
        </span>
      </div>
    </div>
  );
}

export default async function MatchesPage() {
  const user = await currentUser();
  const [showEmpty, setShowEmpty] = useState(false);
  const [tolerance, setTolerance] = useState<Tolerance>("± 5 %");

  const handleToleranceChange = useCallback((val: Tolerance) => {
    setTolerance(val);
  }, []);

  return (
    <AuthedPage>
      <div className="relative pt-24 min-h-screen bg-surface w-full px-space-lg py-space-lg">
        <div className="flex flex-col w-full">
          <div className="relative w-full space-y-space-xl pb-space-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-40 [mask-image:radial-gradient(ellipse_at_top,white,transparent_75%)]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #dce2f3 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>

            <section className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    Bonjour {user?.username ?? "Thomas"}
                  </span>
                  <span className="text-2xl animate-bounce">👋</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-code-sm text-code-sm ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-ping"></span>
                    Terminal v2.4 Actif
                  </span>
                </div>
                <p className="font-body-md text-body-md text-secondary">
                  Console d'Analyse Quantitative &amp; Probabiliste · Modèles mathématiques Dixon-Coles calibrés
                </p>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-lowest p-1.5 rounded-xl shadow-sm self-start md:self-auto">
                <div className="flex items-center gap-2 px-space-sm py-1.5 rounded-lg bg-surface-container-low text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">calendar_today</span>
                  <span className="font-label-md text-label-md font-semibold">Aujourd'hui, 24 Mai 2025</span>
                </div>
                <div className="hidden sm:flex items-center px-2 py-1 text-secondary font-code-sm text-code-sm">
                  <span>8 rencontres analysées par les modèles</span>
                </div>
                <button className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors" type="button" title="Actualiser le flux">
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                </button>
              </div>
            </section>
            <section className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
              <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <div className="flex items-start justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Matchs aujourd'hui</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">sports_soccer</span>
                  </div>
                </div>
                <div className="mt-space-md">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">14</span>
                    <span className="font-code-sm text-code-sm text-on-tertiary-container font-medium">8 sous modèle quant</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary mt-1">Ligue 1, Premier League, La Liga</p>
                </div>
                <div className="w-full bg-surface-container-high h-1 rounded-full mt-space-md overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: "57%" }}></div>
                </div>
              </div>

              <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <div className="flex items-start justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Prédictions restantes</span>
                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm uppercase bg-surface-container-high text-on-secondary-container">Quota Free</span>
                </div>
                <div className="mt-space-md">
                  <div className="flex items-baseline justify-between">
                    <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">3 <span className="font-headline-md text-headline-md text-outline font-normal">/ 5</span></span>
                    <span className="font-code-sm text-code-sm text-secondary">60 % utilisé</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden p-0.5">
                    <div className="h-full rounded-full bg-gradient-to-r from-on-tertiary-container to-secondary" style={{ width: "60%" }}></div>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span> Réinitialisation à 00:00 UTC
                  </p>
                </div>
              <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <div className="flex items-start justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Précision modèle (30 j)</span>
                  <span className="px-2 py-0.5 rounded font-code-sm text-label-sm bg-surface-container-low text-on-surface">Dixon-Coles + MC</span>
                </div>
                <div className="mt-space-md">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">68.4 %</span>
                    <span className="inline-flex items-center text-on-tertiary-container font-code-sm text-code-sm">± 1.8 %</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="font-body-sm text-body-sm text-secondary">Brier Score calibré :</span>
                    <span className="font-code-sm text-code-sm font-semibold text-on-surface bg-surface-container px-1.5 py-0.5 rounded">0.178</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high h-1 rounded-full mt-space-sm overflow-hidden">
                  <div className="bg-on-tertiary-container h-full rounded-full" style={{ width: "68%" }}></div>
                </div>
              </div>

              <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <div className="flex items-start justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">ROI simulé backtesté</span>
                  <div className="flex items-center gap-1 text-on-primary-fixed bg-surface-container-high px-2 py-0.5 rounded-full font-code-sm text-label-sm">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    <span>+1.4 % ce mois</span>
                  </div>
                </div>
                <div className="mt-space-md">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">+8.62 %</span>
                    <span className="font-body-sm text-body-sm text-secondary">plat</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary mt-1">Sur 1 420 sélections quantifiées</p>
                </div>
                <div className="w-full bg-surface-container-high h-1 rounded-full mt-space-md overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: "82%" }}></div>
                </div>
              </div>
            <section className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-[#cbd5e1]/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#0f766e]" style={{ backgroundColor: "#f0fdfa" }}>
                      <span className="material-symbols-outlined text-[20px]" style={{ color: "#0f766e" }}>sports_soccer</span>
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">Matchs du jour</h2>
                      <p className="font-body-sm text-body-sm text-secondary">Calendrier &amp; suivi en direct des rencontres majeures</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#f1f5f9] p-1 rounded-xl text-xs font-medium">
                      <button
                        className={`px-2.5 py-1 rounded-lg ${!showEmpty ? "bg-white text-on-surface font-semibold shadow-sm transition-all" : "text-secondary hover:text-on-surface transition-all"}`}
                        type="button"
                        onClick={() => setShowEmpty(false)}
                      >
                        Aujourd'hui (4)
                      </button>
                      <button
                        className={`px-2.5 py-1 rounded-lg ${showEmpty ? "bg-white text-on-surface font-semibold shadow-sm transition-all" : "text-secondary hover:text-on-surface transition-all"}`}
                        type="button"
                        onClick={() => setShowEmpty(true)}
                      >
                        Vue sans match
                      </button>
                    </div>
                    <a className="inline-flex items-center gap-1 text-sm font-semibold hover:underline transition-all ml-1" href="#" style={{ color: "#0f766e" }}>
                      <span>Voir tout</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
                <div className={`bg-surface-container-lowest rounded-2xl shadow-sm border border-[#cbd5e1]/60 divide-y divide-[#f1f5f9] overflow-hidden ${!showEmpty ? "" : "hidden"}`} id="matches-list-container">
                  {MATCHES.map((match) => (
                    <MatchRowComponent key={match.id} match={match} />
                  ))}
                </div>

                <div className={`hidden bg-surface-container-lowest rounded-2xl p-10 shadow-sm border border-[#cbd5e1]/60 flex flex-col items-center justify-center text-center gap-4 ${showEmpty ? "" : "hidden"}`} id="matches-empty-container">
                  <div className="w-16 h-16 rounded-2xl bg-[#f1f5f9] flex items-center justify-center text-secondary mb-1">
                    <span className="material-symbols-outlined text-[32px] text-secondary">event_busy</span>
                  </div>
                  <div className="max-w-sm flex flex-col gap-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Aucun match aujourd'hui</h3>
                    <p className="font-body-sm text-body-sm text-secondary leading-relaxed">
                      Aucune rencontre majeure n'est programmée pour cette journée. Consultez les prochains rendez-vous de la semaine dans le calendrier.
                    </p>
                  </div>
                  <button className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all shadow-sm" style={{ backgroundColor: "#0f766e" }} type="button">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span>Voir le calendrier complet</span>
                  </button>
                </div>
              <div className="lg:col-span-4 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-on-tertiary-container">filter_center_focus</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Cote cible rapide</h3>
                    </div>
                    <span className="font-code-sm text-label-sm bg-surface-container-low px-2 py-0.5 rounded text-secondary font-medium">Algorithme Greedy</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary">Générez des assemblages optimisés mathématiquement selon votre horizon de risque.</p>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-medium flex justify-between" htmlFor="target-odds">
                      <span>Cote globale recherchée</span>
                      <span className="font-code-sm text-code-sm text-secondary">Valeur : 5.50</span>
                    </label>
                    <div className="relative">
                      <input className="w-full h-11 px-3 rounded-lg bg-surface-container-low font-headline-sm text-headline-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest transition-all" id="target-odds" step="0.10" type="number" defaultValue="5.50" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-code-sm text-code-sm text-secondary">DÉC</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="font-label-md text-label-md text-on-surface font-medium">Tolérance de convergence</span>
                    <div className={`grid grid-cols-4 gap-1 p-1 bg-surface-container-low rounded-lg text-center ${styles.toleranceGroup}`} id="tolerance-group">
                      {["± 1 %", "± 5 %", "± 10 %", "Perso"].map((val) => (
                        <button
                          key={val}
                          className={`py-1 rounded font-code-sm text-code-sm ${
                            tolerance === val
                              ? "bg-surface-container-lowest shadow-sm text-on-surface font-semibold"
                              : "text-secondary hover:text-on-surface"
                          }`}
                          type="button"
                          onClick={() => handleToleranceChange(val as Tolerance)}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-surface-container-low p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">shield</span>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-medium">Profil de risque</span>
                        <span className="font-code-sm text-body-sm text-secondary">Kelly Fractionnaire (1/4)</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-high text-on-surface font-semibold">Prudent</span>
                  </div>

                  <button className="w-full h-11 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center justify-center gap-2 shadow-sm" type="button">
                    <span>Générer des scénarios</span>
                <div className="relative bg-surface-container-lowest rounded-xl p-space-lg shadow-sm overflow-hidden flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-on-tertiary-container">trending_up</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Value bets du jour</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded font-label-sm text-label-sm uppercase bg-surface-container-high text-on-surface font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">lock</span> Pro
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary">Signaux à espérance positive (+EV) calculés par divergence marché.</p>

                  <div className="relative mt-2 p-3 rounded-lg bg-surface-container-low flex flex-col gap-2.5 select-none overflow-hidden">
                    <div className="filter blur-sm opacity-60 flex flex-col gap-2 pointer-events-none">
                      <div className="flex justify-between items-center">
                        <span className="font-label-md text-label-md font-semibold">Atalanta vs AS Roma</span>
                        <span className="font-code-sm text-code-sm font-bold bg-surface-container px-2 py-0.5 rounded">Edge +6.2 %</span>
                      </div>
                      <div className="flex justify-between items-center text-secondary font-code-sm text-body-sm">
                        <span>Marché 1X2 · Domicile</span>
                        <span>EV+ : 1.11 | Kelly 2.3%</span>
                      </div>
                      <hr className="border-outline-variant/30 my-1" />
                      <div className="flex justify-between items-center">
                        <span className="font-label-md text-label-md font-semibold">Villarreal vs Séville FC</span>
                        <span className="font-code-sm text-code-sm font-bold bg-surface-container px-2 py-0.5 rounded">Edge +4.8 %</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-space-md text-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
                        <span className="material-symbols-outlined text-[22px]">lock</span>
                      </div>
                      <span className="font-label-md text-label-md font-semibold text-on-surface">2 opportunités quantitatives détectées</span>
                      <span className="font-body-sm text-body-sm text-secondary">Réservé aux comptes d'analyse certifiés Pro &amp; Syndicate.</span>
                    </div>
                  </div>

                  <button className="w-full mt-2 h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all flex items-center justify-center gap-1.5" type="button">
                    <span>Débloquer les signaux Value Bet</span>
                    <span className="material-symbols-outlined text-[16px]">key</span>
                <div className="relative bg-primary text-on-primary rounded-xl p-space-lg shadow-md flex flex-col gap-space-md overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-surface-variant/20 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-primary-container font-semibold">Accès Institutionnel</span>
                    <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-headline-sm text-headline-sm text-on-primary font-semibold">Passez à la vitesse supérieure</h4>
                    <p className="font-body-sm text-body-sm text-on-primary-container">Exploitez toute la puissance des modèles prédictifs continus.</p>
                  </div>
                  <ul className="flex flex-col gap-2 font-label-md text-label-md text-on-primary">
                    {[
                      "Simulations Monte Carlo illimitées (100k+ tirages)",
                      "Moteur Value Bet temps réel &amp; chutes de cotes",
                      "Optimiseur combiné &amp; tolérance de cote sur mesure",
                      "Assistant IA conversationnel &amp; explicabilité",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px] text-on-tertiary-container flex-shrink-0">check_circle</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full h-11 rounded-lg bg-on-primary text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-low transition-all shadow-sm flex items-center justify-center gap-2 mt-1" type="button">
                    <span>Activer l'offre Premium (Essai 7 jours)</span>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </button>
                </div>
              </div>
            </section>
            <section className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
              <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between pb-space-sm">
                  <div className="flex flex-col">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Dernières combinaisons générées</h3>
                    <span className="font-body-sm text-body-sm text-secondary">Historique des assemblages générés par l'algorithme d'optimisation</span>
                  </div>
                  <button className="font-label-md text-label-md text-on-surface hover:text-secondary transition-colors flex items-center gap-1" type="button">
                    <span>Voir tout l'historique</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-2.5 px-3 rounded-l-lg">Horodatage</th>
                        <th className="py-2.5 px-3">Sélections</th>
                        <th className="py-2.5 px-3">Cote Cumulée</th>
                        <th className="py-2.5 px-3">Probabilité Modèle</th>
                        <th className="py-2.5 px-3 rounded-r-lg text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low font-body-md text-body-md text-on-surface">
                      {COMBINATIONS.map((c, i) => (
                        <tr key={i} className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-on-surface">{c.timestamp}</span>
                              <span className="font-code-sm text-body-sm text-secondary">{c.target}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-sm text-code-sm font-semibold">{c.selections}</span>
                              <span className="font-label-md text-label-md">{c.selectionLabel}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-code-sm text-code-sm font-bold bg-surface-container-high px-2 py-0.5 rounded">{c.odd}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <span className="font-code-sm text-code-sm font-semibold text-on-surface">{c.prob}</span>
                              <span className="font-code-sm text-body-sm text-secondary">{c.probMargin}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${c.statusColor} text-label-sm text-label-sm font-semibold`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${c.dotColor}`}></span>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Calibration du modèle</h3>
                    <span className="font-body-sm text-body-sm text-secondary">Probabilité prédite vs Fréquence observée</span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[20px]">insights</span>
                </div>
                <div className="relative w-full h-44 my-space-xs flex items-center justify-center bg-surface-container-low rounded-lg p-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 280 150">
                    <line stroke="#dce2f3" strokeDasharray="2,2" strokeWidth={1} x1="30" x2="260" y1="20" y2="20" />
                    <line stroke="#dce2f3" strokeDasharray="2,2" strokeWidth={1} x1="30" x2="260" y1="65" y2="65" />
                    <line stroke="#dce2f3" strokeDasharray="2,2" strokeWidth={1} x1="30" x2="260" y1="110" y2="110" />
                    <line stroke="#c6c6cd" strokeWidth={1.5} x1="30" x2="30" y1="20" y2="110" />
                    <line stroke="#c6c6cd" strokeWidth={1.5} x1="30" x2="260" y1="110" y2="110" />
                    <line stroke="#76777d" strokeDasharray="4,3" strokeWidth={1.5} x1="30" x2="260" y1="110" y2="20" />
                    <polygon fill="#000000" fillOpacity={0.04} points="30,110 70,95 110,80 160,58 210,38 260,20 260,30 210,48 160,70 110,92 70,105 30,110" />
                    <polyline fill="none" points="30,110 70,98 115,83 160,63 205,44 260,24" stroke="#000000" strokeLinecap="round" strokeWidth={2.5} />
                    <circle className={`${styles.calibrationCircle}`} cx="70" cy="98" r={3.5} strokeWidth={2} />
                    <circle className={`${styles.calibrationCircle}`} cx="115" cy="83" r={3.5} strokeWidth={2} />
                    <circle className={`${styles.calibrationCircle}`} cx="160" cy="63" r={3.5} strokeWidth={2} />
                    <circle className={`${styles.calibrationCircle}`} cx="205" cy="44" r={3.5} strokeWidth={2} />
                    <circle className={`${styles.calibrationCircle}`} cx="260" cy="24" r={3.5} strokeWidth={2} />
                    <text fill="#76777d" fontFamily="Inter" fontSize={9} textAnchor="middle" x="30" y="125">0%</text>
                    <text fill="#76777d" fontFamily="Inter" fontSize={9} textAnchor="middle" x="145" y="125">50%</text>
                    <text fill="#76777d" fontFamily="Inter" fontSize={9} textAnchor="middle" x="260" y="125">100%</text>
                    <text fill="#76777d" fontFamily="Inter" fontSize={9} textAnchor="middle" x="15" y="25">1</text>
                    <text fill="#76777d" fontFamily="Inter" fontSize={9} textAnchor="middle" x="15" y="112">0</text>
                  </svg>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-secondary font-code-sm text-body-sm">
                    <span className="w-3 h-0.5 bg-outline inline-block"></span>
                    <span>Diagonale idéale</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface font-code-sm text-body-sm">
                    <span className="w-3 h-1 bg-primary rounded-full inline-block"></span>
                    <span>Observé (Brier: 0.178)</span>
                  </div>
                  <span className="font-code-sm text-body-sm text-secondary bg-surface-container-low px-1.5 py-0.5 rounded">IC 95 %</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AuthedPage>
  );
}
