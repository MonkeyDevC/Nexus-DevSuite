import styles from "./WorkspaceShell.module.css";

/**
 * Shell para workspaces (kanban, builder): cabecera + área principal + panel lateral opcional.
 * @param {"start"|"end"} [props.sidebarPosition] — lado del panel secundario (start = izquierda en LTR)
 */
export function WorkspaceShell({
  header,
  sidebar,
  sidebarPosition = "start",
  children,
  className = "",
  ...rest
}) {
  const hasSidebar = sidebar != null;
  const bodyClass = [
    styles.body,
    !hasSidebar ? styles.bodyNoSidebar : "",
    hasSidebar && sidebarPosition === "start" ? styles.bodyWithSidebarStart : "",
    hasSidebar && sidebarPosition === "end" ? styles.bodyWithSidebarEnd : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      {header ? <div className={styles.header}>{header}</div> : null}
      <div className={bodyClass}>
        {hasSidebar && sidebarPosition === "start" ? (
          <aside className={styles.sidebar}>{sidebar}</aside>
        ) : null}
        <div className={styles.main}>{children}</div>
        {hasSidebar && sidebarPosition === "end" ? (
          <aside className={styles.sidebar}>{sidebar}</aside>
        ) : null}
      </div>
    </div>
  );
}
