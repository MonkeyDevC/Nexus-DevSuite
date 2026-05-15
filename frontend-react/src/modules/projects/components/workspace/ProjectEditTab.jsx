/**
 * Pestaña Edición: muta `draftData` vía onDraftPatch. Sin submit propio (Guardar en footer).
 * Sprint activo: cambio inmediato vía API + recarga de proyecto (onProjectReload).
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Card } from "../../../../design-system/components/Card/Card.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import { Textarea } from "../../../../design-system/components/Textarea/Textarea.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { Select } from "../../../../design-system/components/Select/Select.jsx";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import CriteriaSection from "./CriteriaSection.jsx";
import { listAllSprintsForProject, startSprint } from "../../../../modules/sprints/sprintsService.js";
import styles from "./ProjectEditTab.module.css";
import { buildExportFilename } from "../../../../utils/exportFilename.js";

function formatDateOnly(value) {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function sprintStatusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PLANNED") return "Planificado";
  if (s === "IN_PROGRESS") return "En curso";
  if (s === "CLOSED") return "Cerrado";
  return s || "—";
}

export default function ProjectEditTab({
  draftSlice,
  projectReadonlyMeta,
  onDraftPatch,
  disabled = false,
  projectCodeDisplay,
  onProjectReload,
}) {
  const importInputRef = useRef(null);
  const [importErrorOpen, setImportErrorOpen] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [sprintBusy, setSprintBusy] = useState(false);
  const [sprintMessage, setSprintMessage] = useState({ tone: "help", text: "" });
  const [localSprintId, setLocalSprintId] = useState("");

  useEffect(() => {
    if (!projectReadonlyMeta?.id) return undefined;
    let cancelled = false;
    async function load() {
      setSprintsLoading(true);
      setSprintMessage({ tone: "help", text: "" });
      try {
        const items = await listAllSprintsForProject(projectReadonlyMeta.id);
        if (!cancelled) setSprints(items);
      } catch {
        if (!cancelled) {
          setSprints([]);
          setSprintMessage({ tone: "error", text: "No se pudieron cargar los sprints." });
        }
      } finally {
        if (!cancelled) setSprintsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectReadonlyMeta?.id]);

  const currentSprintIdFromMeta = projectReadonlyMeta?.current_sprint?.id
    ? String(projectReadonlyMeta.current_sprint.id)
    : "";

  useLayoutEffect(() => {
    setLocalSprintId(currentSprintIdFromMeta);
  }, [currentSprintIdFromMeta]);

  if (!draftSlice || !projectReadonlyMeta) return null;

  const currentSprintId = currentSprintIdFromMeta;
  const orgName =
    projectReadonlyMeta.organization_name && String(projectReadonlyMeta.organization_name).trim()
      ? String(projectReadonlyMeta.organization_name).trim()
      : null;
  function handleExportWorkspaceSlice() {
    const payload = {
      id: projectReadonlyMeta.id,
      name: draftSlice.name,
      description: draftSlice.description,
      status: draftSlice.status,
      acceptance_criteria: draftSlice.acceptance_criteria,
      implementation_criteria: draftSlice.implementation_criteria,
      version: projectReadonlyMeta.version,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildExportFilename(draftSlice.name || projectReadonlyMeta.id);
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
        const patch = {
          name: typeof parsed.name === "string" ? parsed.name : draftSlice.name,
          description: typeof parsed.description === "string" ? parsed.description : draftSlice.description,
          acceptance_criteria: Array.isArray(parsed.acceptance_criteria)
            ? parsed.acceptance_criteria.map((x) => String(x ?? ""))
            : draftSlice.acceptance_criteria,
          implementation_criteria: Array.isArray(parsed.implementation_criteria)
            ? parsed.implementation_criteria.map((x) => String(x ?? ""))
            : draftSlice.implementation_criteria,
        };
        const st = parsed.status != null ? String(parsed.status).toUpperCase() : "";
        if (st === "ACTIVE" || st === "ARCHIVED") {
          patch.status = st;
        }
        onDraftPatch(patch);
      } catch {
        setImportErrorOpen(true);
      }
    };
    reader.readAsText(file);
  }

  async function handleSprintChange(event) {
    const selectedId = String(event.target.value || "");
    if (!selectedId || selectedId === currentSprintId || !onProjectReload) {
      setLocalSprintId(currentSprintId);
      return;
    }

    const chosen = sprints.find((s) => s.id === selectedId);
    if (!chosen || chosen.status === "CLOSED") {
      setLocalSprintId(currentSprintId);
      return;
    }
    if (chosen.status === "IN_PROGRESS") {
      setLocalSprintId(currentSprintId);
      return;
    }
    if (chosen.status !== "PLANNED") {
      setLocalSprintId(currentSprintId);
      return;
    }

    const revertId = currentSprintId;
    setLocalSprintId(selectedId);
    setSprintBusy(true);
    setSprintMessage({ tone: "help", text: "" });
    try {
      await startSprint(chosen.id);
      setSprintMessage({ tone: "help", text: `Sprint «${chosen.name}» iniciado.` });
      await onProjectReload();
    } catch (err) {
      setLocalSprintId(revertId);
      const msg =
        err && typeof err.message === "string" && err.message
          ? err.message
          : "No se pudo iniciar el sprint. Si ya hay uno en curso, ciérrelo antes.";
      setSprintMessage({ tone: "error", text: msg });
    } finally {
      setSprintBusy(false);
    }
  }

  return (
    <div className={styles.root} data-testid="project-edit-form">
      <AlertDialog
        isOpen={importErrorOpen}
        tone="error"
        title="Importación fallida"
        description="El archivo no es un JSON válido."
        confirmLabel="Entendido"
        cancelLabel=""
        onCancel={() => setImportErrorOpen(false)}
        onConfirm={() => setImportErrorOpen(false)}
      />
      <input ref={importInputRef} type="file" accept="application/json,.json" className={styles.hiddenFile} onChange={handleImportFile} />

      <Card padding="default" className={styles.block}>
        <div className={styles.blockTitle}>Proyecto</div>
        <div className={styles.editGrid}>
          <div className={styles.editColMain}>
            <Input
              label="Nombre"
              value={draftSlice.name}
              onChange={(e) => onDraftPatch({ name: e.target.value })}
              disabled={disabled}
              maxLength={255}
              data-testid="project-edit-name"
            />
            <Textarea
              label="Descripción"
              rows={6}
              value={draftSlice.description}
              onChange={(e) => onDraftPatch({ description: e.target.value })}
              disabled={disabled}
              style={{ minHeight: "calc(15rem * 1.02)" }}
              data-testid="project-edit-description"
            />
          </div>

          <div className={styles.editColControls}>
            <Select
              label="Estado"
              value={draftSlice.status}
              onChange={(e) => onDraftPatch({ status: e.target.value })}
              disabled={disabled}
              data-testid="project-edit-status"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </Select>
            <p className={styles.fieldHint}>Archivar equivale a cerrar el proyecto para ediciones posteriores.</p>

            <Select
              label="Sprint en curso"
              value={localSprintId}
              onChange={handleSprintChange}
              disabled={disabled || sprintsLoading || sprintBusy || !onProjectReload}
              message={
                sprintsLoading ? "Cargando sprints…" : sprintMessage.text || undefined
              }
              error={sprintMessage.tone === "error"}
              data-testid="project-edit-sprint"
            >
              <option value="" disabled={Boolean(currentSprintId)}>
                {currentSprintId ? "— Elegir sprint planificado para iniciarlo —" : "— Ninguno en curso —"}
              </option>
              {sprints.map((s) => {
                const disabledOpt =
                  s.status === "CLOSED" ||
                  (s.status === "IN_PROGRESS" && String(s.id) !== currentSprintId);
                const suffix = ` (${sprintStatusLabel(s.status)})`;
                return (
                  <option key={s.id} value={s.id} disabled={disabledOpt}>
                    {s.name}
                    {suffix}
                    {currentSprintId === s.id && s.status === "IN_PROGRESS" ? " ★" : ""}
                  </option>
                );
              })}
            </Select>
            <p className={styles.fieldHint}>
              Elija un sprint planificado para iniciarlo como único sprint activo del proyecto.
            </p>
          </div>

          <aside className={styles.editColMeta}>
            <div className={styles.metaCapsTitle}>Referencia</div>
            <div className={styles.metaStack}>
              <div>
                <span className={styles.roLabel}>Organización</span>
                <div className={styles.roValue} data-testid="project-edit-org-name">
                  {orgName || "—"}
                </div>
              </div>
              <div>
                <span className={styles.roLabel}>Código</span>
                <div className={styles.roValue}>{projectCodeDisplay}</div>
              </div>
              <div>
                <span className={styles.roLabel}>Versión</span>
                <div className={styles.roValue}>v{projectReadonlyMeta.version}</div>
              </div>
              <div>
                <span className={styles.roLabel}>Creado</span>
                <div className={styles.roValueMuted}>{formatDateOnly(projectReadonlyMeta.created_at)}</div>
              </div>
              <div>
                <span className={styles.roLabel}>Actualizado</span>
                <div className={styles.roValueMuted}>{formatDateOnly(projectReadonlyMeta.updated_at)}</div>
              </div>
            </div>
          </aside>
        </div>
      </Card>

      <Card padding="default" className={styles.block}>
        <div className={styles.blockTitle}>Criterios</div>
        <div className={styles.criteriaPairGrid}>
          <CriteriaSection
            title="Criterios de aceptación"
            items={draftSlice.acceptance_criteria}
            onChange={(next) => onDraftPatch({ acceptance_criteria: next })}
            disabled={disabled}
          />
          <CriteriaSection
            title="Criterios de implementación"
            items={draftSlice.implementation_criteria}
            onChange={(next) => onDraftPatch({ implementation_criteria: next })}
            addButtonLabel="Añadir criterio de implementación"
            disabled={disabled}
          />
        </div>
        <div className={styles.secondaryActions}>
          <Button type="button" variant="outline" onClick={handleExportWorkspaceSlice} disabled={disabled}>
            Exportar (JSON)
          </Button>
          <Button type="button" variant="ghost" onClick={handleImportClick} disabled={disabled}>
            Importar (JSON)
          </Button>
        </div>
      </Card>

      <p className={styles.hint}>
        Los cambios de nombre, descripción, estado y criterios se guardan con «Guardar». El sprint se actualiza al elegir
        un planificado. Importar solo actualiza el borrador en memoria.
      </p>
    </div>
  );
}
