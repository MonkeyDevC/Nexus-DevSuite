/**
 * Sección master-detail: lista + editor dedicado. Estado UI local; commits explícitos vía onChange.
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../design-system/components/Button/Button.jsx";
import AlertDialog from "../../design-system/components/AlertDialog/AlertDialog.jsx";
import CriteriaEditor from "./CriteriaEditor.jsx";
import CriteriaList from "./CriteriaList.jsx";
import styles from "./CriteriaSection.module.css";

const UNSAVED_CONFIRM =
  "Hay cambios sin guardar en este criterio.\nSi continúas, se perderán. ¿Deseas continuar?";

const EMPTY_EDITOR_LINES = ["Selecciona un criterio para editarlo", "o añade uno nuevo para comenzar"];

function normalizeItems(items) {
  return Array.isArray(items) ? items.map((x) => String(x ?? "")) : [];
}

export default function CriteriaSection({
  title,
  items,
  onChange,
  disabled = false,
  addButtonLabel = "Añadir criterio",
}) {
  const safeItems = useMemo(() => normalizeItems(items), [items]);
  const itemsKey = useMemo(() => JSON.stringify(safeItems), [safeItems]);

  const [selectedIndex, setSelectedIndex] = useState(() => (safeItems.length > 0 ? 0 : null));
  const [editingValue, setEditingValue] = useState(() =>
    safeItems.length > 0 ? String(safeItems[0] ?? "") : "",
  );

  const hasUnsavedChanges =
    selectedIndex !== null &&
    safeItems.length > 0 &&
    selectedIndex >= 0 &&
    selectedIndex < safeItems.length &&
    editingValue !== safeItems[selectedIndex];

  const pendingActionRef = useRef(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const runAfterDiscardOk = useCallback(
    (action) => {
      if (!hasUnsavedChanges) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setDiscardDialogOpen(true);
    },
    [hasUnsavedChanges],
  );

  // Solo cuando cambia el contenido serializado (import / patch del padre). Depender solo de `itemsKey`
  // evita re-ejecutar en cada referencia nueva del array con el mismo contenido.
  useLayoutEffect(() => {
    /* Reconciliar estado UI local cuando el padre reemplaza `items` (misma clave que itemsKey). */
    /* eslint-disable react-hooks/set-state-in-effect -- sync debido a cambio externo del borrador, no hay API externa */
    let parsed;
    try {
      parsed = JSON.parse(itemsKey);
    } catch {
      parsed = [];
    }
    const normalized = Array.isArray(parsed) ? parsed.map((x) => String(x ?? "")) : [];
    if (normalized.length === 0) {
      setSelectedIndex(null);
      setEditingValue("");
      return;
    }
    setSelectedIndex((prev) => {
      const idx =
        prev === null || prev < 0 ? 0 : prev >= normalized.length ? normalized.length - 1 : prev;
      setEditingValue(String(normalized[idx] ?? ""));
      return idx;
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [itemsKey]);

  const handleSelect = useCallback(
    (newIndex) => {
      if (disabled) return;
      if (newIndex === selectedIndex) return;
      if (newIndex < 0 || newIndex >= safeItems.length) return;
      runAfterDiscardOk(() => {
        setSelectedIndex(newIndex);
        setEditingValue(String(safeItems[newIndex] ?? ""));
      });
    },
    [disabled, selectedIndex, safeItems, runAfterDiscardOk],
  );

  const handleAdd = useCallback(() => {
    if (disabled) return;
    runAfterDiscardOk(() => {
      const next = [...safeItems, ""];
      onChange(next);
      setSelectedIndex(next.length - 1);
      setEditingValue("");
    });
  }, [disabled, safeItems, onChange, runAfterDiscardOk]);

  const handleSave = useCallback(() => {
    if (disabled || selectedIndex === null) return;
    if (selectedIndex < 0 || selectedIndex >= safeItems.length) return;
    const next = [...safeItems];
    next[selectedIndex] = editingValue;
    onChange(next);
  }, [disabled, selectedIndex, safeItems, editingValue, onChange]);

  const handleCancel = useCallback(() => {
    if (disabled || selectedIndex === null) return;
    if (selectedIndex < 0 || selectedIndex >= safeItems.length) return;
    setEditingValue(String(safeItems[selectedIndex] ?? ""));
  }, [disabled, selectedIndex, safeItems]);

  const handleRemove = useCallback(
    (removeIdx) => {
      if (disabled) return;
      if (removeIdx < 0 || removeIdx >= safeItems.length) return;
      const next = safeItems.filter((_, j) => j !== removeIdx);
      if (next.length === 0) {
        onChange(next);
        setSelectedIndex(null);
        setEditingValue("");
        return;
      }
      let nextSel = selectedIndex;
      if (nextSel === null || nextSel < 0) nextSel = 0;
      else if (removeIdx < nextSel) nextSel -= 1;
      else if (removeIdx === nextSel) nextSel = Math.min(nextSel, next.length - 1);
      onChange(next);
      setSelectedIndex(nextSel);
      setEditingValue(String(next[nextSel] ?? ""));
    },
    [disabled, safeItems, selectedIndex, onChange],
  );

  const showEditor = selectedIndex !== null && safeItems.length > 0;

  const count = safeItems.length;

  const handleReorder = useCallback(
    (fromIndex, toIndex) => {
      if (disabled) return;
      if (fromIndex === toIndex) return;
      if (fromIndex < 0 || fromIndex >= safeItems.length) return;
      if (toIndex < 0 || toIndex >= safeItems.length) return;

      runAfterDiscardOk(() => {
        const next = [...safeItems];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        onChange(next);

        // Mantener el item seleccionado cuando cambia de posición.
        setSelectedIndex((prev) => {
          if (prev === null) return null;
          if (prev === fromIndex) return toIndex;
          if (fromIndex < prev && prev <= toIndex) return prev - 1;
          if (toIndex <= prev && prev < fromIndex) return prev + 1;
          return prev;
        });
      });
    },
    [disabled, safeItems, onChange, runAfterDiscardOk],
  );

  return (
    <div className={styles.sectionCard} data-testid="criteria-section">
      <AlertDialog
        isOpen={discardDialogOpen}
        tone="question"
        title="Descartar cambios sin guardar"
        description={UNSAVED_CONFIRM}
        confirmLabel="Descartar y continuar"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onCancel={() => {
          pendingActionRef.current = null;
          setDiscardDialogOpen(false);
        }}
        onConfirm={() => {
          const action = pendingActionRef.current;
          pendingActionRef.current = null;
          setDiscardDialogOpen(false);
          if (typeof action === "function") action();
        }}
      />
      <header className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <p className={styles.sectionTitle}>{title}</p>
          <span className={styles.countBadge} aria-label={`${count} criterios`}>
            {count}
          </span>
        </div>
        <div className={styles.headerRight}>
          <Button type="button" variant="outline" onClick={handleAdd} disabled={disabled} className={styles.addBtnHeader}>
            + {addButtonLabel}
          </Button>
        </div>
      </header>

      <div className={styles.headerRule} aria-hidden />

      <div className={styles.grid}>
        <div className={styles.listColumn}>
          {safeItems.length === 0 ? (
            <p className={styles.listEmpty}>Sin criterios.</p>
          ) : null}
          <CriteriaList
            items={safeItems}
            selectedIndex={selectedIndex}
            editingValue={editingValue}
            disabled={disabled}
            onSelect={handleSelect}
            onRemove={handleRemove}
            onReorder={handleReorder}
            groupLabel={title}
          />
        </div>

        <div className={styles.detailColumn}>
          <div className={styles.detail}>
          {showEditor ? (
            <CriteriaEditor
              value={editingValue}
              disabled={disabled}
              hasUnsavedChanges={hasUnsavedChanges}
              onValueChange={setEditingValue}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <div className={styles.editorEmpty} data-testid="criteria-editor-empty">
              {EMPTY_EDITOR_LINES.map((line) => (
                <p key={line} className={styles.editorEmptyLine}>
                  {line}
                </p>
              ))}
              {safeItems.length === 0 ? (
                <Button type="button" variant="secondary" onClick={handleAdd} disabled={disabled}>
                  {addButtonLabel}
                </Button>
              ) : null}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
