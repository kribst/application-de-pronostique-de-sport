"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { postAuthAction } from "@/lib/auth-actions";
import "./PasswordReset.css";

const PasswordReset: React.FC = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const criteria = useMemo(() => ({
    length: password.length >= 10,
    case: /[A-Z]/.test(password) && /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const score = Object.values(criteria).filter(Boolean).length;

  const entropy = useMemo(() => {
    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^A-Za-z0-9]/.test(password)) pool += 33;

    return pool > 0 ? Math.round(password.length * Math.log2(pool)) : 0;
  }, [password]);

  const strength = useMemo(() => {
    if (!password) return { label: "En attente", className: "strength-waiting" };
    if (score === 1) return { label: "Faible", className: "strength-weak" };
    if (score === 2) return { label: "Moyen", className: "strength-medium" };
    if (score === 3) return { label: "Robuste", className: "strength-strong" };
    return { label: "Excellent", className: "strength-excellent" };
  }, [password, score]);

  const passwordsMatch = password === confirmation;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid") ?? "";
    const token = params.get("token") ?? "";

    if (!uid || !token) {
      setFormError("Ce lien de réinitialisation est invalide ou incomplet.");
      return;
    }

    if (!passwordsMatch) {
      setFormError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const result = await postAuthAction("/api/auth/password-reset/confirm", {
      uid,
      token,
      password,
      password_confirm: confirmation,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message ?? "La réinitialisation a échoué. Demande un nouveau lien.");
      return;
    }

    setSuccess(true);
    window.setTimeout(() => {
      router.replace("/auth/login?passwordReset=1");
    }, 1200);
  };

  const renderCriterion = (
    valid: boolean,
    text: string,
    className: string
  ) => (
    <div className={`criterion ${valid ? "criterion-valid" : ""}`} id={className}>
      <span className="material-symbols-outlined criterion-icon">
        {valid ? "check_circle" : "radio_button_unchecked"}
      </span>
      <span>{text}</span>
    </div>
  );

  return (
    <div className="sportpulse-page">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand-area">
            <div className="brand">
              <div className="brand-icon">
                <span className="material-symbols-outlined">query_stats</span>
              </div>
              <span className="brand-name">
                SportPulse<span>AI</span>
              </span>
            </div>

            <span className="brand-divider" />

            <span className="engine-badge">Quant Engine</span>
          </div>

          <div className="topbar-right">
            <div className="model-status">
              <span className="status-dot pulse" />
              <span>v2.4 Quant Models Active</span>
            </div>

            <nav className="top-nav">
              <a href="#support">Support</a>
              <a href="#documentation">Documentation</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="page-main">
        <div className="container content-wrapper">
          <div className="context-row">
            <div className="breadcrumb">
              <span className="dark">GATEWAY</span>
              <span>/</span>
              <span>AUTH_NODE_09</span>
              <span>/</span>
              <span className="primary">TOKEN_RESET_KEY</span>
            </div>

            <div className="tls-status">
              <span className="tiny-status pulse" />
              <span>CHNL_TLS_1.3_ENCRYPTED</span>
            </div>
          </div>

          <div className="main-grid">
            <section className="security-column">
              <div className="security-header">
                <div className="section-label">
                  <span className="material-symbols-outlined">shield</span>
                  <span>SÉCURITÉ DU COMPTE</span>
                </div>

                <h1>Sécurisez l&apos;accès à vos modèles prédictifs</h1>

                <p>
                  La mise à jour de votre clé d&apos;authentification protège vos
                  configurations de simulations statistiques, vos flux de cotes
                  en temps réel et l&apos;intégrité de vos accès API quantitatifs.
                </p>
              </div>

              <div className="technical-grid">
                <article className="technical-card">
                  <div className="technical-icon">
                    <span className="material-symbols-outlined">lock_reset</span>
                  </div>
                  <h3>Hachage sécurisé</h3>
                  <p>
                    Protection mémoire renforcée Argon2id et salage
                    cryptographique unique par transaction.
                  </p>
                  <div className="technical-meta success">
                    <span className="material-symbols-outlined">verified</span>
                    <span>Argon2id 64MB</span>
                  </div>
                </article>

                <article className="technical-card">
                  <div className="technical-icon">
                    <span className="material-symbols-outlined">devices_off</span>
                  </div>
                  <h3>Révocation globale</h3>
                  <p>
                    Déconnexion automatique immédiate de tous les terminaux
                    actifs et régénération des sessions JWT.
                  </p>
                  <div className="technical-meta">
                    <span className="material-symbols-outlined">sync</span>
                    <span>Sessions purgées: 3</span>
                  </div>
                </article>

                <article className="technical-card">
                  <div className="technical-icon">
                    <span className="material-symbols-outlined">database</span>
                  </div>
                  <h3>Sauvegarde des modèles</h3>
                  <p>
                    Conservation intégrale des hyperparamètres, pondérations
                    personnalisées et backtests historiques.
                  </p>
                  <div className="technical-meta success">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Intégrité 100%</span>
                  </div>
                </article>

                <article className="technical-card">
                  <div className="technical-icon">
                    <span className="material-symbols-outlined">history_edu</span>
                  </div>
                  <h3>Journal d&apos;audit</h3>
                  <p>
                    Horodatage certifié conforme aux standards SOC2 Type II et
                    traçabilité inviolable sur ledger interne.
                  </p>
                  <div className="technical-meta">
                    <span className="material-symbols-outlined">gavel</span>
                    <span>ISO 27001 / SOC2</span>
                  </div>
                </article>
              </div>

              <div className="cluster-status">
                <div className="cluster-info">
                  <span className="cluster-dot pulse" />
                  <div>
                    <strong>Nœud HSM Francfort (eu-central-1)</strong>
                    <span>Chiffrement matériel FIPS 140-2 Niveau 3 opérationnel</span>
                  </div>
                </div>

                <div className="latency">
                  <strong>0.42 ms</strong>
                  <span>Latence réseau</span>
                </div>
              </div>
            </section>

            <section className="reset-column">
              <div className="reset-card">
                <div className="step-row">
                  <span>Étape 2 sur 2</span>
                  <div className="validated-token">
                    <span className="material-symbols-outlined">key</span>
                    <span>Lien de reset reçu</span>
                  </div>
                </div>

                <div className="identity">
                  <div className="identity-email">
                    <span className="material-symbols-outlined">alternate_email</span>
                    <span>Lien sécurisé reçu par email</span>
                  </div>
                  <span className="institutional">15 MINUTES</span>
                </div>

                <div className="form-heading">
                  <h2>Nouveau mot de passe</h2>
                  <p>
                    Définissez une clé cryptographique conforme aux normes
                    d&apos;accès SportPulse AI.
                  </p>
                </div>

                {formError ? (
                  <p className="form-feedback error" role="alert">{formError}</p>
                ) : null}

                <form className="reset-form" onSubmit={handleSubmit}>
                  <div className="field-group">
                    <div className="field-label-row">
                      <label htmlFor="new-password">Nouveau mot de passe</label>
                      <span>Entropie : {entropy} bits</span>
                    </div>

                    <div className="password-input">
                      <span className="material-symbols-outlined input-icon">lock</span>
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        required
                      />
                      <button
                        type="button"
                        aria-label="Afficher ou masquer le mot de passe"
                        className="visibility-button"
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>

                    <div className="strength-area">
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map((bar) => (
                          <span
                            key={bar}
                            className={`strength-bar ${
                              bar <= score ? `strength-fill-${score}` : ""
                            }`}
                          />
                        ))}
                      </div>

                      <div className="strength-label">
                        <span>Robustesse algorithmique :</span>
                        <strong className={strength.className}>{strength.label}</strong>
                      </div>
                    </div>

                    <div className="criteria">
                      {renderCriterion(criteria.length, "10 caractères min.", "crit-len")}
                      {renderCriterion(criteria.case, "Majuscule & minuscule", "crit-case")}
                      {renderCriterion(criteria.number, "Au moins un chiffre", "crit-num")}
                      {renderCriterion(criteria.symbol, "Au moins un symbole", "crit-sym")}
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="confirm-password">Confirmer le nouveau mot de passe</label>

                    <div className="password-input">
                      <span className="material-symbols-outlined input-icon">password</span>
                      <input
                        id="confirm-password"
                        type={showConfirmation ? "text" : "password"}
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="••••••••••••••••"
                        required
                      />
                      <button
                        type="button"
                        aria-label="Afficher ou masquer la confirmation"
                        className="visibility-button"
                        onClick={() => setShowConfirmation((value) => !value)}
                      >
                        <span className="material-symbols-outlined">
                          {showConfirmation ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>

                    {confirmation && (
                      <div className={`match-status ${passwordsMatch ? "match" : "no-match"}`}>
                        <span className="material-symbols-outlined">
                          {passwordsMatch ? "check" : "close"}
                        </span>
                        <span>
                          {passwordsMatch
                            ? "Les mots de passe correspondent parfaitement"
                            : "Les mots de passe ne correspondent pas"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="submit-area">
                    <button
                      className={`submit-button ${success ? "success-button" : ""}`}
                      id="submit-btn"
                      type="submit"
                      disabled={submitting || success}
                    >
                      {submitting ? (
                        <>
                          <span className="material-symbols-outlined spin">progress_activity</span>
                          <span>Sécurisation en cours...</span>
                        </>
                      ) : success ? (
                        <>
                          <span className="material-symbols-outlined">verified</span>
                          <span>Mot de passe mis à jour</span>
                        </>
                      ) : (
                        <>
                          <span>Mettre à jour et se connecter</span>
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="back-login">
                    <a href={success ? "/auth/login?passwordReset=1" : "/auth/forgot-password"}>
                      <span className="material-symbols-outlined">arrow_back</span>
                      <span>{success ? "Retour à la connexion" : "Demander un nouveau lien"}</span>
                    </a>
                  </div>

                  <div className="assurance-badges">
                    <div>
                      <span className="material-symbols-outlined green">enhanced_encryption</span>
                      <span>TLS 1.3 / ChaCha20</span>
                    </div>
                    <i />
                    <div>
                      <span className="material-symbols-outlined">fingerprint</span>
                      <span>MFA Requis au login</span>
                    </div>
                    <i />
                    <div>
                      <span className="material-symbols-outlined green">health_and_safety</span>
                      <span>SOC2 Type II</span>
                    </div>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-copy">
            <span className="material-symbols-outlined">verified_user</span>
            <span>
              © 2025 SportPulse AI Technologies Inc. Plateforme réservée aux
              investisseurs qualifiés.
            </span>
          </div>

          <div className="footer-links">
            <a href="#terms">Conditions d&apos;utilisation</a>
            <span>•</span>
            <a href="#privacy">Confidentialité</a>
            <span>•</span>
            <a href="#risks">Modélisation & Risques</a>
            <span>•</span>
            <a href="#responsible-gaming">Jeu responsable</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PasswordReset;