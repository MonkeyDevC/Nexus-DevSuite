import { useCallback, useId, useState } from "react";
import styles from "./Tabs.module.css";

/**
 * Pestañas accesibles (tablist / tab / tabpanel).
 * @param {{ id: string, label: string, panel: import("react").ReactNode }[]} props.items
 */
export function Tabs({
  items = [],
  defaultValue,
  value: valueControlled,
  onChange,
  className = "",
  ...rest
}) {
  const uid = useId();
  const safeItems = Array.isArray(items) ? items : [];
  const firstId = safeItems[0]?.id ?? "a";

  const [internal, setInternal] = useState(defaultValue ?? firstId);
  const isControlled = valueControlled !== undefined;
  const activeId = isControlled ? valueControlled : internal;

  const setActive = useCallback(
    (id) => {
      if (!isControlled) setInternal(id);
      onChange?.(id);
    },
    [isControlled, onChange]
  );

  const active = safeItems.find((t) => t.id === activeId) ?? safeItems[0];
  const panelId = `${uid}-panel-${active?.id}`;
  const tabBaseId = `${uid}-tab`;

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      <div className={styles.tabList} role="tablist" aria-orientation="horizontal">
        {safeItems.map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${tabBaseId}-${item.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={[styles.tab, selected ? styles.tabActive : ""].filter(Boolean).join(" ")}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active ? (
        <div
          className={styles.panel}
          role="tabpanel"
          id={panelId}
          aria-labelledby={`${tabBaseId}-${active.id}`}
          tabIndex={0}
        >
          {active.panel}
        </div>
      ) : null}
    </div>
  );
}
