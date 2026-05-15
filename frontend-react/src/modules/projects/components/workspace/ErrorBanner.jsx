/**
 * ----
 * Modulo: ErrorBanner
 * Descripcion: Mensajeria de error uniforme para dominio Project.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-26
 * ----
 */
import styles from "./ErrorBanner.module.css";

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className={styles.banner} role="status">{message}</div>;
}
