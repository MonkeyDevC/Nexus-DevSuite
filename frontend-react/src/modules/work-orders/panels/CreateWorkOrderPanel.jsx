import { useCallback, useMemo, useState } from "react";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import { WORK_ORDER_KIND, WORK_ORDER_KIND_UI_LABEL, WORK_ORDER_PRIORITY_LABEL } from "../utils/workOrders.constants.js";
import styles from "./CreateWorkOrderPanel.module.css";

function userDisplayName(u) {
  if (!u) return "";
  const fn = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (fn) return fn;
  if (u.email) return String(u.email);
  if (u.username) return String(u.username);
  return u.id ? String(u.id).slice(0, 8) : "";
}

/**
 * Panel lateral derecho (slide-over) para crear orden.
 * @param {{
 *   open: boolean,
 *   storyLabel: string,
 *   storyId: string,
 *   users: object[],
 *   onClose: () => void,
 *   onSubmit: (payload: object) => Promise<void>,
 *   canSubmit: boolean,
 * }} props
 */
export default function CreateWorkOrderPanel({ open, storyLabel, storyId, users, onClose, onSubmit, canSubmit }) {
  const [kind, setKind] = useState(WORK_ORDER_KIND.WORK);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedTo, setAssignedTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const titleTrim = title.trim();
  const valid = Boolean(titleTrim) && Boolean(kind) && Boolean(storyId);

  const reset = useCallback(() => {
    setKind(WORK_ORDER_KIND.WORK);
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setAssignedTo("");
    setLocalError("");
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onClose();
  }, [submitting, reset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!valid || !canSubmit) {
      setLocalError("El título es obligatorio.");
      return;
    }
    setSubmitting(true);
    setLocalError("");
    try {
      await onSubmit({
        user_story_id: storyId,
        kind,
        title: titleTrim,
        description: description.trim() || undefined,
        priority,
        assigned_to_user_id: assignedTo || undefined,
      });
      reset();
      onClose();
    } catch (e) {
      setLocalError(e && e.message ? String(e.message) : "No se pudo crear la orden.");
    } finally {
      setSubmitting(false);
    }
  }, [valid, canSubmit, storyId, kind, titleTrim, description, priority, assignedTo, onSubmit, reset, onClose]);

  const userOptions = useMemo(
    () =>
      (users || []).map((u) => ({
        id: u.id != null ? String(u.id) : "",
        label: userDisplayName(u) || u.id,
      })),
    [users],
  );

  if (!open) return null;

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby="create-work-order-title" data-testid="create-work-order-panel">
      <button type="button" className={styles.backdrop} aria-label="Cerrar panel" onClick={handleClose} />
      <aside className={styles.panel}>
        <header className={styles.header}>
          <h2 id="create-work-order-title" className={styles.title}>
            Crear nueva orden
          </h2>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
            Cerrar
          </Button>
        </header>
        <p className={styles.parentRef}>
          Historia padre: <strong>{storyLabel}</strong> (auto-vinculada)
        </p>

        <div className={styles.field}>
          <span className={styles.label}>Tipo de orden</span>
          <div className={styles.segmented} role="group" aria-label="Tipo de orden">
            <button
              type="button"
              className={[styles.seg, kind === WORK_ORDER_KIND.WORK ? styles.segActive : ""].filter(Boolean).join(" ")}
              onClick={() => setKind(WORK_ORDER_KIND.WORK)}
            >
              {WORK_ORDER_KIND_UI_LABEL.WORK}
            </button>
            <button
              type="button"
              className={[styles.seg, kind === WORK_ORDER_KIND.REWORK ? styles.segActiveRework : ""].filter(Boolean).join(" ")}
              onClick={() => setKind(WORK_ORDER_KIND.REWORK)}
            >
              {WORK_ORDER_KIND_UI_LABEL.REWORK}
            </button>
          </div>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Título</span>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Describe la orden en una línea"
            autoComplete="off"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Descripción</span>
          <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Prioridad</span>
          <select className={styles.input} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="LOW">{WORK_ORDER_PRIORITY_LABEL.LOW}</option>
            <option value="MEDIUM">{WORK_ORDER_PRIORITY_LABEL.MEDIUM}</option>
            <option value="HIGH">{WORK_ORDER_PRIORITY_LABEL.HIGH}</option>
          </select>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Asignar a</span>
          <select className={styles.input} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Sin asignar</option>
            {userOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        {localError ? (
          <p className={styles.error} role="alert">
            {localError}
          </p>
        ) : null}

        <footer className={styles.footer}>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={!valid || !canSubmit || submitting}>
            {submitting ? "Creando…" : "Crear orden"}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
