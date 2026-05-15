import { useCallback, useEffect, useId, useRef, useState } from "react";
import { TableColumnFilterTrigger } from "./TableColumnFilterTrigger.jsx";
import { TableColumnFilterMenu } from "./TableColumnFilterMenu.jsx";

/**
 * Filtro de columna: trigger en header + menú en portal.
 * @param {object} props
 * @param {string} props.value — valor actual ("" = sin filtro)
 * @param {{ value: string, label: string }[]} props.options — sin incluir “todas”; se añade al inicio
 * @param {(next: string) => void} props.onChange
 * @param {string} props.allLabel — ej. “Todas”
 * @param {string} props.ariaLabelTrigger
 * @param {boolean} [props.disabled]
 * @param {string} [props.testIdTrigger]
 */
export function TableColumnFilter({
  value,
  options,
  onChange,
  allLabel = "Todas",
  ariaLabelTrigger,
  disabled = false,
  testIdTrigger,
}) {
  const menuId = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, minWidth: 160 });

  const fullOptions = [{ value: "", label: allLabel }, ...(Array.isArray(options) ? options : [])];
  const isActive = String(value || "") !== "";

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 160);
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      minWidth,
    });
  }, []);

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((o) => {
      const next = !o;
      if (next) {
        requestAnimationFrame(() => updatePosition());
      }
      return next;
    });
  }, [disabled, updatePosition]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      const t = e.target;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      <span ref={triggerRef} style={{ display: "inline-flex", verticalAlign: "middle" }}>
        <TableColumnFilterTrigger
          isActive={isActive}
          open={open}
          onToggle={toggle}
          disabled={disabled}
          ariaLabel={ariaLabelTrigger}
          ariaControlsId={menuId}
          testId={testIdTrigger}
        />
      </span>
      <TableColumnFilterMenu
        open={open}
        position={position}
        options={fullOptions}
        value={value ?? ""}
        onSelect={(v) => onChange(v)}
        onClose={close}
        menuId={menuId}
        menuRef={menuRef}
      />
    </>
  );
}
