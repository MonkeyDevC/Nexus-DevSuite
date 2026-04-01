/**
 * Fila compacta de la lista master: selección, edición visual e eliminación.
 */
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../design-system/components/Button/Button.jsx";
import styles from "./CriteriaListItem.module.css";

export default function CriteriaListItem({
  text,
  index,
  isSelected,
  isDragOver = false,
  hasLocalEdits,
  disabled,
  onSelect,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  ariaGroupLabel,
}) {
  const line = text === "" ? "(vacío)" : text;

  return (
    <li className={styles.row} role="presentation">
      <div
        className={[
          styles.itemCard,
          isSelected ? styles.itemCardSelected : "",
          isDragOver ? styles.itemCardDragOver : "",
        ]
          .filter(Boolean)
          .join(" ")}
        draggable={!disabled}
        onDragStart={(e) => onDragStart?.(index, e)}
        onDragEnter={() => onDragEnter?.(index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop?.(index, e)}
        onDragEnd={onDragEnd}
        aria-grabbed={undefined}
      >
        <span className={styles.dragGrip} aria-hidden title="Arrastrar para reordenar">
          <GripVertical size={14} strokeWidth={2} />
        </span>
        <button
          type="button"
          role="option"
          className={styles.main}
          onClick={() => onSelect(index)}
          disabled={disabled}
          aria-label={`${ariaGroupLabel} ${index + 1}: ${line.slice(0, 80)}`}
          aria-selected={isSelected}
          data-testid={`criteria-list-item-${index}`}
        >
          <span className={styles.indexPrefix} aria-hidden>
            #{index + 1}
          </span>
          <span className={styles.textClamp} title={text}>
            {line}
          </span>
          {hasLocalEdits ? <span className={styles.dot} title="Cambios sin guardar" aria-hidden /> : null}
        </button>
        <div className={styles.iconActions}>
          <Button
            type="button"
            variant="ghost"
            className={styles.iconBtn}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(index);
            }}
            title="Editar"
            aria-label={`Editar criterio ${index + 1}`}
          >
            <Pencil size={16} strokeWidth={2} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="danger"
            className={styles.iconBtn}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            title="Eliminar"
            aria-label={`Eliminar criterio ${index + 1}`}
          >
            <Trash2 size={16} strokeWidth={2} aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}
