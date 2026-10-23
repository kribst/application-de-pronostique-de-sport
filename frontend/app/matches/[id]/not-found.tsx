import Link from "next/link";

import AuthedPage from "@/components/layout/AuthedPage";

import styles from "./page.module.css";

export default function MatchNotFound() {
  return (
    <AuthedPage>
      <div className={styles.page}>
        <section className={styles.panel}>
          <span aria-hidden="true" className={styles.icon}>
            error_outline
          </span>
          <h2>Match introuvable</h2>
          <p>Ce match n&apos;existe pas ou n&apos;est plus disponible.</p>
          <Link className={styles.button} href="/matches">
            <span aria-hidden="true" className={styles.icon}>
              arrow_back
            </span>
            Retour aux matchs
          </Link>
        </section>
      </div>
    </AuthedPage>
  );
}
