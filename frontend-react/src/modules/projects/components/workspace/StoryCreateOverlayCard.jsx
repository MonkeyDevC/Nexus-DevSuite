import { useCallback, useMemo, useState } from "react";
import { DetailWorkspaceShell } from "./DetailWorkspaceShell.jsx";
import WorkspaceHeader from "./WorkspaceHeader.jsx";
import { WorkspaceFooter } from "./WorkspaceFooter.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import { Textarea } from "../../../../design-system/components/Textarea/Textarea.jsx";
import { Select } from "../../../../design-system/components/Select/Select.jsx";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import * as storiesService from "../../../../modules/stories/storiesService.js";
import projectEditStyles from "./ProjectEditTab.module.css";

const MSG_CREATE_FAIL = "No se pudo crear la historia.";

/**
 * Overlay de creación de User Story bajo el stack de feature (depth 2).
 */
export default function StoryCreateOverlayCard({ feature, breadcrumbItems, onClose, onCreated, disabled = false }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [saving, setSaving] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = useMemo(() => {
    if (disabled || saving) return false;
    return Boolean(title.trim() && description.trim() && feature?.id);
  }, [disabled, saving, title, description, feature]);

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;
    setSaving(true);
    setErrorMessage("");
    try {
      const created = await storiesService.createStory(feature.id, {
        title: title.trim(),
        description: description.trim(),
        priority: priority || undefined,
      });
      if (typeof onCreated === "function") onCreated(created);
    } catch (e) {
      const msg = e && e.message ? String(e.message) : MSG_CREATE_FAIL;
      setErrorMessage(msg);
      setErrorOpen(true);
    } finally {
      setSaving(false);
    }
  }, [canSubmit, feature, title, description, priority, onCreated]);

  return (
    <DetailWorkspaceShell
      depth={2}
      rootDataTestId="project-detail-overlay-story-create"
      header={
        <WorkspaceHeader
          kicker="Nueva historia"
          breadcrumbItems={breadcrumbItems}
          breadcrumbDataTestId="breadcrumb-story-create-overlay"
          title="Crear user story"
          onRequestClose={onClose}
          closeAriaLabel="Cerrar creación de historia"
          closeDisabled={saving}
        />
      }
      chrome={null}
      footer={
        <WorkspaceFooter>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "var(--ds-space-2)" }}>
            <div />
            <div style={{ display: "flex", gap: "var(--ds-space-2)" }}>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving} data-testid="story-create-cancel">
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCreate}
                disabled={!canSubmit}
                aria-busy={saving}
                data-testid="story-create-submit"
              >
                {saving ? "Creando…" : "Crear"}
              </Button>
            </div>
          </div>
        </WorkspaceFooter>
      }
    >
      <AlertDialog
        isOpen={errorOpen}
        tone="error"
        title="No se pudo crear"
        description={errorMessage || MSG_CREATE_FAIL}
        confirmLabel="Entendido"
        cancelLabel=""
        onCancel={() => setErrorOpen(false)}
        onConfirm={() => setErrorOpen(false)}
      />

      <div className={projectEditStyles.root} data-testid="story-create-form">
        <div className={projectEditStyles.editGrid}>
          <div className={projectEditStyles.editColMain}>
            <Input
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={disabled || saving}
              maxLength={500}
            />
            <Textarea
              label="Descripción"
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={disabled || saving}
            />
          </div>

          <div className={projectEditStyles.editColControls}>
            <Select
              label="Prioridad"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={disabled || saving}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
            <p className={projectEditStyles.fieldHint}>Los criterios de aceptación se agregan tras crear la historia.</p>
          </div>

          <aside className={projectEditStyles.editColMeta}>
            <div className={projectEditStyles.metaCapsTitle}>Contexto</div>
            <div className={projectEditStyles.metaStack}>
              <div>
                <span className={projectEditStyles.roLabel}>Feature</span>
                <div className={projectEditStyles.roValue}>{feature?.title?.trim() ? feature.title.trim() : "—"}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DetailWorkspaceShell>
  );
}
