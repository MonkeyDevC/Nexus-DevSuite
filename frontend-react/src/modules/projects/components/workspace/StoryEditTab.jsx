import { useMemo, useRef, useState } from "react";
import { Card } from "../../../../design-system/components/Card/Card.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import { Select } from "../../../../design-system/components/Select/Select.jsx";
import { Textarea } from "../../../../design-system/components/Textarea/Textarea.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import CriteriaSection from "./CriteriaSection.jsx";
import projectEditStyles from "./ProjectEditTab.module.css";
import { featureCodeDisplay } from "./FeatureWorkspaceContent.jsx";
import { buildExportFilename } from "../../../../utils/exportFilename.js";
import { formatStoryHumanId } from "../../../../shared/workspace/workItemHumanIds.js";

/** Estados permitidos al importar (alineados al Select de esta pestaña). */
const STORY_EXPORT_STATUSES = new Set([
  "DRAFT",
  "READY",
  "IN_PROGRESS",
  "BLOCKED",
  "IN_REVIEW",
  "DONE",
  "ARCHIVED",
]);
const STORY_EXPORT_PRIORITIES = new Set(["", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);

function storyCodeDisplay(story) {
  if (!story) return "—";
  const code = formatStoryHumanId(story.number != null ? Number(story.number) : null);
  if (code) return code;
  const id = story.id != null ? String(story.id) : "";
  return id ? `US-${id.slice(0, 8)}` : "—";
}

function formatDateOnly(value) {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function userDisplayName(u) {
  if (!u) return "";
  const fn = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (fn) return fn;
  if (u.email) return String(u.email);
  if (u.username) return String(u.username);
  return u.id ? String(u.id).slice(0, 8) : "";
}

export default function StoryEditTab({
  story,
  parentFeature,
  title,
  description,
  acceptanceCriteria,
  implementationCriteria,
  priority,
  status,
  /** Refinamiento (IDEA → … → READY); el backend exige READY para asignar sprint. */
  refinementStatus = "DRAFT",
  onRefinementChange,
  assignedTo,
  storyPoints,
  /** UUID del sprint elegido en el borrador; cadena vacía = sin sprint. */
  sprintId = "",
  /** Lista de sprints del proyecto: { id, name, status }. */
  sprintOptions = [],
  sprintsLoading = false,
  sprintsLoadError = "",
  onSprintChange,
  assignmentUsers = [],
  onTitleChange,
  onDescriptionChange,
  onAcceptanceCriteriaChange,
  onImplementationCriteriaChange,
  onPriorityChange,
  onStatusChange,
  onAssignedToChange,
  onStoryPointsChange,
  disabled,
}) {
  const importInputRef = useRef(null);
  const [importErrorOpen, setImportErrorOpen] = useState(false);

  const sortedAssignmentUsers = useMemo(() => {
    const list = Array.isArray(assignmentUsers) ? [...assignmentUsers] : [];
    list.sort((a, b) => userDisplayName(a).localeCompare(userDisplayName(b), "es", { sensitivity: "base" }));
    return list;
  }, [assignmentUsers]);

  const assignedId = assignedTo != null ? String(assignedTo).trim() : "";
  const assigneeInDirectory = useMemo(
    () =>
      assignedId
        ? sortedAssignmentUsers.some((u) => u.id != null && String(u.id) === assignedId)
        : false,
    [sortedAssignmentUsers, assignedId]
  );

  const lockedSprintId =
    story?.sprint_id != null && String(story.sprint_id).trim() !== ""
      ? String(story.sprint_id).trim()
      : "";

  const refinementNorm = String(refinementStatus || "DRAFT").trim().toUpperCase() || "DRAFT";
  const canPickSprintFromRefinement = refinementNorm === "READY";

  const sprintSelectOptions = useMemo(() => {
    const raw = Array.isArray(sprintOptions) ? sprintOptions : [];
    /** Solo PLANNED para nuevas asignaciones (no iniciados / no en curso ni cerrados). */
    const plannedOnly = raw.filter((s) => s && String(s.status || "").toUpperCase() === "PLANNED");
    if (lockedSprintId) {
      const current = raw.find((s) => s && s.id === lockedSprintId);
      if (current) return [current];
      const nm = story.sprint_name?.trim();
      return [{ id: lockedSprintId, name: nm || `Sprint (${lockedSprintId.slice(0, 8)}…)`, status: "" }];
    }
    return plannedOnly;
  }, [sprintOptions, lockedSprintId, story.sprint_name]);

  const fallbackAssigneeLabel = useMemo(() => {
    if (!assignedId || assigneeInDirectory) return "";
    const a = story.assignee && String(story.assignee.id) === assignedId ? story.assignee : null;
    if (a) {
      const nm = a.name?.trim();
      const em = a.email?.trim();
      if (nm && em) return `${nm} (${em})`;
      if (nm) return nm;
      if (em) return em;
    }
    return `Usuario (${assignedId.slice(0, 8)}…)`;
  }, [assignedId, assigneeInDirectory, story.assignee]);

  if (!story) return null;

  function handleExportStorySlice() {
    const payload = {
      kind: "nexus-devsuite-story-export",
      schema_version: 1,
      id: story.id,
      feature_id: story.feature_id != null ? String(story.feature_id) : null,
      number: story.number != null ? story.number : null,
      title,
      description,
      priority: priority || null,
      status: status || null,
      acceptance_criteria: Array.isArray(acceptanceCriteria) ? acceptanceCriteria : [],
      implementation_criteria: Array.isArray(implementationCriteria) ? implementationCriteria : [],
      assigned_to: assignedTo && String(assignedTo).trim() !== "" ? String(assignedTo).trim() : null,
      story_points:
        storyPoints != null && String(storyPoints).trim() !== "" && !Number.isNaN(Number(storyPoints))
          ? Number(storyPoints)
          : null,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const nameForFile = title?.trim() || `story-${story.id?.slice(0, 8) || "export"}`;
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
        if (STORY_EXPORT_STATUSES.has(st)) {
          onStatusChange(st);
        }

        const pr = parsed.priority != null ? String(parsed.priority).toUpperCase() : "";
        if (STORY_EXPORT_PRIORITIES.has(pr)) {
          onPriorityChange(pr);
        }

        if (parsed.assigned_to === null || parsed.assigned_to === "") {
          onAssignedToChange("");
        } else if (typeof parsed.assigned_to === "string" && parsed.assigned_to.trim() !== "") {
          onAssignedToChange(parsed.assigned_to.trim());
        }

        if (parsed.story_points === null || parsed.story_points === "") {
          onStoryPointsChange("");
        } else if (parsed.story_points != null && !Number.isNaN(Number(parsed.story_points))) {
          onStoryPointsChange(String(Number(parsed.story_points)));
        }
      } catch {
        setImportErrorOpen(true);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className={projectEditStyles.root} data-testid="story-overlay-tab-edicion">
      <AlertDialog
        isOpen={importErrorOpen}
        tone="error"
        title="Importación fallida"
        description="El archivo no es un JSON válido o no contiene datos de historia reconocibles."
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
        <div className={projectEditStyles.blockTitle}>Historia</div>
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
              <option value="READY">READY</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="DONE">DONE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </Select>
            <Select
              label="Refinamiento (pre-sprint)"
              value={refinementNorm}
              onChange={(e) => (onRefinementChange ? onRefinementChange(e.target.value) : undefined)}
              disabled={disabled || typeof onRefinementChange !== "function"}
              data-testid="story-edit-refinement"
            >
              <option value="IDEA">IDEA</option>
              <option value="DRAFT">DRAFT</option>
              <option value="REFINED">REFINED</option>
              <option value="READY">READY</option>
            </Select>
            <Select
              label="Persona asignada"
              value={assignedTo || ""}
              onChange={(e) => onAssignedToChange(e.target.value)}
              disabled={disabled}
              data-testid="story-edit-assignee"
            >
              <option value="">Sin asignar</option>
              {assignedId && !assigneeInDirectory && fallbackAssigneeLabel ? (
                <option value={assignedId}>{fallbackAssigneeLabel}</option>
              ) : null}
              {sortedAssignmentUsers.map((u) => {
                const uid = u.id != null ? String(u.id) : "";
                if (!uid) return null;
                return (
                  <option key={uid} value={uid}>
                    {userDisplayName(u)}
                  </option>
                );
              })}
            </Select>
            <Input
              label="Puntos estimados (story points)"
              type="number"
              min={0}
              step={1}
              value={storyPoints ?? ""}
              onChange={(e) => onStoryPointsChange(e.target.value)}
              disabled={disabled}
              placeholder="—"
              data-testid="story-edit-story-points"
            />
            <Select
              label="Sprint"
              value={sprintId || ""}
              onChange={(e) => (onSprintChange ? onSprintChange(e.target.value) : undefined)}
              disabled={
                disabled ||
                sprintsLoading ||
                typeof onSprintChange !== "function" ||
                (!lockedSprintId && !canPickSprintFromRefinement)
              }
              data-testid="story-edit-sprint"
            >
              <option value="">{lockedSprintId ? "Quitar del sprint (desasignar)" : "Sin sprint asignado"}</option>
              {sprintSelectOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.status ? ` (${s.status})` : ""}
                </option>
              ))}
            </Select>
            {sprintsLoadError ? (
              <p className={projectEditStyles.fieldHint} role="alert">
                {sprintsLoadError}
              </p>
            ) : null}
            {sprintsLoading ? <p className={projectEditStyles.fieldHint}>Cargando sprints del proyecto…</p> : null}
            {!lockedSprintId && !canPickSprintFromRefinement ? (
              <p className={projectEditStyles.fieldHint} role="status">
                Sube el refinamiento a <strong>READY</strong> (selector anterior) para poder elegir sprint. El servidor
                rechaza la asignación si el refinamiento no está listo.
              </p>
            ) : null}
            <p className={projectEditStyles.fieldHint}>
              Solo puedes asignar a sprints en estado <strong>PLANNED</strong> (aún no iniciados). Si la historia ya
              tiene sprint, verás el actual aunque esté en curso o cerrado para poder desasignarla.
            </p>
            <p className={projectEditStyles.fieldHint}>
              Para cambiar de sprint, primero quita la asignación actual y guarda.
            </p>
            <p className={projectEditStyles.fieldHint}>
              El workflow valida transiciones permitidas según rol y estado de la historia.
            </p>
          </div>

          <aside className={projectEditStyles.editColMeta}>
            <div className={projectEditStyles.metaCapsTitle}>Referencia</div>
            <div className={projectEditStyles.metaStack}>
              <div>
                <span className={projectEditStyles.roLabel}>Código</span>
                <div className={projectEditStyles.roValue}>{storyCodeDisplay(story)}</div>
              </div>
              <div>
                <span className={projectEditStyles.roLabel}>Feature</span>
                <div className={projectEditStyles.roValue}>
                  {parentFeature ? featureCodeDisplay(parentFeature) : "—"}
                </div>
              </div>
              <div>
                <span className={projectEditStyles.roLabel}>Creado</span>
                <div className={projectEditStyles.roValueMuted}>{formatDateOnly(story?.created_at)}</div>
              </div>
              <div>
                <span className={projectEditStyles.roLabel}>Actualizado</span>
                <div className={projectEditStyles.roValueMuted}>{formatDateOnly(story?.updated_at)}</div>
              </div>
              <div>
                <span className={projectEditStyles.roLabel}>Refinamiento (guardado)</span>
                <div className={projectEditStyles.roValueMuted}>
                  {story?.refinement_status != null ? String(story.refinement_status) : "—"}
                </div>
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
        <div className={projectEditStyles.secondaryActions}>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportStorySlice}
            disabled={disabled}
            data-testid="story-edit-export-json"
          >
            Exportar (JSON)
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleImportClick}
            disabled={disabled}
            data-testid="story-edit-import-json"
          >
            Importar (JSON)
          </Button>
        </div>
      </Card>

      <p className={projectEditStyles.hint}>
        Importar solo actualiza el borrador en pantalla; usa «Guardar» para persistir en el servidor.
      </p>
    </div>
  );
}
