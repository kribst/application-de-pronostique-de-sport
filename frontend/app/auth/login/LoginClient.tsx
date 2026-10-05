"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import "./login.css";
import { firstError, useAuthForm } from "@/lib/use-auth-form";

type LoginClientProps = {
  /** ?registered=1 : le compte vient d'etre cree, on invite a se connecter. */
  justRegistered: boolean;
};

const LoginClient = ({ justRegistered }: LoginClientProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [mousePosition, setMousePosition] = useState({
    x: 230,
    y: 200,
  });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const { pending, message, fieldErrors, submit, clearError } =
    useAuthForm("/api/auth/login");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const data = new FormData(form);

    void submit({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="ambient-background">
        <div className="grid-pattern" />
        <div className="ambient-glow ambient-glow-cyan" />
        <div className="ambient-glow ambient-glow-emerald" />
        <div className="ambient-glow ambient-glow-bottom" />
      </div>

      <main className="login-main">
        <div className="login-content">
          {/* Header */}
          <header className="top-header">
            <div className="brand-container">
              <Image
                src="/images/logo-sportpulse.svg"
                alt="SportPulse AI Logo"
                className="brand-logo"
                width={40}
                height={40}
                priority
              />

              <div className="brand-name-container">
                <span className="brand-name">
                  SportPulse <span>AI</span>
                </span>

                <span className="quant-badge">
                  Quant Engine
                </span>
              </div>
            </div>

            <div className="header-actions">
              <div className="status-badge">
                <span className="status-dot-container">
                  <span className="status-dot-ping" />
                  <span className="status-dot" />
                </span>

                <span>v2.4 Quant Models Active</span>
              </div>

              <a href="#" className="documentation-link">
                Documentation
                <span className="material-symbols-outlined">
                  arrow_outward
                </span>
              </a>
            </div>
          </header>

          {/* Main Grid */}
          <div className="content-grid">
            {/* Left Column */}
            <section className="overview-section">
              <div className="section-tag">
                <span className="material-symbols-outlined">
                  analytics
                </span>

                <span>
                  Analyse quantitative & modélisation sportive
                </span>
              </div>

              <div className="hero-text">
                <h1>
                  Retrouvez vos modèles, signaux{" "}
                  <span>EV+</span> et simulations
                </h1>

                <p>
                  Accédez à votre espace d&apos;analyse décisionnelle.
                  Cotes en temps réel, alertes d&apos;espérance positive
                  (EV+) et backtests de vos stratégies de pronostics
                  avec rigueur institutionnelle.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="features-grid">
                <div className="feature-card feature-card-sky">
                  <div className="feature-icon">
                    <span className="material-symbols-outlined">
                      account_balance_wallet
                    </span>
                  </div>

                  <div>
                    <h3>Suivi de Bankroll & ROI</h3>

                    <p>
                      Historique transparent de vos prises de position
                      et métriques de rentabilité simulée calculées au
                      centième.
                    </p>
                  </div>
                </div>

                <div className="feature-card feature-card-emerald">
                  <div className="feature-icon">
                    <span className="material-symbols-outlined">
                      tune
                    </span>
                  </div>

                  <div>
                    <h3>Moteur Cote Cible Précis</h3>

                    <p>
                      Reprenez vos combinaisons optimisées avec contrôle
                      strict de tolérance et écarts de distribution.
                    </p>
                  </div>
                </div>

                <div className="feature-card feature-card-indigo">
                  <div className="feature-icon">
                    <span className="material-symbols-outlined">
                      notifications_active
                    </span>
                  </div>

                  <div>
                    <h3>Alertes Value Bets Direct</h3>

                    <p>
                      Notification instantanée des écarts de probabilité
                      statistique entre vos modèles et les bookmakers
                      globaux.
                    </p>
                  </div>
                </div>

                <div className="feature-card feature-card-teal">
                  <div className="feature-icon">
                    <span className="material-symbols-outlined">
                      psychology
                    </span>
                  </div>

                  <div>
                    <h3>Assistant IA & Explicabilité</h3>

                    <p>
                      Justification mathématique détaillée et
                      décomposition bayésienne des probabilités pour
                      chaque confrontation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="metrics-banner">
                <div className="metrics-content">
                  <div className="verified-icon">
                    <span className="material-symbols-outlined">
                      verified
                    </span>
                  </div>

                  <div>
                    <div className="metrics-title">
                      <span>Modèles calibrés</span>
                      <span className="separator">•</span>
                      <span className="brier-score">
                        Brier Score: 0.178
                      </span>
                      <span className="separator">•</span>
                      <span>15 ligues couvertes</span>
                    </div>

                    <p>
                      Posture de jeu responsable : pas de certitude
                      absolue, modélisation mathématique d&apos;incertitude.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column */}
            <section className="authentication-section">
              <div
                className="login-card"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHoveringCard(true)}
                onMouseLeave={() => setIsHoveringCard(false)}
              >
                {/* Interactive Glow */}
                <div
                  className={`glow-overlay ${
                    isHoveringCard ? "active" : ""
                  }`}
                  style={{
                    background: `radial-gradient(
                      400px circle at ${mousePosition.x}px ${mousePosition.y}px,
                      rgba(16, 185, 129, 0.08),
                      transparent 70%
                    )`,
                  }}
                />

                {/* Card Header */}
                <div className="login-card-header">
                  <div className="login-title-row">
                    <h2>Connexion à votre espace</h2>

                    <div className="login-lock-icon">
                      <span className="material-symbols-outlined">
                        lock_open
                      </span>
                    </div>
                  </div>

                  <p>
                    Saisissez vos identifiants pour accéder à vos
                    modèles et données d&apos;analyse.
                  </p>
                </div>

                {/* Form */}
                <form
                  className="login-form"
                  noValidate
                  onSubmit={handleSubmit}
                >
                  {justRegistered ? (
                    <div
                      className="form-alert success"
                      role="status"
                    >
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>

                      <span>
                        Compte créé. Connectez-vous avec vos identifiants.
                      </span>
                    </div>
                  ) : null}

                  {message ? (
                    <div
                      className="form-alert"
                      role="alert"
                    >
                      <span className="material-symbols-outlined">
                        error
                      </span>

                      <span>{message}</span>
                    </div>
                  ) : null}

                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email">
                      Adresse email
                    </label>

                    <div
                      className={`input-wrapper${
                        firstError(fieldErrors, "email")
                          ? " has-error"
                          : ""
                      }`}
                    >
                      <span className="material-symbols-outlined input-icon">
                        mail
                      </span>

                      <input
                        autoComplete="email"
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
                      <span className="field-error">
                        {firstError(fieldErrors, "email")}
                      </span>
                    ) : null}
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <div className="password-label-row">
                      <label htmlFor="password">
                        Mot de passe
                      </label>

                      <Link
                        className="forgot-password"
                        href="/auth/forgot-password"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>

                    <div
                      className={`input-wrapper${
                        firstError(fieldErrors, "password")
                          ? " has-error"
                          : ""
                      }`}
                    >
                      <span className="material-symbols-outlined input-icon">
                        lock
                      </span>

                      <input
                        autoComplete="current-password"
                        id="password"
                        name="password"
                        onChange={() => clearError("password")}
                        placeholder="••••••••••••"
                        required
                        suppressHydrationWarning
                        type={showPassword ? "text" : "password"}
                      />

                      <button
                        type="button"
                        className="toggle-password"
                        aria-label="Afficher ou masquer le mot de passe"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                      >
                        <span className="material-symbols-outlined">
                          {showPassword
                            ? "visibility_off"
                            : "visibility"}
                        </span>
                      </button>
                    </div>

                    {firstError(fieldErrors, "password") ? (
                      <span className="field-error">
                        {firstError(fieldErrors, "password")}
                      </span>
                    ) : null}
                  </div>

                  {/* Remember */}
                  <div className="remember-container">
                    <label className="remember-label">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) =>
                          setRemember(e.target.checked)
                        }
                        suppressHydrationWarning
                      />

                      <span>Se souvenir de moi</span>
                    </label>
                  </div>

{/* Submit */}
                  <button
                    className="login-button"
                    disabled={pending}
                    type="submit"
                  >
                    <span>
                      {pending
                        ? "Connexion en cours..."
                        : "Se connecter à mon compte"}
                    </span>

                    <span className="material-symbols-outlined spinner">
                      {pending ? "progress_activity" : "arrow_forward"}
                    </span>
                  </button>

                  {/* Register */}
                  <div className="register-link-container">
                    <p>
                      Vous n&apos;avez pas encore de compte ?

                      <Link href="/auth/register">
                        S&apos;inscrire gratuitement
                        <span className="material-symbols-outlined">
                          chevron_right
                        </span>
                      </Link>
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="security-divider">
                    <div />
                    <span>Accès Garanti</span>
                  </div>

                  {/* Security */}
                  <div className="security-list">
                    <div className="security-item">
                      <span className="material-symbols-outlined emerald">
                        shield_lock
                      </span>

                      <span>
                        Session sécurisée par chiffrement SSL / TLS
                      </span>
                    </div>

                    <div className="security-item">
                      <span className="material-symbols-outlined sky">
                        sync_saved_locally
                      </span>

                      <span>
                        Accès immédiat à vos stratégies sauvegardées
                      </span>
                    </div>

                    <div className="security-item">
                      <span className="material-symbols-outlined">
                        privacy_tip
                      </span>

                      <span>
                        Aucune donnée partagée avec des tiers
                      </span>
                    </div>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="login-footer">
          <div>
            © 2025 SportPulse AI. Tous droits réservés.
          </div>

          <div className="footer-links">
            <a href="#">Conditions d&apos;utilisation</a>
            <span>•</span>
            <a href="#">Confidentialité</a>
            <span>•</span>
            <a href="#">Modélisation & Risques</a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LoginClient;
