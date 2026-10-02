"use client";

import { useState } from "react";
import "./Login.css";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [mousePosition, setMousePosition] = useState({
    x: 230,
    y: 200,
  });
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Ajouter ici la logique de connexion à ton API
    console.log("Connexion...");
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
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1WLjm07IKpb5PurQ8fM1O7t4tjVcy1yP2dFChF16P5O_0F_pcVww-fqPeQm-fLbskamDFVr8qYdrJiQH2rjORIFAhdjVD658uL3gl_cj8PW5VTpsJ9peK_glNU87Pzkus72m9I1U4Rr0LkRWYT1AGku321m097okff7Qq-oCR-oiCldxK4Bx53FThAAhiogPnn1Esmiqc22f5A-hRVMVJS8j8cvU6ySHmbT-AobfWQpzL0U4SUXJcejMGo"
                alt="SportPulse AI Logo"
                className="brand-logo"
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
                  onSubmit={handleSubmit}
                >
                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email">
                      Adresse email
                    </label>

                    <div className="input-wrapper">
                      <span className="material-symbols-outlined input-icon">
                        mail
                      </span>

                      <input
                        id="email"
                        type="email"
                        placeholder="vous@exemple.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <div className="password-label-row">
                      <label htmlFor="password">
                        Mot de passe
                      </label>

                      <a href="#" className="forgot-password">
                        Mot de passe oublié ?
                      </a>
                    </div>

                    <div className="input-wrapper">
                      <span className="material-symbols-outlined input-icon">
                        lock
                      </span>

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        required
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
                      />

                      <span>Se souvenir de moi</span>
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="login-button"
                  >
                    <span>
                      Se connecter à mon compte
                    </span>

                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>

                  {/* Register */}
                  <div className="register-link-container">
                    <p>
                      Vous n&aposavez pas encore de compte ?

                      <a href="/auth/register">
                        S&apos;inscrire gratuitement
                        <span className="material-symbols-outlined">
                          chevron_right
                        </span>
                      </a>
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

export default Login;
