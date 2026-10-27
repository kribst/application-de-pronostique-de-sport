"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function MatchesPage() {
  const [selectedSeason, setSelectedSeason] = useState("2025/2026");
  const [selectedDate, setSelectedDate] = useState("Jeudi 22 Mai 2025");
  const [seasonOpen, setSeasonOpen] = useState(true);
  const [popoverActive, setPopoverActive] = useState(true);
  const [mobileHighlighted, setMobileHighlighted] = useState(false);

  function selectSeason(season: string) {
    setSelectedSeason(season);
    setSeasonOpen(false);
  }

  function toggleSeasonDropdown() {
    setSeasonOpen((open) => !open);
  }

  function toggleDesktopPopover() {
    setPopoverActive((active) => !active);
  }

  function highlightMobileSheet() {
    document.getElementById("mobile-sheet-card")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
    setMobileHighlighted(true);
    window.setTimeout(() => setMobileHighlighted(false), 1200);
  }

  function setCalToday() {
    setSelectedDate("Samedi 24 Mai 2025");
  }

  function setNextMatch() {
    setSelectedDate("Vendredi 23 Mai 2025");
  }

  function simulateEmptyDay() {
    setSelectedDate("Mardi 13 Mai 2025");
  }

  return (
    <div className={styles.page}>
<aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex flex-col flex-1 min-h-0"><div className="h-16 px-space-md flex items-center gap-space-xs bg-surface-container-lowest"><img alt="Brand logo. - Primary color: #111827
- Font: geist
- Mode: light
- Roundness: rounded-md
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1UdMRX79soHetqlU_nO16NuSU6nG82yC-3IAPsTQF513bnQC_lQTEaJAngdoH3JbccaltAreYcFSiW1r8PqrtecdaxUt0dzjPV8aWvJCquVdLLbGCOtNuvtOPWDHUbLqItsbyvClXO8n2wUuI87sHoDbiDvTx4tvFlSxpvZ5LNTR3sLDK7MpWQwpiC57wpuD14NfpJ5_2vlciWzZBdl6q9mznEN7_C8gAmDfHa79Dt961ZB53znvbY1fLw"/><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface leading-none">Pronostique</span><span className="font-code-sm text-code-sm text-on-surface-variant font-medium tracking-wider uppercase mt-0.5">Quant Engine</span></div></div><nav className="flex-1 px-space-xs py-space-sm space-y-1 overflow-y-auto" data-active-classes="bg-surface-container text-on-surface font-semibold shadow-sm"><a className="flex items-center gap-space-xs px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md" data-path="dashboard" href="#"><span className="material-symbols-outlined text-[18px]">dashboard</span><span>Dashboard</span></a><a className="flex items-center gap-space-xs px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md" data-path="sports" href="#"><span className="material-symbols-outlined text-[18px]">sports_soccer</span><span>Sports</span></a><a className="flex items-center gap-space-xs px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md" data-path="competitions" href="#"><span className="material-symbols-outlined text-[18px]">emoji_events</span><span>Compétitions</span></a><a className="flex items-center gap-space-xs px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md" data-path="matchs" href="#"><span className="material-symbols-outlined text-[18px]">event_available</span><span>Matchs</span></a><a className="flex items-center gap-space-xs px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md" data-path="equipes" href="#"><span className="material-symbols-outlined text-[18px]">groups</span><span>Équipes</span></a><a className="flex items-center justify-between px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md" data-path="value-bets" href="#"><div className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px]">trending_up</span><span>Value bets</span></div><span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-container text-on-primary"><span className="material-symbols-outlined text-[12px]">lock</span>PRO</span></a><a className="flex items-center gap-space-xs px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md" data-path="combinaisons" href="#"><span className="material-symbols-outlined text-[18px]">hub</span><span>Combinaisons</span></a><a className="flex items-center gap-space-xs px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md" data-path="cote-cible" href="#"><span className="material-symbols-outlined text-[18px]">tune</span><span>Cote cible</span></a><a className="flex items-center gap-space-xs px-space-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md" data-path="historique" href="#"><span className="material-symbols-outlined text-[18px]">history</span><span>Historique</span></a></nav></div><div className="p-space-sm bg-surface-container-low m-space-xs rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]"><div className="flex items-center gap-space-xs"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-on-surface"></span></span><span className="font-code-sm text-code-sm font-semibold text-on-surface uppercase tracking-wider">FLUX API QUANT</span></div><div className="mt-1 flex items-center justify-between text-on-surface-variant font-code-sm text-code-sm"><span>Latence: 42ms</span><span className="font-medium text-on-surface">Synchronisé</span></div></div></aside><div className="pl-64"><header className="fixed top-0 left-64 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-16 px-space-lg flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-xl"><button className="px-space-sm py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow-sm">Football</button><button className="px-space-sm py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5"><span>Basketball</span><span className="text-[10px] uppercase font-bold text-outline-variant">Bientôt</span></button><button className="px-space-sm py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5"><span>Tennis</span><span className="text-[10px] uppercase font-bold text-outline-variant">Bientôt</span></button><button className="px-space-sm py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5"><span>Volleyball</span><span className="text-[10px] uppercase font-bold text-outline-variant">Bientôt</span></button></div><div className="flex items-center gap-space-md"><div className="flex items-center gap-space-xs px-space-sm py-1.5 rounded-xl bg-surface-container-low"><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span className="material-symbols-outlined text-on-primary text-[18px]">person</span></div><div className="flex flex-col text-left"><span className="font-label-md text-label-md font-medium text-on-surface leading-tight">Thomas Moreau</span><span className="font-code-sm text-code-sm text-on-surface-variant leading-tight">Analyste Free</span></div></div><button className="px-space-sm py-2 rounded-xl bg-primary text-on-primary hover:bg-inverse-surface transition-all font-label-md text-label-md font-semibold tracking-wide flex items-center gap-1.5 shadow-sm"><span className="material-symbols-outlined text-[16px]">workspace_premium</span><span>Passer Premium</span></button><button className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center justify-center" title="Déconnexion"><span className="material-symbols-outlined text-[20px]">logout</span></button></div></div><div className="h-7 bg-surface-container-high px-space-lg flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm"><span className="material-symbols-outlined text-error text-[16px]">warning</span><span className="font-medium">Les pronostics sont des probabilités mathématiques, jamais des certitudes. 18+ · Jouez de façon responsable.</span></div></header><main className="w-full pt-[92px] bg-background min-h-screen"><div className="flex flex-col w-full">
<div className="p-space-lg max-w-7xl mx-auto w-full space-y-space-lg">
{/* Top Action Bar for "Matchs" */}
<div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
<div>
<div className="flex items-center gap-space-xs">
<span className="p-2 rounded-xl bg-surface-container text-on-surface flex items-center justify-center">
<span className="material-symbols-outlined text-[22px]">event_available</span>
</span>
<h1 className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight">Matchs</h1>
<span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant font-medium">Quant Stream</span>
</div>
<p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
          28 matchs modélisés · fuseau horaire Africa/Douala (UTC+1)
        </p>
</div>
{/* Controls: Date trigger & Season Dropdown */}
<div className="flex flex-wrap items-center gap-space-sm relative">
{/* Date Selector Trigger */}
<div className="relative">
<button className="flex items-center gap-space-xs px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-all shadow-sm" id="date-picker-btn" onClick={toggleDesktopPopover}>
<span className="material-symbols-outlined text-[20px] text-secondary">calendar_today</span>
<span id="selected-date-display">{selectedDate}</span>
<span className="px-1.5 py-0.5 rounded-md bg-surface-container text-[11px] font-code-sm font-medium text-secondary">J-2</span>
<span className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform" id="cal-arrow">expand_more</span>
</button>
</div>
{/* Season Selector Trigger */}
<div className="relative">
<button className="flex items-center gap-space-xs px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-all shadow-sm" id="season-picker-btn" onClick={toggleSeasonDropdown}>
<span className="material-symbols-outlined text-[20px] text-secondary">workspace_premium</span>
<span className="text-on-surface-variant font-body-sm font-normal">Saison :</span>
<span id="selected-season-display">{selectedSeason}</span>
<span className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform" id="season-arrow">expand_more</span>
</button>
{/* Season Dropdown Popover (Interactive Demo) */}
<div id="season-dropdown" className={`absolute right-0 top-full mt-2 w-64 bg-surface-container-lowest rounded-2xl shadow-xl p-2 z-30 transition-all origin-top-right ${seasonOpen ? "opacity-100 scale-100" : "hidden"}`}>
<div className="px-3 py-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">Sélectionner une saison</div>
<div className="space-y-1">
<button className="w-full text-left px-3 py-2 rounded-xl text-body-md font-body-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-between" onClick={() => selectSeason('2026/2027')}>
<span>2026/2027</span>
<span className="text-code-sm font-code-sm text-outline">À venir</span>
</button>
<button className="w-full text-left px-3 py-2 rounded-xl text-body-md font-body-md text-on-surface bg-surface-container-low font-semibold transition-colors flex items-center justify-between" onClick={() => selectSeason('2025/2026')}>
<span className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
                  2025/2026
                </span>
<span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm">En cours</span>
</button>
<button className="w-full text-left px-3 py-2 rounded-xl text-body-md font-body-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-between" onClick={() => selectSeason('2024/2025')}>
<span>2024/2025</span>
<span className="text-code-sm font-code-sm text-on-surface-variant">Archivée</span>
</button>
<button className="w-full text-left px-3 py-2 rounded-xl text-body-md font-body-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-between" onClick={() => selectSeason('2023/2024')}>
<span>2023/2024</span>
<span className="text-code-sm font-code-sm text-on-surface-variant">Archivée</span>
</button>
<button className="w-full text-left px-3 py-2 rounded-xl text-body-md font-body-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-between" onClick={() => selectSeason('2022/2023')}>
<span>2022/2023</span>
<span className="text-code-sm font-code-sm text-on-surface-variant">Archivée</span>
</button>
</div>
</div>
</div>
{/* Quick navigation day stepper */}
<div className="flex items-center bg-surface-container-low rounded-xl p-1">
<button className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center" title="Jour précédent">
<span className="material-symbols-outlined text-[18px]">chevron_left</span>
</button>
<button className="px-2.5 py-1 text-code-sm font-code-sm font-semibold rounded-lg hover:bg-surface-container text-on-surface transition-colors" title="Aujourd'hui">
            Aujourd'hui
          </button>
<button className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center" title="Jour suivant">
<span className="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
</div>
</div>
</div>
{/* Main Workspace with open Popover Presentation and responsive demo split */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
{/* Interactive Calendar Popover Showcase (Desktop / Floating mode) */}
<div className={`lg:col-span-5 bg-surface-container-lowest rounded-2xl shadow-xl p-space-lg transition-all ${popoverActive ? "opacity-100 scale-100" : "opacity-40 scale-95"}`} id="desktop-popover-card">
<div className="flex items-center justify-between mb-4 pb-2">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[20px] text-secondary">date_range</span>
<span className="font-headline-sm text-headline-sm font-semibold text-on-surface">Sélecteur de Date</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-surface-container-high text-code-sm font-code-sm font-medium text-on-surface-variant">Vue Calendrier Popover</span>
</div>
{/* Popover Month Navigator */}
<div className="flex items-center justify-between mb-4">
<button className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">chevron_left</span>
</button>
<div className="flex items-center gap-1.5">
<span className="font-headline-sm text-headline-sm font-semibold text-on-surface">Mai 2025</span>
<span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_drop_down</span>
</div>
<button className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
{/* Days of Week Header */}
<div className="grid grid-cols-7 gap-1 text-center mb-2">
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant py-1">Lun</span>
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant py-1">Mar</span>
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant py-1">Mer</span>
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant py-1">Jeu</span>
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant py-1">Ven</span>
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant py-1">Sam</span>
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant py-1">Dim</span>
</div>
{/* Calendar Days Grid */}
<div className="grid grid-cols-7 gap-1 text-center font-body-md text-body-md">
{/* Previous month spill */}
<div className="h-10 flex flex-col items-center justify-center text-outline-variant font-medium">28</div>
<div className="h-10 flex flex-col items-center justify-center text-outline-variant font-medium">29</div>
<div className="h-10 flex flex-col items-center justify-center text-outline-variant font-medium">30</div>
{/* Month Days */}
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">1</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">2</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">3</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
<span className="text-on-surface">4</span>
</button>
{/* Week 2 */}
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">5</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
<span className="text-on-surface">6</span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">7</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">8</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">9</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">10</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">11</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
{/* Week 3 */}
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">12</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
<span className="text-on-surface">13</span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">14</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">15</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">16</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">17</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">18</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
{/* Week 4 */}
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">19</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors">
<span className="text-on-surface">20</span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">21</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
{/* SELECTED DAY: 22 May */}
<button className="h-10 flex flex-col items-center justify-center rounded-full bg-primary text-on-primary font-semibold relative shadow-sm">
<span>22</span>
<span className="w-1 h-1 rounded-full bg-surface-container-lowest absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">23</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
{/* TODAY: 24 May with subtle active pill / highlight */}
<button className="h-10 flex flex-col items-center justify-center rounded-xl bg-surface-container-high text-on-surface font-semibold relative shadow-inner">
<span className="text-on-surface">24</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">25</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
{/* Week 5 */}
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">26</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">27</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">28</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">29</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">30</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
<button className="h-10 flex flex-col items-center justify-center rounded-xl hover:bg-surface-container transition-colors relative">
<span className="text-on-surface">31</span>
<span className="w-1 h-1 rounded-full bg-secondary absolute bottom-1"></span>
</button>
{/* Next month spill */}
<div className="h-10 flex flex-col items-center justify-center text-outline-variant font-medium">1</div>
</div>
{/* Quick actions and Legend inside Popover */}
<div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2">
<div className="flex items-center gap-1.5 text-code-sm font-code-sm text-on-surface-variant">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span>Match prévu</span>
</div>
<div className="flex items-center gap-2">
<button className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm font-medium transition-colors" onClick={setCalToday}>
              Aujourd'hui (24 Mai)
            </button>
<button className="px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-inverse-surface font-label-sm text-label-sm font-semibold transition-colors flex items-center gap-1" onClick={setNextMatch}>
<span>Prochain match</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
</div>
</div>
{/* Mobile Bottom Sheet Preview (390px phone presentation) */}
<div className={`lg:col-span-3 rounded-2xl shadow-md p-space-md flex flex-col justify-between transition-colors ${mobileHighlighted ? "bg-surface-container-low" : "bg-surface-container-lowest"}`} id="mobile-sheet-card">
<div>
<div className="flex items-center justify-between mb-3">
<span className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Simulateur Mobile</span>
<span className="px-2 py-0.5 rounded-full bg-surface-container text-code-sm font-code-sm text-on-surface">390px Viewport</span>
</div>
<p className="text-body-sm font-body-sm text-on-surface-variant mb-4">
            Sur écran tactile, le sélecteur glisse depuis le bas en <span className="font-semibold text-on-surface">Bottom Sheet modal</span> avec poignée de tirage tactile et cibles ergonomiques de 44px (h-11).
          </p>
</div>
{/* Simulated Mobile Frame */}
<div className="w-full bg-surface-container-high rounded-2xl p-2 relative overflow-hidden shadow-inner">
<div className="bg-surface-container-lowest rounded-xl p-3 shadow-lg">
{/* Drag Handle */}
<div className="w-10 h-1.5 bg-outline-variant rounded-full mx-auto mb-3"></div>
<div className="flex items-center justify-between mb-3">
<div>
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold block">Choisir la date</span>
<span className="text-body-sm font-body-sm text-on-surface-variant">Saison 2025/2026</span>
</div>
<button className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined text-[18px]">close</span>
</button>
</div>
<div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-xl mb-3">
<span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_left</span>
<span className="font-label-md text-label-md font-semibold text-on-surface">Mai 2025</span>
<span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
</div>
{/* Mini Grid */}
<div className="grid grid-cols-7 gap-1 text-center font-code-sm text-code-sm text-on-surface mb-3">
<div className="py-1 text-on-surface-variant text-[10px]">L</div>
<div className="py-1 text-on-surface-variant text-[10px]">M</div>
<div className="py-1 text-on-surface-variant text-[10px]">M</div>
<div className="py-1 text-on-surface-variant text-[10px]">J</div>
<div className="py-1 text-on-surface-variant text-[10px]">V</div>
<div className="py-1 text-on-surface-variant text-[10px]">S</div>
<div className="py-1 text-on-surface-variant text-[10px]">D</div>
<div className="h-9 flex items-center justify-center rounded-lg text-outline">19</div>
<div className="h-9 flex items-center justify-center rounded-lg text-outline">20</div>
<div className="h-9 flex items-center justify-center rounded-lg text-on-surface">21</div>
<div className="h-9 flex items-center justify-center rounded-lg bg-primary text-on-primary font-semibold shadow-sm">22</div>
<div className="h-9 flex items-center justify-center rounded-lg text-on-surface">23</div>
<div className="h-9 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface font-semibold">24</div>
<div className="h-9 flex items-center justify-center rounded-lg text-on-surface">25</div>
</div>
{/* Touch Action Button */}
<button className="w-full h-11 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm">
<span className="material-symbols-outlined text-[18px]">check</span>
<span>Appliquer le 22 Mai 2025</span>
</button>
</div>
</div>
</div>
{/* Real Contextual Match List for May 22, 2025 */}
<div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl shadow-sm p-space-md space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-[20px]">sports_soccer</span>
<span className="font-headline-sm text-headline-sm font-semibold text-on-surface">Programme du jour</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-surface-container text-label-sm font-label-sm text-on-surface font-semibold">4 affiches</span>
</div>
<p className="text-body-sm font-body-sm text-on-surface-variant">
          Affichage instantané des rencontres modélisées pour la date active.
        </p>
{/* Match card 1 */}
<div className="bg-surface-container-low rounded-xl p-3 hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between text-code-sm font-code-sm text-on-surface-variant mb-2">
<span className="font-semibold text-on-surface">Premier League · J38</span>
<span className="flex items-center gap-1 text-on-surface">
<span className="material-symbols-outlined text-[14px]">schedule</span>
              20:00 UTC+1
            </span>
</div>
<div className="flex items-center justify-between font-label-md text-label-md text-on-surface">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
<span className="font-semibold">Arsenal</span>
</div>
<span className="text-body-sm font-body-sm text-on-surface-variant font-medium">vs</span>
<div className="flex items-center gap-2">
<span className="font-semibold">Newcastle</span>
<span className="w-2.5 h-2.5 rounded-full bg-surface-tint"></span>
</div>
</div>
<div className="mt-2 pt-2 flex items-center justify-between text-code-sm font-code-sm text-on-surface-variant">
<span>Probabilité victoire dom: <strong className="text-on-surface">58.4%</strong></span>
<span className="px-1.5 py-0.5 rounded bg-surface-container text-[11px] font-medium text-on-surface">Modèle Poisson+</span>
</div>
</div>
{/* Match card 2 */}
<div className="bg-surface-container-low rounded-xl p-3 hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between text-code-sm font-code-sm text-on-surface-variant mb-2">
<span className="font-semibold text-on-surface">Ligue 1 McDonald's · J34</span>
<span className="flex items-center gap-1 text-on-surface">
<span className="material-symbols-outlined text-[14px]">schedule</span>
              21:00 UTC+1
            </span>
</div>
<div className="flex items-center justify-between font-label-md text-label-md text-on-surface">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
<span className="font-semibold">Olympique Lyonnais</span>
</div>
<span className="text-body-sm font-body-sm text-on-surface-variant font-medium">vs</span>
<div className="flex items-center gap-2">
<span className="font-semibold">Monaco</span>
<span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
</div>
</div>
<div className="mt-2 pt-2 flex items-center justify-between text-code-sm font-code-sm text-on-surface-variant">
<span>Probabilité xG total: <strong className="text-on-surface">3.12 buts</strong></span>
<span className="px-1.5 py-0.5 rounded bg-surface-container text-[11px] font-medium text-on-surface">Monte Carlo</span>
</div>
</div>
{/* Match card 3 */}
<div className="bg-surface-container-low rounded-xl p-3 hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between text-code-sm font-code-sm text-on-surface-variant mb-2">
<span className="font-semibold text-on-surface">Serie A Enilive · J37</span>
<span className="flex items-center gap-1 text-on-surface">
<span className="material-symbols-outlined text-[14px]">schedule</span>
              20:45 UTC+1
            </span>
</div>
<div className="flex items-center justify-between font-label-md text-label-md text-on-surface">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
<span className="font-semibold">Inter Milan</span>
</div>
<span className="text-body-sm font-body-sm text-on-surface-variant font-medium">vs</span>
<div className="flex items-center gap-2">
<span className="font-semibold">Lazio</span>
<span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
</div>
</div>
<div className="mt-2 pt-2 flex items-center justify-between text-code-sm font-code-sm text-on-surface-variant">
<span>Probabilité clean sheet: <strong className="text-on-surface">42.1%</strong></span>
<span className="px-1.5 py-0.5 rounded bg-surface-container text-[11px] font-medium text-on-surface">Quant Elo</span>
</div>
</div>
</div>
</div>
{/* Interface State Switcher / Demonstration Toolbar */}
<div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div>
<span className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold block">Démonstrateur d'états d'interface</span>
<span className="text-body-sm font-body-sm text-on-surface">Basculez rapidement entre les comportements interactifs requis pour la revue UX :</span>
</div>
<div className="flex flex-wrap items-center gap-2">
<button className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5" onClick={toggleDesktopPopover}>
<span className="material-symbols-outlined text-[16px]">calendar_month</span>
<span>1. Popover Desktop</span>
</button>
<button className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5" onClick={toggleSeasonDropdown}>
<span className="material-symbols-outlined text-[16px]">layers</span>
<span>2. Menu Saison</span>
</button>
<button className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5" onClick={highlightMobileSheet}>
<span className="material-symbols-outlined text-[16px]">smartphone</span>
<span>3. Bottom Sheet (390px)</span>
</button>
<button className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5" onClick={simulateEmptyDay}>
<span className="material-symbols-outlined text-[16px]">event_busy</span>
<span>4. Filtre sans match</span>
</button>
</div>
</div>
</div>
</div>
{/* Interactive script for toggles and demo logic */}

</div></main></div>
    </div>
  );
}
