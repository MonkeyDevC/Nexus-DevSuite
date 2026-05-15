/**
 * Barra de formato solo iconos; modo embebido = mini navbar dentro del panel del editor.
 */
import {
  Bold,
  Braces,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
} from "lucide-react";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import styles from "./EvidenceEditorFormatToolbar.module.css";

const ACTION_GROUPS = [
  [
    { id: "bold", label: "Negrita", hint: "Marcar texto en negrita", Icon: Bold },
    { id: "italic", label: "Cursiva", hint: "Marcar texto en cursiva", Icon: Italic },
    { id: "h1", label: "Título 1", hint: "Encabezado nivel 1 (#)", Icon: Heading1 },
    { id: "h2", label: "Título 2", hint: "Encabezado nivel 2 (##)", Icon: Heading2 },
  ],
  [
    { id: "bullet_list", label: "Lista", hint: "Lista con viñetas", Icon: List },
    { id: "ordered_list", label: "Lista numerada", hint: "Lista ordenada", Icon: ListOrdered },
    { id: "checklist", label: "Checklist", hint: "Lista de tareas", Icon: ListChecks },
  ],
  [
    { id: "quote", label: "Cita", hint: "Bloque de cita", Icon: Quote },
    { id: "code_block", label: "Código", hint: "Bloque de código", Icon: Braces },
    { id: "link", label: "Enlace", hint: "Insertar enlace", Icon: Link2 },
    { id: "image", label: "Imagen", hint: "Placeholder de imagen / URL", Icon: ImageIcon },
  ],
  [{ id: "divider", label: "Separador", hint: "Línea horizontal (---)", Icon: Minus }],
];

const ICON_SIZE_DEFAULT = 16;
const ICON_SIZE_EMBEDDED = 14;

export default function EvidenceEditorFormatToolbar({ formatDisabled, onAction, embedded = false }) {
  const fire = (type) => {
    if (formatDisabled) return;
    onAction(type);
  };

  const iconSize = embedded ? ICON_SIZE_EMBEDDED : ICON_SIZE_DEFAULT;

  return (
    <div
      className={styles.formatToolbar}
      data-embedded={embedded ? "true" : undefined}
      role="toolbar"
      aria-label="Formato de markdown"
      aria-disabled={formatDisabled ? "true" : undefined}
      data-testid="evidence-editor-format-toolbar"
    >
      {ACTION_GROUPS.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className={groupIndex === 0 ? styles.toolGroupFirst : styles.toolGroup}
        >
          {group.map((action) => {
            const { id, label, hint } = action;
            const ActionIcon = action.Icon;
            const title = `${label} — ${hint}`;
            return (
              <Button
                key={id}
                type="button"
                variant={embedded ? "ghost" : "outline"}
                disabled={formatDisabled}
                className={embedded ? styles.iconBtnEmbedded : styles.iconBtn}
                title={title}
                aria-label={title}
                onClick={() => fire(id)}
              >
                <ActionIcon size={iconSize} strokeWidth={2} aria-hidden />
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
