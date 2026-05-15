/**
 * Lista master compacta con scroll interno.
 */
import { useCallback, useRef, useState } from "react";
import CriteriaListItem from "./CriteriaListItem.jsx";
import styles from "./CriteriaList.module.css";

export default function CriteriaList({
  items,
  selectedIndex,
  editingValue,
  disabled,
  onSelect,
  onRemove,
  onReorder,
  groupLabel,
}) {
  const dragFromIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = useCallback(
    (index, event) => {
      if (disabled) return;
      dragFromIndexRef.current = index;
      setDragOverIndex(index);

      // Necesario para que DnD HTML5 funcione de forma consistente.
      try {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      } catch {
        // noop (algunos navegadores restringen dataTransfer en ciertos contextos)
      }
    },
    [disabled],
  );

  const handleDragEnter = useCallback((index) => setDragOverIndex(index), []);

  const handleDragOver = useCallback((event) => {
    // Permite el drop.
    event.preventDefault();
    try {
      event.dataTransfer.dropEffect = "move";
    } catch {
      // noop
    }
  }, []);

  const handleDrop = useCallback(
    (toIndex, event) => {
      event.preventDefault();
      const fromIndex = dragFromIndexRef.current;
      dragFromIndexRef.current = null;
      setDragOverIndex(null);
      if (fromIndex == null) return;
      if (typeof onReorder !== "function") return;
      onReorder(Number(fromIndex), Number(toIndex));
    },
    [onReorder],
  );

  const handleDragEnd = useCallback(() => {
    dragFromIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  return (
    <ul className={styles.list} role="listbox" aria-label={groupLabel} data-testid="criteria-list">
      {items.map((text, index) => (
        <CriteriaListItem
          key={`crit-${index}`}
          text={String(text ?? "")}
          index={index}
          isSelected={selectedIndex === index}
          isDragOver={dragOverIndex === index}
          hasLocalEdits={
            selectedIndex === index && editingValue !== String(items[index] ?? "")
          }
          disabled={disabled}
          onSelect={onSelect}
          onRemove={onRemove}
          onDragStart={handleDragStart}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          ariaGroupLabel={groupLabel}
        />
      ))}
    </ul>
  );
}
