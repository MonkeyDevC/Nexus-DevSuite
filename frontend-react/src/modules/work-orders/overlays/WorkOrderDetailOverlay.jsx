import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import stack from "../../projects/styles/projectDetailStack.module.css";
import { DetailWorkspaceShell } from "../../projects/components/workspace/DetailWorkspaceShell.jsx";
import WorkspaceHeader from "../../projects/components/workspace/WorkspaceHeader.jsx";
import WorkspaceStickyFooter from "../../projects/components/workspace/WorkspaceStickyFooter.jsx";
import * as workOrdersApi from "../services/workOrders.service.js";
import WorkOrderTypeBadge from "../components/WorkOrderTypeBadge.jsx";
import { formatWorkOrderDisplayId, workOrderPriorityLabel, workOrderStatusLabel } from "../utils/workOrders.mapper.js";
import { WORK_ORDER_PRIORITY_LABEL, WORK_ORDER_STATUS } from "../utils/workOrders.constants.js";
import styles from "./WorkOrderDetailOverlay.module.css";

function userDisplayName(u) {
  if (!u) return "";
  const fn = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (fn) return fn;
  if (u.email) return String(u.email);
  if (u.username) return String(u.username);
  return u.id ? String(u.id).slice(0, 8) : "";
}

/**
 * @param {{
 *   projectId: string,
 *   projectData: object,
 *   feature: object | null,
 *   story: object | null,
 *   workOrderId: string,
 *   users: object[],
 *   breadcrumbItems: { label: string, path?: string }[],
 *   onClose: () => void,
 *   onRequestBack: () => void,
 *   onSaved?: () => void,
 *   canEdit: boolean,
 * }} props
 */
export default function WorkOrderDetailOverlay({
  projectId,
  projectData,
  feature,
  story,
  workOrderId,
  users,
  breadcrumbItems,
  onClose,
  onRequestBack,
  onSaved,
  canEdit,
}) {
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const load = useCallback(async () => {
    if (!projectId || !workOrderId) return;
    setLoading(true);
    setError("");
    try {
      const wo = await workOrdersApi.getWorkOrder(projectId, workOrderId);
      if (!wo) {
        setError("Orden no encontrada.");
        setRow(null);
        return;
      }
      if (story?.id && wo.user_story_id !== String(story.id)) {
        setError("La orden no pertenece a esta historia.");
        setRow(null);
        return;
      }
      setRow(wo);
      setEditStatus(wo.status || "");
      setEditPriority(wo.priority || "");
      setEditAssignee(wo.assigned_to_user_id || "");
      setEditDescription(wo.description || "");
    } catch (e) {
      setRow(null);
      setError(e && e.message ? String(e.message) : "Error cargando la orden.");
    } finally {
      setLoading(false);
    }
  }, [projectId, workOrderId, story?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const userOptions = useMemo(
    () =>
      (users || []).map((u) => ({
        id: u.id != null ? String(u.id) : "",
        label: userDisplayName(u) || u.id,
      })),
    [users],
  );

  const dirty = useMemo(() => {
    if (!row) return false;
    const d0 = (row.description || "").trim();
    const d1 = editDescription.trim();
    return (
      editStatus !== (row.status || "") ||
      editPriority !== (row.priority || "") ||
      (editAssignee || "") !== (row.assigned_to_user_id || "") ||
      d0 !== d1
    );
  }, [row, editStatus, editPriority, editAssignee, editDescription]);

  const handleCopyLink = useCallback(() => {
    try {
      void navigator.clipboard.writeText(window.location.href);
    } catch {
      /* noop */
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!row || !canEdit) return;
    setSaving(true);
    setSaveError("");
    try {
      const body = {
        version: row.version,
        status: editStatus,
        priority: editPriority,
        description: editDescription.trim() || null,
        assigned_to_user_id: editAssignee || null,
      };
      const updated = await workOrdersApi.updateWorkOrder(projectId, workOrderId, body);
      if (updated) {
        setRow(updated);
        setEditStatus(updated.status || "");
        setEditPriority(updated.priority || "");
        setEditAssignee(updated.assigned_to_user_id || "");
        setEditDescription(updated.description || "");
      }
      if (typeof onSaved === "function") onSaved();
    } catch (e) {
      setSaveError(e && e.message ? String(e.message) : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }, [row, canEdit, editStatus, editPriority, editAssignee, editDescription, projectId, workOrderId, onSaved]);

  const headerMeta =
    row && !loading && !error ? (
      <>
        <span className={styles.code}>{formatWorkOrderDisplayId(row)}</span>
        <WorkOrderTypeBadge kind={row.kind} />
        <Badge variant="neutral" appearance="light">
          {workOrderPriorityLabel(row.priority)}
        </Badge>
        <Badge variant="success" appearance="light">
          {workOrderStatusLabel(row.status)}
        </Badge>
      </>
    ) : null;

  const storyTitle = story?.title?.trim() ? story.title.trim() : "Historia";

  return (
    <DetailWorkspaceShell
      depth={3}
      rootDataTestId="project-detail-overlay-work-order"
      header={
        <WorkspaceHeader
          kicker="Orden de trabajo"
          breadcrumbItems={breadcrumbItems}
          breadcrumbDataTestId="breadcrumb-work-order-overlay"
          title={row?.title?.trim() ? row.title.trim() : "Work Order"}
          meta={headerMeta}
          onRequestBack={onRequestBack}
          onRequestCopyLink={handleCopyLink}
          onRequestClose={onClose}
          closeAriaLabel="Cerrar orden"
        />
      }
      footer={
        row && !error ? (
          <WorkspaceStickyFooter
            className={stack.footerBar}
            leftActions={null}
            onCancel={onClose}
            onSave={handleSave}
            saveDisabled={!canEdit || !dirty || saving}
            cancelDisabled={saving}
            isSaving={saving}
            saveErrorMessage={saveError}
            canArchive={false}
            canDelete={false}
          />
        ) : null
      }
    >
      {loading ? <div className={stack.loading}>Cargando orden…</div> : null}
      {error ? (
        <div className={stack.error} role="alert">
          {error}
        </div>
      ) : null}
      {!loading && !error && row ? (
        <div className={styles.grid}>
          <div className={styles.main}>
            <section className={styles.block}>
              <h3 className={styles.h3}>Descripción</h3>
              <textarea
                className={styles.textarea}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={!canEdit || saving}
                rows={6}
              />
            </section>
            <section className={styles.block}>
              <h3 className={styles.h3}>Evidencia técnica</h3>
              <div className={styles.evidencePlaceholder}>
                <span className={styles.muted}>Adjuntos y trazas se integrarán con el módulo de entregas.</span>
                <Button type="button" variant="outline" disabled>
                  + Adjuntar captura / log
                </Button>
              </div>
            </section>
            <section className={styles.block}>
              <h3 className={styles.h3}>Criterios de aceptación</h3>
              <p className={styles.muted}>
                Los criterios oficiales viven en la historia <strong>{storyTitle}</strong>. Esta orden hereda ese contexto.
              </p>
            </section>
            <section className={styles.block}>
              <h3 className={styles.h3}>Actividad</h3>
              <ul className={styles.activity}>
                <li className={styles.muted}>Orden registrada en el proyecto {projectData?.name || "—"}.</li>
                {row.created_at ? (
                  <li className={styles.muted}>Creada: {new Date(row.created_at).toLocaleString()}</li>
                ) : null}
                {row.updated_at ? (
                  <li className={styles.muted}>Actualizada: {new Date(row.updated_at).toLocaleString()}</li>
                ) : null}
              </ul>
            </section>
          </div>
          <aside className={styles.side}>
            <label className={styles.sideField}>
              <span className={styles.sideLabel}>Estado</span>
              <select
                className={styles.select}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                disabled={!canEdit || saving}
              >
                <option value={WORK_ORDER_STATUS.PENDING}>{workOrderStatusLabel(WORK_ORDER_STATUS.PENDING)}</option>
                <option value={WORK_ORDER_STATUS.IN_PROGRESS}>{workOrderStatusLabel(WORK_ORDER_STATUS.IN_PROGRESS)}</option>
                <option value={WORK_ORDER_STATUS.IN_REVIEW}>{workOrderStatusLabel(WORK_ORDER_STATUS.IN_REVIEW)}</option>
                <option value={WORK_ORDER_STATUS.DONE}>{workOrderStatusLabel(WORK_ORDER_STATUS.DONE)}</option>
              </select>
            </label>
            <label className={styles.sideField}>
              <span className={styles.sideLabel}>Asignado a</span>
              <select
                className={styles.select}
                value={editAssignee}
                onChange={(e) => setEditAssignee(e.target.value)}
                disabled={!canEdit || saving}
              >
                <option value="">Sin asignar</option>
                {userOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.sideField}>
              <span className={styles.sideLabel}>Prioridad</span>
              <select
                className={styles.select}
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                disabled={!canEdit || saving}
              >
                <option value="LOW">{WORK_ORDER_PRIORITY_LABEL.LOW}</option>
                <option value="MEDIUM">{WORK_ORDER_PRIORITY_LABEL.MEDIUM}</option>
                <option value="HIGH">{WORK_ORDER_PRIORITY_LABEL.HIGH}</option>
              </select>
            </label>
            <div className={styles.sideField}>
              <span className={styles.sideLabel}>Feature / historia</span>
              <p className={styles.sideStatic}>{feature?.title?.trim() || "—"}</p>
              <p className={styles.sideStaticMuted}>{storyTitle}</p>
            </div>
          </aside>
        </div>
      ) : null}
    </DetailWorkspaceShell>
  );
}
