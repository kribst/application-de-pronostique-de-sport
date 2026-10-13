"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { postAuthAction } from "@/lib/auth-actions";
import styles from "./EmailVerification.module.css";

type VerificationState = "pending" | "success" | "error";

const EmailVerification = () => {
  const [verificationState, setVerificationState] =
    useState<VerificationState>("pending");
  const [feedback, setFeedback] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setVerificationState("error");
        setFeedback("Le lien de confirmation est absent ou incomplet.");
      });
      return () => {
        active = false;
      };
    }

    void postAuthAction("/api/auth/verify-email", { token }).then((result) => {
      if (!active) return;
      setVerificationState(result.ok ? "success" : "error");
      setFeedback(
        result.message ??
          (result.ok ? "Adresse email confirmée." : "Le lien est invalide ou expiré.")
      );
    });

    return () => {
      active = false;
    };
  }, []);

  const handleResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (resending) return;

    setResending(true);
    setResendFeedback("");
    const result = await postAuthAction("/api/auth/resend-verification", {
      email: resendEmail.trim(),
    });
    setResendFeedback(
      result.message ??
        (result.ok
          ? "Si un compte non confirmé correspond à cette adresse, un email a été envoyé."
          : "Le renvoi a échoué. Réessaie.")
    );
    setResending(false);
  };

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

  return (
    <main className={styles.page}>
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gridPattern} />
        <div className={`${styles.ambientGlow} ${styles.glowCyan}`} />
        <div className={`${styles.ambientGlow} ${styles.glowEmerald}`} />
        <div className={`${styles.ambientGlow} ${styles.glowBottom}`} />
      </div>

      <div className={styles.mainContainer}>
        <div className={styles.contentWrapper}>

          {/* HEADER */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.brandGroup}>

                <div className={styles.logo}>
                  <span className="material-symbols-outlined">
                    query_stats
                  </span>
                </div>

                <div className={styles.brandName}>
                  SportPulse
                  <span>.AI</span>
                </div>
              </div>

              <span className={styles.quantBadge}>
                QUANT ENGINE
              </span>

              <div className={styles.versionBadge}>
                <span className={styles.statusDot} />
                <span>v2.4 Quant Models Active</span>
              </div>
            </div>

            <div className={styles.headerLinks}>
              <a href="#support">Support</a>

              <a href="#docs" className={styles.documentation}>
                Documentation
                <span className="material-symbols-outlined">
                  arrow_outward
                </span>
              </a>
            </div>
          </header>

          {/* MAIN GRID */}
          <div className={styles.mainGrid}>

            {/* LEFT COLUMN */}
            <section className={styles.leftColumn}>

              <div className={styles.introduction}>
                <div className={styles.securityBadge}>
                  <span className="material-symbols-outlined">
                    verified_user
                  </span>

                  <span>
                    SÉCURITÉ &amp; VÉRIFICATION DU COMPTE
                  </span>
                </div>

                <h1>
                  Activez votre accès aux modèles quantitatifs
                  et signaux probabilistes
                </h1>

                <p>
                  La validation de votre adresse email garantit
                  l&apos;intégrité de vos simulations Monte Carlo, l&apos;accès
                  sécurisé à l&apos;API et la réception de vos alertes de
                  cotes en temps réel.
                </p>
              </div>

              {/* SECURITY CARDS */}
              <div className={styles.featureGrid}>

                {/* Card 1 */}
                <div className={styles.featureCard}>
                  <div className={styles.featureTop}>
                    <div className={styles.featureIcon}>
                      <span className="material-symbols-outlined">
                        bolt
                      </span>
                    </div>

                    <span className={styles.featureTag}>
                      Zéro délai
                    </span>
                  </div>

                  <div>
                    <h3>Activation Instantanée</h3>

                    <p>
                      Vos flux de calculs Dixon-Coles et quotas
                      d&apos;analyses sont débloqués dès validation du lien.
                    </p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className={styles.featureCard}>
                  <div className={styles.featureTop}>
                    <div className={styles.featureIcon}>
                      <span className="material-symbols-outlined">
                        key
                      </span>
                    </div>

                    <span className={styles.featureTag}>
                      Chiffrement E2E
                    </span>
                  </div>

                  <div>
                    <h3>
                      Sécurisation des Clés API &amp; Modèles
                    </h3>

                    <p>
                      Vos stratégies personnalisées et pondérations
                      de bankroll sont isolées et sauvegardées.
                    </p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className={styles.featureCard}>
                  <div className={styles.featureTop}>
                    <div className={styles.featureIcon}>
                      <span className="material-symbols-outlined">
                        trending_up
                      </span>
                    </div>

                    <span className={styles.featureTag}>
                      Temps réel
                    </span>
                  </div>

                  <div>
                    <h3>
                      Alertes Cote Cible &amp; Inefficiencies
                    </h3>

                    <p>
                      Réception immédiate par email des opportunités
                      à espérance positive (EV+) sans latence.
                    </p>
                  </div>
                </div>

                {/* Card 4 */}
                <div className={styles.featureCard}>
                  <div className={styles.featureTop}>
                    <div className={styles.featureIcon}>
                      <span className="material-symbols-outlined">
                        gavel
                      </span>
                    </div>

                    <span className={styles.featureTag}>
                      Conformité RGPD
                    </span>
                  </div>

                  <div>
                    <h3>
                      Jeu Responsable &amp; Traçabilité
                    </h3>

                    <p>
                      Respect strict des protocoles de protection
                      des utilisateurs et audit des sessions.
                    </p>
                  </div>
                </div>

              </div>

              {/* LIVE ENGINE */}
              <div className={styles.liveEngine}>
                <div className={styles.liveEngineLeft}>
                  <span className={styles.pingDot} />

                  <span>
                    CLUSTER QUOTE SYNC: EUR-1 (0.84ms latency)
                  </span>
                </div>

                <div className={styles.signalBars}>
                  <span className={styles.bar1} />
                  <span className={styles.bar2} />
                  <span className={styles.bar3} />
                  <span className={styles.bar4} />
                </div>
              </div>

              {/* ASSURANCE */}
              <div className={styles.assurance}>
                <span className="material-symbols-outlined">
                  lock_clock
                </span>

                <span>
                  Code de sécurité temporaire à 6 chiffres •
                  Expire dans 15 minutes • Aucun mot de passe demandé
                </span>
              </div>

            </section>

            {/* RIGHT COLUMN */}
            <section className={styles.rightColumn}>

              <div
                ref={cardRef}
                className={styles.verificationCard}
              >

                {/* SPOTLIGHT */}
                <div
                  ref={glowRef}
                  className={styles.glowOverlay}
                />

                <div className={styles.protocolHeader}>
                  <span>Vérification de l’adresse email</span>
                  <span className={styles.stateStatus}>
                    {verificationState === "pending"
                      ? "En cours"
                      : verificationState === "success"
                        ? "Confirmée"
                        : "Action requise"}
                  </span>
                </div>

                {verificationState !== "success" && (
                  <div className={styles.pendingView}>
                    <div className={styles.cardHeader}>
                      <div className={styles.emailHeaderTop}>
                        <div className={styles.emailIconWrapper}>
                          <span className="material-symbols-outlined">
                            {verificationState === "pending" ? "mark_email_unread" : "mark_email_read"}
                          </span>
                        </div>
                        <span className={styles.authentication}>
                          CONFIRMATION DE COMPTE
                        </span>
                      </div>
                      <h2>Vérifiez votre adresse email</h2>
                      <p>
                        Le lien signé reçu par email est vérifié auprès du serveur.
                        Il est valable 48 heures.
                      </p>
                      <div className={styles.emailChip}>
                        <div className={styles.emailAddress}>
                          <span className="material-symbols-outlined">
                            alternate_email
                          </span>
                          <span>Lien de confirmation</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.otpSection}>
                      <div className={styles.otpHeader}>
                        <label>État de la demande</label>
                        <span>{verificationState === "pending" ? "Validation automatique" : "Lien invalide ou expiré"}</span>
                      </div>
                      <p
                        className={verificationState === "error" ? styles.actionError : styles.feedbackMessage}
                        role={verificationState === "error" ? "alert" : "status"}
                      >
                        {feedback || "Validation du lien en cours..."}
                      </p>

                      {verificationState === "pending" ? (
                        <div className={styles.loadingMessage} role="status">
                          <span className="material-symbols-outlined">progress_activity</span>
                          <span>Contact du serveur en cours...</span>
                        </div>
                      ) : (
                        <form className={styles.resendForm} onSubmit={handleResend}>
                          <label htmlFor="verification-email">Renvoyer un lien de confirmation</label>
                          <input
                            className={styles.resendInput}
                            id="verification-email"
                            type="email"
                            autoComplete="email"
                            value={resendEmail}
                            onChange={(event) => setResendEmail(event.target.value)}
                            placeholder="vous@exemple.com"
                            required
                          />
                          <button className={styles.primaryButton} type="submit" disabled={resending}>
                            {resending ? "Envoi en cours..." : "Renvoyer le lien"}
                          </button>
                          {resendFeedback ? (
                            <p className={styles.feedbackMessage} role="status">{resendFeedback}</p>
                          ) : null}
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {verificationState === "success" && (
                  <div className={styles.successView}>
                    <div className={styles.successIcon}>
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>
                    </div>
                    <div className={styles.successText}>
                      <h3>Adresse email confirmée</h3>
                      <p>{feedback || "Ton compte est maintenant vérifié. Tu peux te connecter."}</p>
                    </div>
                    <a className={styles.terminalButton} href="/auth/login?verified=1">
                      <span>Continuer vers la connexion</span>
                      <span className="material-symbols-outlined">
                        arrow_forward
                      </span>
                    </a>
                  </div>
                )}

                {/* TRUST GUARANTEES */}
                <div className={styles.trustGuarantees}>

                  <div className={styles.guaranteeRow}>

                    <div>
                      <span className="material-symbols-outlined verified">
                        verified
                      </span>

                      <span>
                        Lien vérifié par le backend
                      </span>
                    </div>

                    <div>
                      <span className="material-symbols-outlined">
                        lock
                      </span>

                      <span>
                        Lien signé valable 48 heures
                      </span>
                    </div>

                  </div>

                  <div className={styles.backLogin}>
                    <a href="/auth/login">
                      <span className="material-symbols-outlined">
                        arrow_back
                      </span>

                      <span>
                        Retour à la connexion
                      </span>
                    </a>
                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* FOOTER */}
          <footer className={styles.footer}>

            <div className={styles.footerBrand}>
              <span>SportPulse AI</span>
              <span>•</span>
              <span>
                © 2025 SportPulse AI. Tous droits réservés.
              </span>
            </div>

            <div className={styles.footerLinks}>
              <a href="#cgu">
                Conditions d&apos;utilisation
              </a>

              <a href="#privacy">
                Confidentialité
              </a>

              <a href="#models">
                Modélisation &amp; Risques
              </a>

              <a href="#rgpd">
                Jeu responsable
              </a>
            </div>

          </footer>

        </div>
      </div>
    </main>
  );
};

export default EmailVerification;