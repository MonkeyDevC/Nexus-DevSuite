/**
 * ----
 * Modulo: Breadcrumb
 * Descripcion: Breadcrumb agnóstico; enlaces internos con React Router.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { Link } from "react-router-dom";
import styles from "./Breadcrumb.module.css";

export default function Breadcrumb({ items = [] }) {
  const safeItems = (Array.isArray(items) ? items : [])
    .filter((it) => it && typeof it === "object" && it.label != null)
    .map((it) => ({
      label: String(it.label),
      path: it.path ? String(it.path) : "",
    }));

  if (safeItems.length === 0) return null;

  return (
    <nav className={styles.nav} aria-label="breadcrumb">
      <ol className={styles.list}>
        {safeItems.map((it, idx) => {
          const isLast = idx === safeItems.length - 1;
          const label = it?.label ?? "—";
          const path = it?.path;

          return (
            <li
              key={`${label}-${idx}`}
              className={styles.item}
              aria-current={isLast ? "page" : undefined}
            >
              {isLast || !path ? (
                <span className={isLast ? styles.current : undefined}>{label}</span>
              ) : (
                <Link className={styles.link} to={path}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
