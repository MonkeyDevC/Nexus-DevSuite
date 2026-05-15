import { createPortal } from "react-dom";
import styles from "./TableColumnFilter.module.css";

/**
 * Lista de opciones del filtro; se renderiza en portal para evitar overflow:hidden de tablas.
 * @param {object} props
 * @param {boolean} props.open
 * @param {{ top: number, left: number, minWidth: number }} props.position
 * @param {{ value: string, label: string }[]} props.options
 * @param {string} props.value
 * @param {(next: string) => void} props.onSelect
 * @param {() => void} props.onClose
 * @param {string} props.menuId
 * @param {import("react").RefObject<HTMLUListElement|null>} props.menuRef
 */
export function TableColumnFilterMenu({ open, position, options, value, onSelect, onClose, menuId, menuRef }) {
  if (!open || typeof document === "undefined") return null;

  const list = Array.isArray(options) ? options : [];

  const content = (
    <ul
      ref={menuRef}
      id={menuId}
      className={styles.menuPortal}
      role="listbox"
      aria-activedescendant={undefined}
      style={{
        top: position.top,
        left: position.left,
        minWidth: position.minWidth,
      }}
    >
      {list.map((opt, idx) => {
        const selected = String(opt.value) === String(value);
        return (
          <li key={`${opt.value}-${idx}`} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={selected}
              className={[styles.menuItem, selected ? styles.menuItemSelected : ""].filter(Boolean).join(" ")}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(String(opt.value));
                onClose();
              }}
            >
              {opt.label}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return createPortal(content, document.body);
}
