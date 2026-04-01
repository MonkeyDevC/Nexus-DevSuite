/**
 * Barra de pestañas compartida: configuración por descriptor + resolvers de DOM para ARIA.
 */
import { PROJECT_WORKSPACE_TABS } from "./projectWorkspaceTabs.js";

/**
 * @param {object} props
 * @param {import('./workspaceShellContracts.js').WorkspaceTabDescriptor[]} [props.tabs]
 * @param {string} props.activeTab
 * @param {(id: string) => void} props.onRequestTabChange
 * @param {boolean} [props.disabled]
 * @param {string} props.ariaLabel
 * @param {string} [props.className]
 * @param {string} [props.tabClassName]
 * @param {string} [props.tabActiveClassName]
 * @param {(tabId: string) => string} props.tabDomId
 * @param {(tabId: string) => string} props.panelDomId
 */
export default function WorkspaceTabBar({
  tabs = PROJECT_WORKSPACE_TABS,
  activeTab,
  onRequestTabChange,
  disabled = false,
  ariaLabel,
  className = "",
  tabClassName,
  tabActiveClassName,
  tabDomId,
  panelDomId,
}) {
  function onKeyDown(e) {
       if (disabled) return;
    const idx = tabs.findIndex((t) => t.id === activeTab);
    if (idx < 0) return;
    let nextIdx = idx;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextIdx = Math.min(tabs.length - 1, idx + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextIdx = Math.max(0, idx - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIdx = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIdx = tabs.length - 1;
    } else {
      return;
    }
    onRequestTabChange(tabs[nextIdx].id);
  }

  return (
    <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} className={className}>
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={tabDomId(t.id)}
            aria-selected={isActive}
            aria-controls={panelDomId(t.id)}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            className={[tabClassName, isActive ? tabActiveClassName : ""].filter(Boolean).join(" ")}
            onClick={() => onRequestTabChange(t.id)}
          >
            {t.icon ? <span aria-hidden>{t.icon}</span> : null}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
