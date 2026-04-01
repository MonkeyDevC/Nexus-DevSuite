import styles from "./SettingsLayout.module.css";

/**
 * Layout tipo ajustes: navegación lateral + panel principal.
 * @param {{ id: string, label: string }[]} props.navItems
 * @param {string} props.activeId
 * @param {(id: string) => void} [props.onNavChange]
 * @param {Record<string, import("react").ReactNode>} props.panels — mapa id → contenido
 */
export function SettingsLayout({
  navItems = [],
  activeId,
  onNavChange,
  panels = {},
  className = "",
  ...rest
}) {
  const safeNav = Array.isArray(navItems) ? navItems : [];
  const content = panels[activeId] ?? null;

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      <nav className={styles.nav} aria-label="Configuración">
        {safeNav.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className={[styles.navItem, active ? styles.navItemActive : ""].filter(Boolean).join(" ")}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavChange?.(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className={styles.main}>{content}</div>
    </div>
  );
}
