import { useRef, useState } from "react";
import { Card } from "../../../../design-system/components/Card/Card.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import { Select } from "../../../../design-system/components/Select/Select.jsx";
import { Textarea } from "../../../../design-system/components/Textarea/Textarea.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import CriteriaSection from "./CriteriaSection.jsx";
import projectEditStyles from "./ProjectEditTab.module.css";
import { buildExportFilename } from "../../../../utils/exportFilename.js";
import { featureCodeDisplay } from "./FeatureWorkspaceContent.jsx";

const FEATURE_EXPORT_STATUSES = new Set(["DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"]);
const FEATURE_EXPORT_PRIORITIES = new Set(["", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);

function summarizeFeatureStoriesSprints(stories) {
  const list = Array.isArray(stories) ? stories : [];
  let withSprint = 0;
  let without = 0;
  const labelsById = new Map();
  for (const s of list) {
    const sid = s?.sprint_id != null && String(s.sprint_id).trim() !== "" ? String(s.sprint_id).trim() : "";
    if (!sid) {
      without += 1;
      continue;
    }
    withSprint += 1;
    const label =
      s?.sprint_name != null && String(s.sprint_name).trim() !== ""
        ? String(s.sprint_name).trim()
        : `Sprint (${sid.slice(0, 8)}…)`;
    if (!labelsById.has(sid)) labelsById.set(sid, label);
  }
  return { withSprint, without, total: list.length, sprintNames: [...labelsById.values()] };
}

function formatDateOnly(value) {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

export default function FeatureEditTab({
  feature,
  /** Historias cargadas en el workspace; el sprint se asigna por historia (no existe sprint en la entidad feature). */
  stories = [],
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
  /** Solo en rutas que lo soliciten (p. ej. detalle desde listado Features). */
  onRequestDeleteFeature,
  deleteFeatureDisabled = false,
}) {
  const importInputRef = useRef(null);
  const [importErrorOpen, setImportErrorOpen] = useState(false);

  if (!feature) return null;

  const sprintSummary = summarizeFeatureStoriesSprints(stories);
  const sprintSummaryBody =
    sprintSummary.total === 0
      ? "Aún no hay historias en el backlog de esta feature. Crea historias en la pestaña Backlog."
      : sprintSummary.withSprint === 0
        ? `Las ${sprintSummary.total} historias están sin sprint. Abre cada historia en edición para asignarla (refinement READY).`
        : sprintSummary.sprintNames.length === 1
          ? `${sprintSummary.withSprint} historia(s) en «${sprintSummary.sprintNames[0]}»${
              sprintSummary.without > 0 ? `; ${sprintSummary.without} sin sprint.` : "."
            }`
          : `${sprintSummary.withSprint} historia(s) repartidas en ${sprintSummary.sprintNames.length} sprints (${sprintSummary.sprintNames.join(
              ", "
            )}).${sprintSummary.without > 0 ? ` ${sprintSummary.without} sin sprint.` : ""}`;

  function handleExportFeatureSlice() {
    const payload = {
      kind: "nexus-devsuite-feature-export",
      schema_version: 1,
      id: feature.id,
      project_id: feature.project_id != null ? String(feature.project_id) : null,
      number: feature.number != null ? feature.number : null,
      title,
      description,
      priority: priority || null,
      status: status || null,
      acceptance_criteria: Array.isArray(acceptanceCriteria) ? acceptanceCriteria : [],
      implementation_criteria: Array.isArray(implementationCriteria) ? implementationCriteria : [],
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const nameForFile = title?.trim() || `feature-${feature.id?.slice(0, 8) || "export"}`;
    a.download = buildExportFilename(nameForFile);
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const nextTitle = typeof parsed.title === "string" ? parsed.title : title;
        const nextDescription = typeof parsed.description === "string" ? parsed.description : description;
        const nextAcc = Array.isArray(parsed.acceptance_criteria)
          ? parsed.acceptance_criteria.map((x) => String(x ?? ""))
          : acceptanceCriteria;
        const nextImpl = Array.isArray(parsed.implementation_criteria)
          ? parsed.implementation_criteria.map((x) => String(x ?? ""))
          : implementationCriteria;

        onTitleChange(nextTitle);
        onDescriptionChange(nextDescription);
        onAcceptanceCriteriaChange(nextAcc);
        onImplementationCriteriaChange(nextImpl);

        const st = parsed.status != null ? String(parsed.status).toUpperCase() : "";
        if (FEATURE_EXPORT_STATUSES.has(st)) {
          onStatusChange(st);
        }

        const pr = parsed.priority != null ? String(parsed.priority).toUpperCase() : "";
        if (FEATURE_EXPORT_PRIORITIES.has(pr)) {
          onPriorityChange(pr);
        }
      } catch {
        setImportErrorOpen(true);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className={projectEditStyles.root} data-testid="feature-overlay-tab-edicion">
      <AlertDialog
        isOpen={importErrorOpen}
        tone="error"
        title="Importación fallida"
        description="El archivo no es un JSON válido o no contiene datos de feature reconocibles."
        confirmLabel="Entendido"
        cancelLabel=""
        onCancel={() => setImportErrorOpen(false)}
        onConfirm={() => setImportErrorOpen(false)}
      />
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className={projectEditStyles.hiddenFile}
        aria-hidden
        tabIndex={-1}
        onChange={handleImportFile}
      />

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

      <Card padding="default" className={projectEditStyles.block} data-testid="feature-edit-sprint-summary-card">
        <div className={projectEditStyles.blockTitle}>Sprint (por historia)</div>
        <p className={projectEditStyles.fieldHint} style={{ marginTop: 0 }}>
          La feature no tiene un sprint propio en el sistema: cada historia puede asignarse a un sprint del proyecto desde
          su tarjeta (edición) o desde el backlog.
        </p>
        <p className={projectEditStyles.roValue}>{sprintSummaryBody}</p>
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
        <div className={projectEditStyles.criteriaFooterBar}>
          <div className={projectEditStyles.criteriaFooterLeft}>
            {typeof onRequestDeleteFeature === "function" ? (
              <Button
                type="button"
                variant="danger"
                onClick={onRequestDeleteFeature}
                disabled={disabled || deleteFeatureDisabled}
                data-testid="feature-edit-delete"
              >
                Eliminar feature
              </Button>
            ) : null}
          </div>
          <div className={projectEditStyles.criteriaFooterCenter}>
            <p className={projectEditStyles.hint}>
              Importar solo actualiza el borrador en pantalla; usa «Guardar» para persistir en el servidor.
            </p>
          </div>
          <div className={projectEditStyles.criteriaFooterRight}>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportFeatureSlice}
              disabled={disabled}
              data-testid="feature-edit-export-json"
            >
              Exportar (JSON)
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleImportClick}
              disabled={disabled}
              data-testid="feature-edit-import-json"
            >
              Importar (JSON)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
