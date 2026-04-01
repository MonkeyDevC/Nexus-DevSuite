import { Card } from "../../design-system/components/Card/Card.jsx";
import { Input } from "../../design-system/components/Input/Input.jsx";
import { Select } from "../../design-system/components/Select/Select.jsx";
import { Textarea } from "../../design-system/components/Textarea/Textarea.jsx";
import CriteriaSection from "./CriteriaSection.jsx";
import projectEditStyles from "./ProjectEditTab.module.css";

function formatDateOnly(value) {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function featureCodeDisplay(feature) {
  if (!feature) return "—";
  const n = feature.number != null ? Number(feature.number) : null;
  if (n != null && Number.isFinite(n)) return `F${n}`;
  const id = feature.id != null ? String(feature.id) : "";
  return id ? id.slice(0, 8) : "—";
}

export default function FeatureEditTab({
  feature,
  title,
  description,
  acceptanceCriteria,
  implementationCriteria,
  priority,
  status,
  onTitleChange,
  onDescriptionChange,
  onAcceptanceCriteriaChange,
  onImplementationCriteriaChange,
  onPriorityChange,
  onStatusChange,
  disabled,
}) {
  return (
    <div className={projectEditStyles.root} data-testid="feature-overlay-tab-edicion">
      <Card padding="default" className={projectEditStyles.block}>
        <div className={projectEditStyles.blockTitle}>Feature</div>
        <div className={projectEditStyles.editGrid}>
          <div className={projectEditStyles.editColMain}>
            <Input
              label="Título"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={disabled}
              maxLength={500}
            />
            <Textarea
              label="Descripción"
              rows={8}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className={projectEditStyles.editColControls}>
            <Select
              label="Prioridad"
              value={priority || ""}
              onChange={(e) => onPriorityChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">—</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
            <Select
              label="Estado"
              value={status || ""}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">—</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </Select>
            <p className={projectEditStyles.fieldHint}>
              El workflow valida transiciones permitidas (p. ej. DRAFT → APPROVED).
            </p>
          </div>

          <aside className={projectEditStyles.editColMeta}>
            <div className={projectEditStyles.metaCapsTitle}>Referencia</div>
            <div className={projectEditStyles.metaStack}>
              <div>
                <span className={projectEditStyles.roLabel}>Código</span>
                <div className={projectEditStyles.roValue}>{featureCodeDisplay(feature)}</div>
              </div>
              <div>
                <span className={projectEditStyles.roLabel}>Estado</span>
                <div className={projectEditStyles.roValue}>{feature?.status ? String(feature.status) : "—"}</div>
              </div>
              <div>
                <span className={projectEditStyles.roLabel}>Creado</span>
                <div className={projectEditStyles.roValueMuted}>{formatDateOnly(feature?.created_at)}</div>
              </div>
              <div>
                <span className={projectEditStyles.roLabel}>Actualizado</span>
                <div className={projectEditStyles.roValueMuted}>{formatDateOnly(feature?.updated_at)}</div>
              </div>
            </div>
          </aside>
        </div>
      </Card>

      <Card padding="default" className={projectEditStyles.block}>
        <div className={projectEditStyles.blockTitle}>Criterios</div>
        <div className={projectEditStyles.criteriaPairGrid}>
          <CriteriaSection
            title="Criterios de aceptación"
            items={acceptanceCriteria}
            onChange={onAcceptanceCriteriaChange}
            disabled={disabled}
          />
          <CriteriaSection
            title="Criterios de implementación"
            items={implementationCriteria}
            onChange={onImplementationCriteriaChange}
            addButtonLabel="Añadir criterio de implementación"
            disabled={disabled}
          />
        </div>
      </Card>
    </div>
  );
}
