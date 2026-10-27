"use client";

import { useState } from "react";
import styles from "./page.module.css";

type DemoState = "nominal" | "partial" | "empty" | "loading" | "error";
type VenueFilter = "all" | "home" | "away";

export default function TeamsPage() {
  const [windowSize, setWindowSize] = useState(5);
  const [venueFilter, setVenueFilter] = useState<VenueFilter>("all");
  const [demoState, setDemoState] = useState<DemoState>("nominal");
  const [retrying, setRetrying] = useState(false);

  const scrollToDemo = () => {
    document.getElementById("demoSection")?.scrollIntoView({ behavior: "smooth" });
  };

  const retryDemoFetch = () => {
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      setDemoState("nominal");
    }, 600);
  };

  return (
    <div className={styles.page}>


<aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[#cbd5e1] z-50 flex flex-col justify-between select-none">
<div className="flex flex-col">

<div className="h-16 px-5 border-b border-[#cbd5e1] flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-9 h-9 rounded-xl bg-[#0f766e] flex items-center justify-center text-white shadow-sm">
<span className="material-symbols-outlined text-[22px]">query_stats</span>
</div>
<div className="flex flex-col">
<span className="text-[15px] font-bold tracking-tight text-[#0f172a] leading-none">Pronostique</span>
<span className="text-[10px] font-semibold text-[#0f766e] tracking-wider uppercase mt-1">QUANT ENGINE</span>
</div>
</div>
<span className="text-[11px] font-medium bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded border border-[#cbd5e1]">v2.4</span>
</div>

<div className="px-3 py-4">
<div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider px-3 mb-2">Analyse &amp; Modélisation</div>
<nav className="flex flex-col space-y-1">
<a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors" href="#">
<span className="material-symbols-outlined text-[20px] text-[#64748b]">grid_view</span>
<span className="font-medium">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors" href="#">
<span className="material-symbols-outlined text-[20px] text-[#64748b]">sports_soccer</span>
<span className="font-medium">Sports</span>
</a>
<a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors" href="#">
<span className="material-symbols-outlined text-[20px] text-[#64748b]">trophy</span>
<span className="font-medium">Compétitions</span>
</a>

<a className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold bg-[#ccfbf1] text-[#0f766e] border-l-4 border-[#0f766e] shadow-xs" href="#">
<span className="material-symbols-outlined text-[20px] text-[#0f766e]" style={{fontVariationSettings: "'FILL' 1"}}>groups</span>
<span>Équipes</span>
</a>
<a className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors" href="#">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-[20px] text-[#64748b]">trending_up</span>
<span className="font-medium">Value bets</span>
</div>
<span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#0f172a] text-white px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[11px]">lock</span>PRO
            </span>
</a>
<a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors" href="#">
<span className="material-symbols-outlined text-[20px] text-[#64748b]">alt_route</span>
<span className="font-medium">Combinaisons</span>
</a>
<a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors" href="#">
<span className="material-symbols-outlined text-[20px] text-[#64748b]">adjust</span>
<span className="font-medium">Cote cible</span>
</a>
<a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors" href="#">
<span className="material-symbols-outlined text-[20px] text-[#64748b]">history</span>
<span className="font-medium">Historique</span>
</a>
</nav>
</div>
</div>

<div className="p-3 border-t border-[#cbd5e1] flex flex-col gap-2.5 bg-[#f8fafc]">
<div className="p-2.5 rounded-xl bg-white border border-[#cbd5e1] flex flex-col gap-1">
<div className="flex items-center justify-between text-[11px] font-semibold text-[#475569] uppercase tracking-wide">
<span>Flux API Quant</span>
<span className="flex h-2 w-2 relative">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f766e] opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f766e]"></span>
</span>
</div>
<span className="text-[12px] font-mono text-[#0f172a]">Latence: 42ms · Synchronisé</span>
</div>
<div className="flex items-center justify-between text-[#475569] px-1 text-[11px]">
<span>© 2024 Quant Engine</span>
<span className="material-symbols-outlined text-[16px] text-[#64748b]">terminal</span>
</div>
</div>
</aside>

<div className="pl-64 flex flex-col min-h-screen">

<header className="fixed top-0 left-64 right-0 z-40 bg-white border-b border-[#cbd5e1]">
<div className="h-16 px-6 flex items-center justify-between gap-4">

<div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">

<button className="h-9 px-4 rounded-full bg-[#0f766e] text-white text-[13px] font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0" type="button">
<span className="material-symbols-outlined text-[18px]">sports_soccer</span>
<span>Football</span>
</button>

<button className="h-9 px-4 rounded-full bg-[#f1f5f9] text-[#94a3b8] text-[13px] font-medium flex items-center gap-1.5 cursor-not-allowed border border-[#cbd5e1] shrink-0" disabled type="button">
<span className="material-symbols-outlined text-[18px]">sports_basketball</span>
<span>Basketball</span>
<span className="text-[10px] bg-[#e2e8f0] text-[#64748b] px-1.5 py-0.2 rounded font-medium ml-0.5">Bientôt</span>
</button>
<button className="h-9 px-4 rounded-full bg-[#f1f5f9] text-[#94a3b8] text-[13px] font-medium flex items-center gap-1.5 cursor-not-allowed border border-[#cbd5e1] shrink-0" disabled type="button">
<span className="material-symbols-outlined text-[18px]">sports_tennis</span>
<span>Tennis</span>
<span className="text-[10px] bg-[#e2e8f0] text-[#64748b] px-1.5 py-0.2 rounded font-medium ml-0.5">Bientôt</span>
</button>
<button className="h-9 px-4 rounded-full bg-[#f1f5f9] text-[#94a3b8] text-[13px] font-medium flex items-center gap-1.5 cursor-not-allowed border border-[#cbd5e1] shrink-0" disabled type="button">
<span className="material-symbols-outlined text-[18px]">sports_volleyball</span>
<span>Volleyball</span>
<span className="text-[10px] bg-[#e2e8f0] text-[#64748b] px-1.5 py-0.2 rounded font-medium ml-0.5">Bientôt</span>
</button>
</div>

<div className="flex items-center gap-3 shrink-0">
<button className="h-9 px-3.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white text-[13px] font-semibold flex items-center gap-2 transition-colors shadow-xs" type="button">
<span className="material-symbols-outlined text-[18px] text-amber-400">workspace_premium</span>
<span>Passer Premium</span>
</button>
<div className="h-6 w-px bg-[#cbd5e1] mx-0.5"></div>
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-full bg-[#0f766e] text-white flex items-center justify-center font-bold text-[13px]">
              TM
            </div>
<div className="flex flex-col text-left leading-tight hidden sm:flex">
<span className="text-[13px] font-bold text-[#0f172a]">Thomas Moreau</span>
<span className="text-[11px] text-[#475569]">Analyste Free</span>
</div>
</div>
<button className="p-2 rounded-xl text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors" title="Déconnexion" type="button">
<span className="material-symbols-outlined text-[20px]">logout</span>
</button>
</div>
</div>

<div className="bg-[#f1f5f9] border-t border-[#cbd5e1] px-6 py-1.5 flex items-center justify-center gap-2 text-center">
<span className="material-symbols-outlined text-[15px] text-amber-600">warning</span>
<span className="text-[11px] text-[#475569] font-medium tracking-wide">
          Les pronostics sont des probabilités, jamais des certitudes. 18+ · Jouez de façon responsable.
        </span>
</div>
</header>

<main className="pt-28 pb-16 px-6 sm:px-8 max-w-7xl w-full mx-auto flex-1"><div className="flex flex-col w-full space-y-8">
<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
<div>
<div className="flex items-center gap-2 text-label-sm font-label-sm uppercase tracking-wider text-secondary mb-1">
<span>Composant Quant Modulaire</span>
<span className="w-1 h-1 rounded-full bg-surface-variant"></span>
<span className="text-on-surface font-semibold">Spécification v2.4</span>
</div>
<h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">Forme récente</h1>
<p className="text-body-md font-body-md text-secondary mt-1">
        Architecture analytique et métriques fréquentielles standardisées pour les fiches équipes et aperçus d'avant-match.
      </p>
</div>
<div className="flex items-center gap-2 self-start sm:self-auto bg-surface-container-low p-1.5 rounded-xl">
<span className="text-label-sm font-label-sm text-secondary px-2">Mode démonstration :</span>
<button className="px-3 py-1.5 bg-surface-container-lowest text-on-surface text-label-md font-label-md rounded-lg shadow-sm hover:bg-surface transition-all flex items-center gap-1.5" onClick={scrollToDemo} type="button">
<span className="material-symbols-outlined text-[16px] text-teal-700">tune</span>
<span>Sandbox d'états</span>
</button>
</div>
</div>
<section className="space-y-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
<h2 className="text-headline-sm font-headline-sm text-on-surface">Cas d'usage A : Vue Fiche Équipe</h2>
</div>
<span className="text-label-sm font-label-sm text-secondary bg-surface-container px-2.5 py-1 rounded-full">Layout Dashboard 2/3 + 1/3</span>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
<div className="lg:col-span-8 space-y-4">
<div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-sm transition-all relative overflow-hidden" id="mainTeamCard">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
<div className="flex items-center gap-3.5">
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-headline-sm font-headline-sm text-teal-800 shadow-sm shrink-0">
                PSG
              </div>
<div>
<div className="flex items-center gap-2">
<h3 className="text-headline-sm font-headline-sm text-on-surface">Paris Saint-Germain</h3>
<span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container-low text-secondary font-medium">Ligue 1</span>
</div>
<div className="flex items-center gap-2 text-body-sm font-body-sm text-secondary mt-0.5">
<span className="material-symbols-outlined text-[15px] text-teal-700">sync</span>
<span id="syncText">{`Calculé sur les ${windowSize} dernières rencontres officielles`}</span>
</div>
</div>
</div>
<div className="flex flex-wrap items-center gap-2">
<div className="inline-flex p-1 bg-surface-container-low rounded-xl" id="matchWindowSelector">
<button className={`window-btn px-3 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${windowSize === 5 ? "bg-accent text-teal-800 font-semibold shadow-xs" : "text-secondary hover:text-on-surface"}`} onClick={() => setWindowSize(5)} type="button">5 m.</button>
<button className={`window-btn px-3 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${windowSize === 10 ? "bg-accent text-teal-800 font-semibold shadow-xs" : "text-secondary hover:text-on-surface"}`} onClick={() => setWindowSize(10)} type="button">10 m.</button>
<button className={`window-btn px-3 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${windowSize === 20 ? "bg-accent text-teal-800 font-semibold shadow-xs" : "text-secondary hover:text-on-surface"}`} onClick={() => setWindowSize(20)} type="button">20 m.</button>
</div>
<div className="inline-flex p-1 bg-surface-container-low rounded-xl" id="matchVenueSelector">
<button className={`venue-btn px-3 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${venueFilter === "all" ? "bg-accent text-teal-800 font-semibold shadow-xs" : "text-secondary hover:text-on-surface"}`} onClick={() => setVenueFilter("all")} type="button">Tous</button>
<button className={`venue-btn px-3 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${venueFilter === "home" ? "bg-accent text-teal-800 font-semibold shadow-xs" : "text-secondary hover:text-on-surface"}`} onClick={() => setVenueFilter("home")} type="button">Domicile</button>
<button className={`venue-btn px-3 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${venueFilter === "away" ? "bg-accent text-teal-800 font-semibold shadow-xs" : "text-secondary hover:text-on-surface"}`} onClick={() => setVenueFilter("away")} type="button">Extérieur</button>
</div>
</div>
</div>
<div className="py-4 my-1">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
<div>
<div className="flex items-center gap-2 mb-2.5">
<span className="text-label-sm font-label-sm uppercase tracking-wider text-secondary font-semibold">Trajectoire récente</span>
<span className="text-body-sm font-body-sm text-secondary">· du plus récent au plus ancien</span>
</div>
<div className="flex items-center gap-2.5 overflow-x-auto pb-1" id="psgFormRow">
<div className="group relative flex flex-col items-center">
<span className="text-[10px] font-label-sm uppercase font-bold text-teal-700 mb-1">Réc.</span>
<button className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-headline-sm font-headline-sm shadow-xs transition-transform active:scale-95 cursor-default" type="button">
                      V
                    </button>
<div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-container text-on-primary text-[11px] font-label-sm py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                      2 - 1 vs Marseille (D)
                    </div>
</div>
<div className="group relative flex flex-col items-center">
<span className="text-[10px] font-label-sm text-transparent mb-1">-</span>
<button className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-headline-sm font-headline-sm shadow-xs transition-transform active:scale-95 cursor-default" type="button">
                      V
                    </button>
<div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-container text-on-primary text-[11px] font-label-sm py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                      3 - 0 vs Rennes (E)
                    </div>
</div>
<div className="group relative flex flex-col items-center">
<span className="text-[10px] font-label-sm text-transparent mb-1">-</span>
<button className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-headline-sm font-headline-sm shadow-xs transition-transform active:scale-95 cursor-default" type="button">
                      V
                    </button>
<div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-container text-on-primary text-[11px] font-label-sm py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                      4 - 1 vs Montpellier (D)
                    </div>
</div>
<div className="group relative flex flex-col items-center">
<span className="text-[10px] font-label-sm text-transparent mb-1">-</span>
<button className="w-11 h-11 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-headline-sm font-headline-sm shadow-xs transition-transform active:scale-95 cursor-default" type="button">
                      N
                    </button>
<div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-container text-on-primary text-[11px] font-label-sm py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                      1 - 1 vs Lille (E)
                    </div>
</div>
<div className="group relative flex flex-col items-center">
<span className="text-[10px] font-label-sm text-transparent mb-1">-</span>
<button className="w-11 h-11 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-headline-sm font-headline-sm shadow-xs transition-transform active:scale-95 cursor-default" type="button">
                      D
                    </button>
<div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-container text-on-primary text-[11px] font-label-sm py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                      0 - 1 vs Lens (E)
                    </div>
</div>
</div>
</div>
<div className="flex flex-col sm:items-end justify-center">
<div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent text-teal-800">
<span className="material-symbols-outlined text-[20px] text-teal-700" style={{fontVariationSettings: "'FILL' 1"}}>local_fire_department</span>
<div className="flex flex-col text-left leading-tight">
<span className="text-label-sm font-label-sm font-bold uppercase tracking-wider text-teal-900">Série en cours</span>
<span className="text-label-md font-label-md font-semibold">3 victoires consécutives</span>
</div>
</div>
<span className="text-[11px] font-body-sm text-secondary mt-1.5">10 pts glanés sur 15 possibles (66.7%)</span>
</div>
</div>
</div>
<div className="pt-6">
<div className="flex items-center justify-between mb-3.5">
<span className="text-label-sm font-label-sm uppercase tracking-wider text-secondary font-semibold">Indicateurs de performance quant</span>
<span className="text-body-sm font-body-sm text-secondary">Échantillon : L1 &amp; UCL (saison 2024/25)</span>
</div>
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" id="metricsGrid">
<div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-secondary">
<span className="text-label-sm font-label-sm">Points / match</span>
<span className="material-symbols-outlined text-[17px] text-teal-700">speed</span>
</div>
<div className="my-2">
<span className="text-headline-md font-headline-md text-on-surface">2.40</span>
<span className="text-body-sm font-body-sm text-secondary">pts</span>
</div>
<div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
<div className="bg-teal-700 h-full rounded-full" style={{width: "80%"}}></div>
</div>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-secondary">
<span className="text-label-sm font-label-sm">Buts marqués</span>
<span className="material-symbols-outlined text-[17px] text-emerald-600">sports_soccer</span>
</div>
<div className="my-2">
<span className="text-headline-md font-headline-md text-on-surface">2.20</span>
<span className="text-body-sm font-body-sm text-secondary">/ match</span>
</div>
<span className="text-body-sm font-body-sm text-secondary font-medium">11 buts cumulés</span>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-secondary">
<span className="text-label-sm font-label-sm">Buts concédés</span>
<span className="material-symbols-outlined text-[17px] text-rose-500">shield</span>
</div>
<div className="my-2">
<span className="text-headline-md font-headline-md text-on-surface">0.60</span>
<span className="text-body-sm font-body-sm text-secondary">/ match</span>
</div>
<span className="text-body-sm font-body-sm text-secondary font-medium">3 buts cumulés</span>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-secondary">
<span className="text-label-sm font-label-sm">Clean sheets</span>
<span className="material-symbols-outlined text-[17px] text-teal-700">lock</span>
</div>
<div className="my-2">
<span className="text-headline-md font-headline-md text-on-surface">60%</span>
<span className="text-body-sm font-body-sm text-secondary">(3/5)</span>
</div>
<span className="text-body-sm font-body-sm text-secondary font-medium">Cage inviolée</span>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-secondary">
<span className="text-label-sm font-label-sm">Sans marquer</span>
<span className="material-symbols-outlined text-[17px] text-secondary">cancel_presentation</span>
</div>
<div className="my-2">
<span className="text-headline-md font-headline-md text-on-surface">0%</span>
<span className="text-body-sm font-body-sm text-secondary">(0/5)</span>
</div>
<span className="text-body-sm font-body-sm text-secondary font-medium">Marque tjs au moins 1</span>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-secondary">
<span className="text-label-sm font-label-sm">BTTS (Deux marquent)</span>
<span className="material-symbols-outlined text-[17px] text-secondary">sync_alt</span>
</div>
<div className="my-2">
<span className="text-headline-md font-headline-md text-on-surface">40%</span>
<span className="text-body-sm font-body-sm text-secondary">(2/5)</span>
</div>
<span className="text-body-sm font-body-sm text-secondary font-medium">Fréquence modérée</span>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-secondary">
<span className="text-label-sm font-label-sm">+2.5 Buts totaux</span>
<span className="material-symbols-outlined text-[17px] text-teal-700">expand_less</span>
</div>
<div className="my-2">
<span className="text-headline-md font-headline-md text-on-surface">60%</span>
<span className="text-body-sm font-body-sm text-secondary">(3/5)</span>
</div>
<span className="text-body-sm font-body-sm text-secondary font-medium">3 matchs à haut score</span>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
<div className="flex items-center justify-between text-secondary">
<span className="text-label-sm font-label-sm">xG Diff. moyen</span>
<span className="material-symbols-outlined text-[17px] text-secondary">area_chart</span>
</div>
<div className="my-2">
<span className="text-headline-md font-headline-md text-on-surface">+1.34</span>
<span className="text-body-sm font-body-sm text-secondary">xGD</span>
</div>
<span className="text-body-sm font-body-sm text-secondary font-medium">Domination territoriale</span>
</div>
</div>
</div>
</div>
</div>
<div className="lg:col-span-4 space-y-4">
<div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between pb-3">
<span className="text-label-sm font-label-sm uppercase tracking-wider text-secondary font-semibold">Profil de forme saison</span>
<span className="text-body-sm font-body-sm text-teal-700 font-semibold">1er Ligue 1</span>
</div>
<div className="py-3 space-y-3">
<div className="flex items-center justify-between">
<span className="text-body-md font-body-md text-secondary">Bilan global</span>
<span className="text-body-md font-body-md font-semibold text-on-surface">19V · 5N · 2D</span>
</div>
<div className="flex items-center justify-between">
<span className="text-body-md font-body-md text-secondary">Taux de victoire global</span>
<span className="text-body-md font-body-md font-semibold text-teal-800">73.1%</span>
</div>
<div className="flex items-center justify-between">
<span className="text-body-md font-body-md text-secondary">Différentiel de forme (5m vs saison)</span>
<span className="text-body-md font-body-md font-semibold text-emerald-700">+0.18 PPM</span>
</div>
<div className="flex items-center justify-between">
<span className="text-body-md font-body-md text-secondary">Fiabilité de l'échantillon</span>
<span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-accent text-teal-900 font-semibold">Optimal (100%)</span>
</div>
</div>
</div>
<div className="mt-6 pt-4 bg-surface-container-low p-4 rounded-xl">
<div className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-[20px] text-teal-700 shrink-0">info</span>
<div className="text-body-sm font-body-sm text-secondary">
<span className="font-semibold text-on-surface">Note méthodologique Quant :</span>
                Le composant de forme pondère l'indice PPM avec la force de calendrier (ELO adverse moyen : 1782 sur les 5 dernières rencontres).
              </div>
</div>
</div>
</div>
<div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
<span className="text-label-sm font-label-sm uppercase tracking-wider text-secondary font-semibold block mb-3">Répartition des buts (5m)</span>
<div className="space-y-2.5">
<div>
<div className="flex justify-between text-body-sm font-body-sm mb-1">
<span className="text-secondary">1ère mi-temps (0-45')</span>
<span className="font-semibold text-on-surface">4 buts (36%)</span>
</div>
<div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
<div className="bg-teal-700 h-full rounded-full" style={{width: "36%"}}></div>
</div>
</div>
<div>
<div className="flex justify-between text-body-sm font-body-sm mb-1">
<span className="text-secondary">2ème mi-temps (46-90')</span>
<span className="font-semibold text-on-surface">7 buts (64%)</span>
</div>
<div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
<div className="bg-teal-800 h-full rounded-full" style={{width: "64%"}}></div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
<section className="space-y-4 pt-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
<h2 className="text-headline-sm font-headline-sm text-on-surface">Cas d'usage B : Vue Comparative Head-to-Head (Page Match)</h2>
</div>
<span className="text-label-sm font-label-sm text-secondary bg-surface-container px-2.5 py-1 rounded-full">Layout Duel / Avant-match</span>
</div>
<div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-6">
<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
<div>
<span className="text-label-sm font-label-sm uppercase tracking-wider text-secondary font-semibold">Analyse de contexte contextualisé</span>
<h3 className="text-headline-sm font-headline-sm text-on-surface">PSG (Domicile) vs Marseille (Extérieur)</h3>
</div>
<div className="flex items-center gap-3 text-body-sm font-body-sm text-secondary">
<span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full font-medium">
<span className="material-symbols-outlined text-[15px] text-teal-700">filter_alt</span>
            Filtre contextuel automatique activé
          </span>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="p-5 rounded-2xl bg-surface-container-low space-y-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center font-bold text-[13px] text-teal-800">PSG</div>
<div>
<h4 className="text-headline-sm font-headline-sm text-on-surface">Paris Saint-Germain</h4>
<span className="text-label-sm font-label-sm text-teal-800 font-semibold">5 derniers matchs à domicile</span>
</div>
</div>
<span className="text-label-sm font-label-sm px-2.5 py-1 rounded-full bg-accent text-teal-900 font-bold">2.60 PPM</span>
</div>
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-label-md font-label-md font-bold" title="2-1 vs OM">V</div>
<div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-label-md font-label-md font-bold" title="4-1 vs Montpellier">V</div>
<div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-label-md font-label-md font-bold" title="3-1 vs Brest">V</div>
<div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-label-md font-label-md font-bold" title="2-2 vs Monaco">N</div>
<div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-label-md font-label-md font-bold" title="6-0 vs Montpellier">V</div>
<span className="text-body-sm font-body-sm text-secondary ml-2 font-medium">13 pts / 15</span>
</div>
<div className="grid grid-cols-3 gap-2 pt-2">
<div className="bg-surface-container-lowest p-2.5 rounded-xl text-center">
<span className="text-[11px] font-label-sm text-secondary block">Buts pour/m.</span>
<span className="text-label-md font-label-md font-bold text-on-surface">3.40</span>
</div>
<div className="bg-surface-container-lowest p-2.5 rounded-xl text-center">
<span className="text-[11px] font-label-sm text-secondary block">Buts contre/m.</span>
<span className="text-label-md font-label-md font-bold text-on-surface">0.80</span>
</div>
<div className="bg-surface-container-lowest p-2.5 rounded-xl text-center">
<span className="text-[11px] font-label-sm text-secondary block">Clean sheets</span>
<span className="text-label-md font-label-md font-bold text-on-surface">40%</span>
</div>
</div>
</div>
<div className="p-5 rounded-2xl bg-surface-container-low space-y-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center font-bold text-[13px] text-secondary">OM</div>
<div>
<h4 className="text-headline-sm font-headline-sm text-on-surface">Olympique de Marseille</h4>
<span className="text-label-sm font-label-sm text-secondary font-semibold">5 derniers matchs à l'extérieur</span>
</div>
</div>
<span className="text-label-sm font-label-sm px-2.5 py-1 rounded-full bg-surface-container text-secondary font-bold">1.80 PPM</span>
</div>
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-label-md font-label-md font-bold" title="1-2 vs PSG">D</div>
<div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-label-md font-label-md font-bold" title="3-1 vs Toulouse">V</div>
<div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-label-md font-label-md font-bold" title="3-2 vs Lyon">V</div>
<div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-label-md font-label-md font-bold" title="0-1 vs Strasbourg">D</div>
<div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-label-md font-label-md font-bold" title="5-1 vs Brest">V</div>
<span className="text-body-sm font-body-sm text-secondary ml-2 font-medium">9 pts / 15</span>
</div>
<div className="grid grid-cols-3 gap-2 pt-2">
<div className="bg-surface-container-lowest p-2.5 rounded-xl text-center">
<span className="text-[11px] font-label-sm text-secondary block">Buts pour/m.</span>
<span className="text-label-md font-label-md font-bold text-on-surface">2.40</span>
</div>
<div className="bg-surface-container-lowest p-2.5 rounded-xl text-center">
<span className="text-[11px] font-label-sm text-secondary block">Buts contre/m.</span>
<span className="text-label-md font-label-md font-bold text-on-surface">1.40</span>
</div>
<div className="bg-surface-container-lowest p-2.5 rounded-xl text-center">
<span className="text-[11px] font-label-sm text-secondary block">Clean sheets</span>
<span className="text-label-md font-label-md font-bold text-on-surface">0%</span>
</div>
</div>
</div>
</div>
</div>
</section>
<section className="space-y-4 pt-4" id="demoSection">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
<div>
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
<h2 className="text-headline-sm font-headline-sm text-on-surface">Démonstrateur d'états d'interface (Sandbox QA)</h2>
</div>
<p className="text-body-sm font-body-sm text-secondary">
          Basculez entre les 5 états standardisés pour valider la robustesse UX du composant "Forme récente".
        </p>
</div>
<div className="flex flex-wrap items-center gap-1.5 bg-surface-container p-1.5 rounded-xl">
<button className="state-ctrl-btn px-3 py-1.5 rounded-lg text-label-md font-label-md bg-teal-800 text-on-primary font-semibold shadow-xs transition-all" onClick={() => renderState("nominal")} type="button">
          1. Nominal
        </button>
<button className="state-ctrl-btn px-3 py-1.5 rounded-lg text-label-md font-label-md text-secondary hover:text-on-surface transition-all" onClick={() => renderState("partial")} type="button">
          2. Incomplet
        </button>
<button className="state-ctrl-btn px-3 py-1.5 rounded-lg text-label-md font-label-md text-secondary hover:text-on-surface transition-all" onClick={() => renderState("empty")} type="button">
          3. Vide (0 m.)
        </button>
<button className="state-ctrl-btn px-3 py-1.5 rounded-lg text-label-md font-label-md text-secondary hover:text-on-surface transition-all" onClick={() => renderState("loading")} type="button">
          4. Chargement
        </button>
<button className="state-ctrl-btn px-3 py-1.5 rounded-lg text-label-md font-label-md text-secondary hover:text-on-surface transition-all" onClick={() => renderState("error")} type="button">
          5. Erreur API
        </button>
</div>
</div>
<div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm" id="stateViewerContainer">
<div className={demoState === "nominal" ? styles.stateView : `${styles.stateView} ${styles.hidden}`} id="state-nominal">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center font-bold text-teal-800">PSG</div>
<div>
<div className="flex items-center gap-2">
<span className="font-headline-sm font-headline-sm text-on-surface">Paris Saint-Germain</span>
<span className="text-[11px] font-label-sm px-2 py-0.5 rounded bg-accent text-teal-900 font-semibold">Nominal 5/5</span>
</div>
<span className="text-body-sm font-body-sm text-secondary">Échantillon complet disponible</span>
</div>
</div>
<div className="text-label-sm font-label-sm text-teal-800 font-semibold bg-accent px-3 py-1.5 rounded-lg">
            Série : 3 Victoires de suite
          </div>
</div>
<div className="flex items-center gap-2.5 py-3">
<div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">V</div>
<div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">V</div>
<div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">V</div>
<div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-bold">N</div>
<div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold">D</div>
</div>
</div>
<div className={demoState === "partial" ? styles.stateView : `${styles.stateView} ${styles.hidden}`} id="state-partial">
<div className="bg-surface-container-low p-4 rounded-xl mb-4 flex items-start gap-3">
<span className="material-symbols-outlined text-[20px] text-teal-700 shrink-0">info</span>
<div>
<span className="text-label-md font-label-md font-semibold text-on-surface">Historique incomplet : 3 matchs sur 5 disponibles</span>
<p className="text-body-sm font-body-sm text-secondary mt-0.5">
              Cette équipe n'a disputé que 3 rencontres officielles dans la fenêtre sélectionnée. Les moyennes sont normalisées au ratio réel.
            </p>
</div>
</div>
<div className="flex items-center gap-2.5 py-3">
<div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">V</div>
<div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">V</div>
<div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-bold">N</div>
<div className="w-10 h-10 rounded-full bg-surface-container text-secondary flex items-center justify-center font-bold opacity-40">-</div>
<div className="w-10 h-10 rounded-full bg-surface-container text-secondary flex items-center justify-center font-bold opacity-40">-</div>
<span className="text-body-sm font-body-sm text-secondary ml-3 font-medium">PPM ajusté : 2.33 (7 pts / 9)</span>
</div>
</div>
<div className={demoState === "empty" ? styles.stateView : `${styles.stateView} ${styles.hidden}`} id="state-empty">
<div className="py-10 text-center flex flex-col items-center justify-center">
<div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-secondary mb-3">
<span className="material-symbols-outlined text-[26px]">history_toggle_off</span>
</div>
<h4 className="text-headline-sm font-headline-sm text-on-surface">Aucun match terminé</h4>
<p className="text-body-sm font-body-sm text-secondary max-w-sm mt-1">
            Aucune rencontre enregistrée pour cette équipe avec les filtres actuels. Le calcul de forme se déclenchera dès la première rencontre validée.
          </p>
</div>
</div>
<div className={demoState === "loading" ? styles.stateView : `${styles.stateView} ${styles.hidden}`} id="state-loading">
<div className="space-y-4 animate-pulse">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-surface-container rounded-xl"></div>
<div className="space-y-1.5">
<div className="w-32 h-4 bg-surface-container rounded"></div>
<div className="w-48 h-3 bg-surface-container-low rounded"></div>
</div>
</div>
<div className="w-24 h-8 bg-surface-container rounded-lg"></div>
</div>
<div className="flex items-center gap-2.5 py-2">
<div className="w-10 h-10 bg-surface-container rounded-full"></div>
<div className="w-10 h-10 bg-surface-container rounded-full"></div>
<div className="w-10 h-10 bg-surface-container rounded-full"></div>
<div className="w-10 h-10 bg-surface-container rounded-full"></div>
<div className="w-10 h-10 bg-surface-container rounded-full"></div>
</div>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
<div className="h-20 bg-surface-container rounded-xl"></div>
<div className="h-20 bg-surface-container rounded-xl"></div>
<div className="h-20 bg-surface-container rounded-xl"></div>
<div className="h-20 bg-surface-container rounded-xl"></div>
</div>
</div>
</div>
<div className={demoState === "error" ? styles.stateView : `${styles.stateView} ${styles.hidden}`} id="state-error">
<div className="py-8 text-center flex flex-col items-center justify-center">
<div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3">
<span className="material-symbols-outlined text-[26px]">cloud_off</span>
</div>
<h4 className="text-headline-sm font-headline-sm text-on-surface">Impossible de charger l'historique de forme</h4>
<p className="text-body-sm font-body-sm text-secondary max-w-sm mt-1 mb-4">
            Une interruption temporaire avec le moteur de synchronisation quantitaire empêche la récupération des données.
          </p>
<button className="h-9 px-4 rounded-xl bg-teal-800 text-on-primary text-label-md font-label-md font-semibold flex items-center gap-2 hover:bg-teal-900 transition-colors shadow-xs" id="retryDemoBtn" onClick={retryDemoFetch} type="button">
<span className={`material-symbols-outlined text-[18px] ${retrying ? styles.spin : ""}`} id="retrySpinner">refresh</span>
<span>Réessayer</span>
</button>
</div>
</div>
</div>
</section>
</div>
</main>
</div>



    </div>
  );
}
