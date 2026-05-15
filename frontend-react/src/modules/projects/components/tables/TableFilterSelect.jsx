/**
 * Desplegable de filtros para tablas (lista oscura, sin <option> del SO).
 */
import { useEffect, useRef, useState } from "react";
import styles from "./TableFilterSelect.module.css";

/**
 * @param {{
 *   id?: string,
 *   ariaLabel: string,
 *   value: string,
 *   options: { value: string, label: string }[],
 *   onChange: (value: string) => void,
 *   disabled?: boolean,
 * }} props
 */
export default function TableFilterSelect({ id, ariaLabel, value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={styles.trigger}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={styles.triggerLabel}>{selected?.label ?? ""}</span>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul className={styles.list} role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={opt.value === value ? styles.optionActive : styles.option}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
