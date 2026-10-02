"use client";

import { useEffect, useState } from "react";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("v.moreau@quantcapital.eu");
  const [view, setView] = useState<"form" | "success">("form");

  const [resendCooldown, setResendCooldown] = useState(48);
  const [resendMessage, setResendMessage] = useState(
    "Renvoyer l'email"
  );
  const [isResending, setIsResending] = useState(false);

  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
  });

  const [isCardHovered, setIsCardHovered] = useState(false);

  /* ========================================
     RESEND COUNTDOWN
  ======================================== */

  useEffect(() => {
    if (!isResending || resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          setIsResending(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isResending, resendCooldown]);

  /* ========================================
     MOUSE SPOTLIGHT
  ======================================== */

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  /* ========================================
     SHOW FORM
  ======================================== */

  const showFormState = () => {
    setView("form");
  };

  /* ========================================
     SHOW SUCCESS
  ======================================== */

  const showSuccessState = () => {
    if (!email.trim()) {
      return;
    }

    setView("success");
  };

  /* ========================================
     FORM SUBMIT
  ======================================== */

  const handleFormSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    showSuccessState();
  };

  /* ========================================
     RESEND EMAIL
  ======================================== */

  const handleResend = () => {
    if (isResending) {
      return;
    }

    setResendMessage("Email renvoyé !");
    setIsResending(true);
    setResendCooldown(60);

    setTimeout(() => {
      setResendMessage("Renvoyer l'email");
    }, 3000);
  };

  return (
    <div className="forgot-page">

      {/* ========================================
          AMBIENT BACKGROUND
      ======================================== */}

      <div className="ambient-background">
        <div className="grid-pattern" />

        <div className="ambient-glow ambient-cyan" />

        <div className="ambient-glow ambient-emerald" />

        <div className="ambient-glow ambient-bottom" />
      </div>

      {/* ========================================
          MAIN
      ======================================== */}

      <main className="forgot-main">

        <div className="forgot-content">

          {/* ========================================
              HEADER
          ======================================== */}

          <header className="platform-header">

            <div className="brand-wrapper">

              {/* SportPulse Logo */}
              <div className="brand-icon">

                <div className="brand-icon-gradient" />

                <svg
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                  className="brand-svg"
                >
                  <line
                    x1="20"
                    y1="80"
                    x2="80"
                    y2="80"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="8"
                  />

                  <path
                    d="M 24 75 L 42 54 L 56 66 L 76 34"
                    stroke="#00c896"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="9"
                  />

                  <circle
                    cx="42"
                    cy="54"
                    r="6"
                    fill="#00b4d8"
                  />

                  <circle
                    cx="56"
                    cy="66"
                    r="7"
                    fill="#0284c7"
                  />

                  <circle
                    cx="76"
                    cy="34"
                    r="9"
                    fill="#10b981"
                    className="pulse-circle"
                  />
                </svg>
              </div>

              <div className="brand-info">

                <span className="brand-name">
                  SportPulse
                  <span>AI</span>
                </span>

                <span className="quant-engine">
                  QUANT ENGINE
                </span>

              </div>

            </div>

            {/* Header right */}
            <div className="header-right">

              <div className="model-status">

                <span className="status-container">
                  <span className="status-ping" />
                  <span className="status-dot" />
                </span>

                <span>
                  v2.4 Quant Models Active
                </span>

              </div>

              <a
                href="#documentation"
                className="documentation-link"
              >
                Documentation

                <span className="material-symbols-outlined">
                  arrow_outward
                </span>
              </a>

            </div>

          </header>

          {/* ========================================
              MAIN GRID
          ======================================== */}

          <div className="main-grid">

            {/* ========================================
                LEFT COLUMN
            ======================================== */}

            <section className="security-section">

              <div className="security-intro">

                <div className="security-tag">

                  <span className="material-symbols-outlined">
                    encrypted
                  </span>

                  <span>
                    SÉCURITÉ & PROTECTION DU COMPTE
                  </span>

                </div>

                <h1>
                  Récupérez l&apos;accès à vos modèles et analyses
                  sans interruption
                </h1>

                <p>
                  Vos stratégies quantitatives, historiques de
                  simulations Monte Carlo et configurations
                  d&apos;alertes restent intégralement sauvegardés et
                  chiffrés. Suivez la procédure sécurisée pour
                  restaurer votre clé d&apos;accès.
                </p>

              </div>

              {/* Technical Cards */}

              <div className="technical-grid">

                {/* Card 1 */}
                <div className="technical-card">

                  <div className="technical-card-top">

                    <span className="technical-icon">
                      <span className="material-symbols-outlined">
                        key
                      </span>
                    </span>

                    <span className="technical-code">
                      RSA-4096
                    </span>

                  </div>

                  <h3>
                    Chiffrement Asymétrique 256-bit
                  </h3>

                  <p>
                    Le lien de réinitialisation temporaire est
                    sécurisé et signé cryptographiquement avec
                    jeton inviolable.
                  </p>

                </div>

                {/* Card 2 */}
                <div className="technical-card">

                  <div className="technical-card-top">

                    <span className="technical-icon">
                      <span className="material-symbols-outlined">
                        database
                      </span>
                    </span>

                    <span className="technical-code success">
                      100% Intact
                    </span>

                  </div>

                  <h3>
                    Protection Données & Stratégies
                  </h3>

                  <p>
                    Vos pondérations de bankroll, alertes de
                    value bets et modèles probabilistes sont
                    conservés intacts.
                  </p>

                </div>

                {/* Card 3 */}
                <div className="technical-card">

                  <div className="technical-card-top">

                    <span className="technical-icon">
                      <span className="material-symbols-outlined">
                        timer
                      </span>
                    </span>

                    <span className="technical-code">
                      TTL 900s
                    </span>

                  </div>

                  <h3>
                    Lien à Durée Limitée (15 min)
                  </h3>

                  <p>
                    Invalidation automatique pour garantir une
                    sécurité absolue contre toute tentative
                    d&apos;interception.
                  </p>

                </div>

                {/* Card 4 */}
                <div className="technical-card">

                  <div className="technical-card-top">

                    <span className="technical-icon">
                      <span className="material-symbols-outlined">
                        verified_user
                      </span>
                    </span>

                    <span className="technical-code">
                      24/7 Desk
                    </span>

                  </div>

                  <h3>
                    Support Dédié & Double Validation
                  </h3>

                  <p>
                    Procédure d&apos;audit direct par notre équipe
                    d&apos;ingénieurs quantitatifs en cas d&apos;accès
                    compromis.
                  </p>

                </div>

              </div>

              {/* Security Protocol */}

              <div className="security-protocol">

                <span className="material-symbols-outlined">
                  format_image_left
                </span>

                <span>
                  Protocole de sécurité conforme{" "}
                  <strong>NIST SP 800-63B</strong>
                  {" "}• Surveillance d&apos;anomalies de connexion
                  et détection de force brute active.
                </span>

              </div>

              {/* Footer */}

              <div className="institutional-footer">

                <span>
                  © 2025 SportPulse AI. Tous droits réservés.
                </span>

                <div className="institutional-links">

                  <a href="#terms">
                    Conditions
                  </a>

                  <span>•</span>

                  <a href="#privacy">
                    Confidentialité
                  </a>

                  <span>•</span>

                  <a href="#risk">
                    Modélisation & Risques
                  </a>

                </div>

              </div>

            </section>

            {/* ========================================
                RIGHT COLUMN
            ======================================== */}

            <section className="reset-section">

              <div
                className="reset-card"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsCardHovered(true)}
                onMouseLeave={() => setIsCardHovered(false)}
              >

                {/* Spotlight */}

                <div
                  className={`card-glow ${
                    isCardHovered ? "active" : ""
                  }`}
                  style={{
                    background: `radial-gradient(
                      400px circle at ${mousePosition.x}px ${mousePosition.y}px,
                      rgba(0, 200, 150, 0.08),
                      transparent 80%
                    )`,
                  }}
                />

                {/* ========================================
                    CARD HEADER
                ======================================== */}

                <div className="reset-header">

                  <div className="reset-brand">

                    <div className="reset-icon">

                      <span className="material-symbols-outlined">
                        lock_reset
                      </span>

                    </div>

                    <div>

                      <span className="reset-label">
                        AUTHENTIFICATION
                      </span>

                      <div className="reset-title">
                        Réinitialisation
                      </div>

                    </div>

                  </div>

                  {/* View switcher */}

                  <div className="view-switcher">

                    <button
                      type="button"
                      className={
                        view === "form"
                          ? "view-tab active"
                          : "view-tab"
                      }
                      onClick={showFormState}
                    >
                      Formulaire
                    </button>

                    <button
                      type="button"
                      className={
                        view === "success"
                          ? "view-tab active"
                          : "view-tab"
                      }
                      onClick={showSuccessState}
                    >
                      Succès
                    </button>

                  </div>

                </div>

                {/* ========================================
                    FORM STATE
                ======================================== */}

                {view === "form" && (

                  <div className="form-state">

                    <div className="form-introduction">

                      <h2>
                        Mot de passe oublié ?
                      </h2>

                      <p>
                        Indiquez l&apos;adresse email associée à votre
                        compte SportPulse AI. Nous vous
                        transmettrons un lien sécurisé pour définir
                        un nouveau mot de passe.
                      </p>

                    </div>

                    <form
                      className="reset-form"
                      onSubmit={handleFormSubmit}
                    >

                      <div className="email-field">

                        <div className="email-label-row">

                          <label htmlFor="recovery-email">
                            Adresse email
                          </label>

                          <span>
                            Institutionnel ou personnel
                          </span>

                        </div>

                        <div className="email-input-wrapper">

                          <span className="material-symbols-outlined">
                            mail
                          </span>

                          <input
                            id="recovery-email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                              setEmail(event.target.value)
                            }
                            placeholder="analyste@hedgefund.com"
                            required
                          />

                        </div>

                      </div>

                      <button
                        type="submit"
                        className="reset-button"
                      >

                        <span className="reset-button-glow" />

                        <span>
                          Envoyer le lien de réinitialisation
                        </span>

                        <span className="material-symbols-outlined">
                          arrow_forward
                        </span>

                      </button>

                    </form>

                  </div>

                )}

                {/* ========================================
                    SUCCESS STATE
                ======================================== */}

                {view === "success" && (

                  <div className="success-state">

                    <div className="success-box">

                      <div className="success-icon">

                        <span className="material-symbols-outlined">
                          mark_email_read
                        </span>

                      </div>

                      <div className="success-heading">

                        <span className="email-sent-badge">
                          EMAIL ENVOYÉ
                        </span>

                        <h2>
                          Vérifiez votre boîte
                        </h2>

                      </div>

                      <p>
                        Un lien cryptographique valable{" "}
                        <strong>
                          15 minutes
                        </strong>{" "}
                        a été transmis avec succès à :
                      </p>

                      <div className="target-email">

                        <span className="target-dot" />

                        <span>
                          {email}
                        </span>

                      </div>

                    </div>

                    <div className="success-actions">

                      <button
                        type="button"
                        className="resend-button"
                        onClick={handleResend}
                        disabled={isResending}
                      >

                        <span className="material-symbols-outlined">
                          cached
                        </span>

                        <span>
                          {isResending
                            ? `${resendMessage} (dans ${resendCooldown}s)`
                            : resendMessage}
                        </span>

                      </button>

                      <button
                        type="button"
                        className="modify-email-button"
                        onClick={showFormState}
                      >
                        Modifier l&apos;adresse email
                      </button>

                    </div>

                  </div>

                )}

                {/* ========================================
                    NAVIGATION
                ======================================== */}

                <div className="navigation-links">

                  <a
                    href="/auth/Login"
                    className="back-login"
                  >

                    <span className="material-symbols-outlined">
                      arrow_back
                    </span>

                    <span>
                      Retour à la connexion
                    </span>

                  </a>

                  <div className="register-prompt">

                    Pas encore de compte ?{" "}

                    <a href="/auth/register">
                      S&apos;inscrire gratuitement
                    </a>

                  </div>

                </div>

                {/* ========================================
                    REASSURANCE
                ======================================== */}

                <div className="reassurance-list">

                  <div className="reassurance-item">

                    <span className="material-symbols-outlined">
                      shield
                    </span>

                    <span>
                      Jeton chiffré unique à usage unique
                      (SHA-256)
                    </span>

                  </div>

                  <div className="reassurance-item">

                    <span className="material-symbols-outlined">
                      schedule
                    </span>

                    <span>
                      Expiration automatique sous 15 minutes
                    </span>

                  </div>

                  <div className="reassurance-item">

                    <span className="material-symbols-outlined">
                      lock
                    </span>

                    <span>
                      Aucune donnée sensible ou mot de passe
                      en clair par email
                    </span>

                  </div>

                </div>

              </div>

            </section>

          </div>

        </div>

      </main>

    </div>
  );
};

export default ForgotPassword;
