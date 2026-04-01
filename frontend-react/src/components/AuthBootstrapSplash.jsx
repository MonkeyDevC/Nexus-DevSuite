/**
 * Pantalla neutra mientras se resuelve la sesión inicial (sin rutas ni layout de app).
 */
import { BRAND_LOGO_PNG_SRC } from "../constants/brandAssets.js";
import styles from "./AuthBootstrapSplash.module.css";

export default function AuthBootstrapSplash() {
  return (
    <div className={styles.root} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.card}>
        <img
          className={styles.logo}
          src={BRAND_LOGO_PNG_SRC}
          alt=""
          width={48}
          height={48}
          decoding="async"
        />
        <p className={styles.title}>Nexus DevSuite</p>
        <p className={styles.subtitle}>Preparando tu sesión…</p>
        <div className={styles.bar} aria-hidden>
          <div className={styles.barInner} />
        </div>
      </div>
    </div>
  );
}
