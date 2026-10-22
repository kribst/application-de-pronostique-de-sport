import Link from "next/link";

import AuthedPage from "@/components/layout/AuthedPage";

import styles from "./page.module.css";

export default function TeamNotFound() {
  return (
    <AuthedPage>
      <div className={styles.page}>
        <section className={`${styles.emptyState} ${styles.stateWrap}`}>
          <div className={styles.errorIcon}>
            <span aria-hidden="true" className={styles.icon}>
              error_outline
            </span>
          </div>
          <h2>Équipe introuvable</h2>
          <p>Cette équipe n&apos;existe pas ou n&apos;est plus disponible.</p>
          <Link className={styles.primaryButton} href="/teams">
            <span aria-hidden="true" className={styles.icon}>
              arrow_back
            </span>
            Retour aux équipes
          </Link>
        </section>
      </div>
    </AuthedPage>
  );
}
