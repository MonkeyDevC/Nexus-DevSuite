/**
 * ----
 * Modulo: Badge
 * Descripcion: Badge reutilizable con variantes (estilos propios, sin Bootstrap).
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import styles from "./Badge.module.css";

const VARIANT_CLASS = {
  primary: styles.primary,
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
  info: styles.info,
  secondary: styles.secondary,
};

export default function Badge({ label, variant }) {
  const v = VARIANT_CLASS[variant] || VARIANT_CLASS.secondary;
  return <span className={`${styles.badge} ${v}`}>{label ?? "—"}</span>;
}
