/**
 * Conmutador de modo: tablist accesible dentro de la barra de herramientas (iconos + tooltips).
 */
import { Columns2, Eye, FilePenLine } from "lucide-react";
import styles from "./EvidenceModeSwitch.module.css";

const MODES = [
  { id: "editor", label: "Editor", hint: "Edición de Markdown", Icon: FilePenLine },
  { id: "preview", label: "Preview", hint: "Solo vista previa", Icon: Eye },
  { id: "split", label: "Split", hint: "Editor y vista previa", Icon: Columns2 },
];

export default function EvidenceModeSwitch({ mode, onModeChange, disabled, tabListId, getTabId, getPanelId }) {
  return (
    <div
      role="tablist"
      id={tabListId}
      aria-label="Modo de vista del Evidence Studio"
      className={styles.tabList}
    >
      {MODES.map((m) => {
        const selected = mode === m.id;
        const tabId = getTabId(m.id);
        const panelId = getPanelId(m.id);
        const Ic = m.Icon;
        const title = `${m.label} — ${m.hint}`;
        return (
          <button
            key={m.id}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            className={[styles.tab, selected ? styles.tabSelected : styles.tabIdle].join(" ")}
            title={title}
            aria-label={title}
            onClick={() => !disabled && onModeChange(m.id)}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const idx = MODES.findIndex((x) => x.id === mode);
                const next =
                  e.key === "ArrowRight"
                    ? MODES[(idx + 1) % MODES.length]
                    : MODES[(idx - 1 + MODES.length) % MODES.length];
                onModeChange(next.id);
                document.getElementById(getTabId(next.id))?.focus();
              }
            }}
          >
            <Ic size={16} strokeWidth={2} aria-hidden className={styles.tabIcon} />
          </button>
        );
      })}
    </div>
  );
}
