"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { firstError, useAuthForm } from "@/lib/use-auth-form";
import "./register.css";

type PasswordField = "password" | "confirm-password";

export default function Inscription(): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { pending, message, fieldErrors, submit, clearError } =
    useAuthForm("/api/auth/register");

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
      glow.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      glow.style.opacity = "0";
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const togglePassword = (field: PasswordField) => {
    if (field === "password") {
      setShowPassword((current) => !current);
    } else {
      setShowConfirmPassword((current) => !current);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    void submit({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      password_confirm: String(data.get("password_confirm") ?? ""),
    });
  };

  return (
    <div className="sportpulse-page bg-[#fbfcfe] font-body-md text-on-surface antialiased relative min-h-screen selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      {/* Ambient Background & Subtle Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-40" />
        <div className="absolute -top-36 left-12 w-[600px] h-[600px] rounded-full bg-cyan-100/50 blur-[140px]" />
        <div className="absolute top-1/3 -right-24 w-[520px] h-[520px] rounded-full bg-emerald-100/40 blur-[150px]" />
        <div className="absolute -bottom-36 left-1/3 w-[620px] h-[620px] rounded-full bg-surface-variant/40 blur-[160px]" />
      </div>

      <main className="relative z-10 w-full min-h-screen flex flex-col justify-between p-space-md sm:p-space-lg lg:p-space-xl max-w-7xl mx-auto">
        {/* Top Navigation / Brand Anchor Bar */}
        <header className="w-full flex items-center justify-between pb-space-md pt-space-xs border-b border-surface-container/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-slate-200/80 bg-white">
              <Image
                alt="Logo SportPulse AI"
                className="w-full h-full object-contain"
                src="/images/logo-sportpulse.svg"
                width={36}
                height={36}
                priority
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-[19px] text-primary tracking-tight font-bold">
                SportPulse AI
              </span>
              <span className="font-label-sm text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-secondary-container font-semibold tracking-wide">
                QUANT ENGINE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low border border-slate-200/70 text-on-surface-variant font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              v2.4 Quant Models Active
            </span>
            <a className="hidden sm:inline-flex text-secondary hover:text-primary font-label-md text-label-md transition-colors" href="#">
              Documentation
            </a>
          </div>
        </header>

        {/* Split Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6 sm:py-10 my-auto">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 font-label-sm text-label-sm font-semibold tracking-wide uppercase">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">analytics</span>
                Intelligence &amp; Modélisation Quantitative Sportive
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-[40px] text-primary tracking-tight leading-[1.18] font-bold">
                La science des données au service de vos analyses sportives
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Décisions éclairées par des modèles prédictifs avancés, collecte de cotes en temps réel et simulations stochastiques Monte Carlo. Accédez à une rigueur institutionnelle pour évaluer chaque opportunité sans fausse certitude.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <Feature emoji="🎯" title="Moteur Cote Cible">
                Optimisez vos sélections et combinés autour d&apos;une cote précise avec une tolérance mathématique maîtrisée.
              </Feature>
              <Feature emoji="📊" title="Modèles Poisson & Dixon-Coles">
                Distributions de probabilités calibrées selon l&apos;intensité offensive/défensive et neutralisation des biais.
              </Feature>
              <Feature emoji="⚡" title="Signaux Value Bet & EV+">
                Détection instantanée des anomalies de marché et identification systématique d&apos;espérance positive.
              </Feature>
              <Feature emoji="🎲" title="Simulations Monte Carlo (10k+)">
                Modélisation directe de l&apos;incertitude et distribution complète des scénarios pour chaque rencontre.
              </Feature>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex-1 p-3.5 rounded-xl bg-gradient-to-r from-surface-container-low to-white border border-slate-200/80 flex items-center justify-between shadow-sm">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">trending_up</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      Alpha Model Edge: <span className="text-emerald-700 font-code-sm">+5.14%</span>
                    </span>
                  </div>
                  <span className="font-code-sm text-[11px] text-secondary">
                    1,420 Matchs analysés • Brier Score calibré 0.182
                  </span>
                </div>
                <div className="h-6 w-20 shrink-0">
                  <svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
                    <path className="text-emerald-500" d="M0,18 Q15,16 30,12 T60,8 T85,4 L100,2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                    <path d="M0,18 Q15,16 30,12 T60,8 T85,4 L100,2 L100,24 L0,24 Z" fill="url(#col-sparkline-grad)" opacity="0.25" />
                    <defs>
                      <linearGradient id="col-sparkline-grad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-slate-100/80 border border-slate-200/70 text-secondary shrink-0">
                <span className="material-symbols-outlined text-[20px] text-teal-700">balance</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-[11px] font-semibold text-on-surface">Jeu responsable</span>
                  <span className="font-body-sm text-[11px] text-secondary">Analyse d&apos;incertitude transparente</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <div
              ref={cardRef}
              className="relative w-full max-w-[460px] bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 overflow-hidden transition-all duration-300"
              id="card-spotlight"
            >
              <div
                ref={glowRef}
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 bg-[radial-gradient(550px_circle_at_var(--mouse-x,_50%)_var(--mouse-y,_50%),rgba(16,185,129,0.07),rgba(2,132,199,0.04),transparent_65%)]"
              />

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-primary tracking-tight font-bold">
                    Créez votre compte
                  </h2>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Accès immédiat et gratuit. Sans engagement ni carte bancaire.
                  </p>
                </div>

                <form className="flex flex-col gap-3.5 pt-1" noValidate onSubmit={handleSubmit}>
                  {message ? (
                    <p
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-body-sm text-red-700"
                      role="alert"
                    >
                      {message}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="font-label-md text-label-md text-on-surface flex justify-between" htmlFor="email">
                      <span>Adresse email</span>
                      <span className="text-secondary font-body-sm text-[11px]">Obligatoire</span>
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[19px]">mail</span>
                      </span>
                      <input
                        aria-invalid={Boolean(firstError(fieldErrors, "email"))}
                        className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-on-surface font-body-md text-body-md placeholder:text-outline/60 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200 aria-invalid:border-red-400 aria-invalid:bg-red-50/40"
                        id="email"
                        name="email"
                        onChange={() => clearError("email")}
                        placeholder="vous@exemple.com"
                        required
                        suppressHydrationWarning
                        type="email"
                      />
                    </div>
                    {firstError(fieldErrors, "email") ? (
                      <span className="text-[12px] text-red-600">{firstError(fieldErrors, "email")}</span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Mot de passe</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[19px]">lock</span>
                      </span>
                      <input
                        aria-invalid={Boolean(firstError(fieldErrors, "password"))}
                        autoComplete="new-password"
                        className="w-full h-11 pl-10 pr-11 rounded-lg border border-slate-200 bg-slate-50/50 text-on-surface font-body-md text-body-md placeholder:text-outline/60 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200 aria-invalid:border-red-400 aria-invalid:bg-red-50/40"
                        id="password"
                        name="password"
                        onChange={() => clearError("password")}
                        placeholder="8 caractères minimum"
                        required
                        suppressHydrationWarning
                        type={showPassword ? "text" : "password"}
                      />
                      <button
                        aria-label="Afficher ou masquer le mot de passe"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-on-surface transition-colors cursor-pointer"
                        onClick={() => togglePassword("password")}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {firstError(fieldErrors, "password") ? (
                      <span className="text-[12px] text-red-600">{firstError(fieldErrors, "password")}</span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="confirm-password">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary group-focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[19px]">verified_user</span>
                      </span>
<input
                        aria-invalid={Boolean(firstError(fieldErrors, "password_confirm"))}
                        autoComplete="new-password"
                        className="w-full h-11 pl-10 pr-11 rounded-lg border border-slate-200 bg-slate-50/50 text-on-surface font-body-md text-body-md placeholder:text-outline/60 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200 aria-invalid:border-red-400 aria-invalid:bg-red-50/40"
                        id="confirm-password"
                        name="password_confirm"
                        onChange={() => clearError("password_confirm")}
                        placeholder="Confirmez votre mot de passe"
                        required
                        suppressHydrationWarning
                        type={showConfirmPassword ? "text" : "password"}
                      />
                      <button
                        aria-label="Afficher ou masquer la confirmation du mot de passe"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-on-surface transition-colors cursor-pointer"
                        onClick={() => togglePassword("confirm-password")}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {firstError(fieldErrors, "password_confirm") ? (
                      <span className="text-[12px] text-red-600">{firstError(fieldErrors, "password_confirm")}</span>
                    ) : null}
                  </div>

                  <div className="flex items-start gap-2.5 pt-1 text-left">
                    <input className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/30 cursor-pointer" id="terms" name="terms" required suppressHydrationWarning type="checkbox" />
                    <label className="font-body-sm text-[12px] text-on-surface-variant cursor-pointer select-none leading-tight" htmlFor="terms">
                      J&apos;accepte les conditions générales et la politique de confidentialité
                    </label>
                  </div>

                  <div className="pt-2">
                    <button className="relative w-full h-12 rounded-xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white font-label-md text-label-md font-semibold tracking-wide shadow-md shadow-teal-700/20 hover:shadow-lg hover:shadow-teal-700/30 active:scale-[0.99] transition-all duration-200 overflow-hidden group flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-progress" disabled={pending} type="submit">
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span>{pending ? "Création du compte..." : "Créer mon compte gratuit"}</span>
                      <span className="material-symbols-outlined text-[19px] group-hover:translate-x-0.5 transition-transform duration-200">{pending ? "progress_activity" : "arrow_forward"}</span>
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <p className="font-body-md text-body-md text-secondary">
                      Vous avez déjà un compte ?
                      <Link className="font-label-md text-label-md text-primary font-semibold hover:underline ml-1" href="/auth/login">
                        Se connecter
                      </Link>
                    </p>
                  </div>
                </form>

                <div className="relative py-1 flex items-center justify-center">
                  <div className="w-full h-px bg-slate-200" />
                  <span className="absolute px-2.5 bg-white font-code-sm text-[10px] text-outline uppercase tracking-wider">
                    GARANTIES SÉCURITÉ
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <SecurityBadge icon="encrypted" color="text-sky-600">
                    Identifiants chiffrés de bout en bout
                  </SecurityBadge>
                  <SecurityBadge icon="credit_card_off" color="text-emerald-600">
                    Accès 100% gratuit • Aucune carte requise
                  </SecurityBadge>
                  <SecurityBadge icon="verified" color="text-teal-600">
                    Algorithmes transparents &amp; Données protégées
                  </SecurityBadge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="w-full pt-space-md border-t border-surface-container/60 flex flex-col sm:flex-row items-center justify-between text-secondary font-body-sm text-body-sm gap-2">
          <span>© 2025 SportPulse AI. Tous droits réservés.</span>
          <div className="flex items-center gap-4 text-secondary text-xs">
            <a className="hover:underline" href="#">Conditions d&apos;utilisation</a>
            <a className="hover:underline" href="#">Confidentialité</a>
            <a className="hover:underline" href="#">Modélisation &amp; Risques</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Feature({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200/70 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{emoji}</span>
        <span className="font-headline-sm text-[15px] font-semibold text-primary">{title}</span>
      </div>
      <p className="font-body-sm text-body-sm text-secondary leading-snug">{children}</p>
    </div>
  );
}

function SecurityBadge({
  icon,
  color,
  children,
}: {
  icon: string;
  color: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/60">
      <span className={`material-symbols-outlined text-[17px] ${color} shrink-0`}>{icon}</span>
      <span className="font-body-sm text-[12px] text-on-surface">{children}</span>
    </div>
  );
}
