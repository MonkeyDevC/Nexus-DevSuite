import { useCallback, useState } from "react";
import { useAuth } from "../../../../app/context/AuthContext.jsx";
import { hasPermission } from "../../../../auth/authorization.js";
import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import AlertDialog from "../../../../design-system/components/AlertDialog/AlertDialog.jsx";
import * as storiesService from "../../../../modules/stories/storiesService.js";
import { mapStoryStatusToDsBadgeVariant } from "../../../../shared/wave1/wave1DsMappers.js";
import {
  formatStoryHumanId,
  formatStoryListLabel,
} from "../../../../shared/workspace/workItemHumanIds.js";
import styles from "./BacklogFeaturesTable.module.css";

const EMPTY_CONFIRM_DIALOG = {
  open: false,
  tone: "error",
  title: "",
  description: "",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  confirmVariant: "danger",
  onConfirm: null,
};

const STORY_DELETABLE_STATUSES = new Set(["DRAFT", "READY", "ARCHIVED"]);

function storyCode(row) {
  const n = row.number != null && Number.isFinite(Number(row.number)) ? Number(row.number) : null;
  const code = formatStoryHumanId(n);
  if (code) return code;
  const id = row.id != null ? String(row.id) : "";
  return id ? `US-${id.slice(0, 8)}` : "—";
}

function displayStoryLabel(row) {
  if (!row) return "";
  return formatStoryListLabel(row.number, row.title != null ? String(row.title) : "", " - ");
}

function priorityVariant(priority) {
  const p = String(priority || "").toUpperCase();
  if (p === "CRITICAL") return "danger";
  if (p === "HIGH") return "warning";
  if (p === "MEDIUM") return "secondary";
  if (p === "LOW") return "neutral";
  return "neutral";
}

function acceptanceCriteriaCount(row) {
  const ac = row.acceptance_criteria;
  if (Array.isArray(ac)) return ac.length;
  if (ac && typeof ac === "object") return Object.keys(ac).length;
  return null;
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.actionIcon}>
      <path
        fill="currentColor"
        d="M12 5c5.5 0 9.8 4.1 11 7-1.2 2.9-5.5 7-11 7S2.2 14.9 1 12c1.2-2.9 5.5-7 11-7zm0 2C7.8 7 4.4 10 3.3 12 4.4 14 7.8 17 12 17s7.6-3 8.7-5C19.6 10 16.2 7 12 7zm0 2.2A2.8 2.8 0 1 1 12 15a2.8 2.8 0 0 1 0-5.8zm0 1.8a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
      />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.actionIcon}>
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25zm18-11.5a1 1 0 0 0 0-1.4l-1.35-1.35a1 1 0 0 0-1.4 0l-1.15 1.15 3.75 3.75L21 5.75z"
      />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.actionIcon}>
      <path
        fill="currentColor"
        d="M20.54 5.23 19.15 3.84A2 2 0 0 0 17.74 3H6.26a2 2 0 0 0-1.41.84L3.46 5.23A2 2 0 0 0 3 6.5V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.46-1.27zM6.12 5h11.76l.5.5H5.62l.5-.5zM12 9h5v2h-5v-2z"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.actionIcon}>
      <path
        fill="currentColor"
        d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-6h2l1 1h4v2H6V5h4l1-1z"
      />
    </svg>
  );
}

/**
 * Tabla de historias en backlog de feature — paridad con {@link BacklogFeaturesTable} (misma card, acciones y permisos).
 * @param {object} props
 * @param {object[]} props.rows
 * @param {(storyId: string) => void} props.onOpenStory
 * @param {(storyId: string) => void} [props.onOpenStoryEdit]
 * @param {() => void | Promise<void>} [props.onRefresh]
 * @param {(storyId: string) => void} [props.onStoryRemovedFromBacklog]
 * @param {boolean} [props.canWriteStory]
 * @param {boolean} [props.interactionDisabled]
 */
export default function BacklogStoriesTable({
  rows,
  onOpenStory,
  onOpenStoryEdit,
  onRefresh,
  onStoryRemovedFromBacklog,
  canWriteStory = false,
  interactionDisabled = false,
}) {
  const { user } = useAuth();
  const canView = hasPermission(user, "project:read");
  const openEdit = onOpenStoryEdit ?? onOpenStory;

  const [actionBusyId, setActionBusyId] = useState(null);
  const [mutationError, setMutationError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(() => ({ ...EMPTY_CONFIRM_DIALOG }));

  const openConfirmDialog = useCallback((partial) => {
    setConfirmDialog({
      ...EMPTY_CONFIRM_DIALOG,
      ...partial,
      open: true,
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog({ ...EMPTY_CONFIRM_DIALOG });
  }, []);

  const handleArchiveRow = useCallback(
    (row) => {
      if (!row?.id || String(row.status) === "ARCHIVED") return;
      const label = displayStoryLabel(row);
      openConfirmDialog({
        tone: "warning",
        title: "Archivar historia",
        description: `¿Archivar "${label}"?`,
        confirmLabel: "Archivar",
        cancelLabel: "Cancelar",
        confirmVariant: "primary",
        onConfirm: async () => {
          setMutationError("");
          setActionBusyId(row.id);
          try {
            await storiesService.updateStoryStatus(row.id, "ARCHIVED");
            await onRefresh?.();
          } catch (error) {
            setMutationError(error && error.message ? error.message : "Error cargando datos");
          } finally {
            setActionBusyId(null);
          }
        },
      });
    },
    [onRefresh, openConfirmDialog],
  );

  const handleDeleteRow = useCallback(
    (row) => {
      if (!row?.id) return;
      const label = displayStoryLabel(row);
      const status = String(row.status || "");
      if (!STORY_DELETABLE_STATUSES.has(status)) {
        openConfirmDialog({
          tone: "info",
          title: "No se puede eliminar",
          description: `La historia "${label}" no está en un estado que permita eliminación (solo DRAFT, READY o ARCHIVED).`,
          confirmLabel: "Entendido",
          confirmVariant: "primary",
          cancelLabel: undefined,
          onConfirm: () => {},
        });
        return;
      }
      openConfirmDialog({
        tone: "error",
        title: "Eliminar historia",
        description: `¿Eliminar "${label}"? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        confirmVariant: "danger",
        onConfirm: async () => {
          setMutationError("");
          setActionBusyId(row.id);
          try {
            await storiesService.deleteStory(row.id);
            onStoryRemovedFromBacklog?.(String(row.id));
            await onRefresh?.();
          } catch (error) {
            setMutationError(error && error.message ? error.message : "Error cargando datos");
          } finally {
            setActionBusyId(null);
          }
        },
      });
    },
    [onRefresh, onStoryRemovedFromBacklog, openConfirmDialog],
  );

  if (!rows.length) {
    return <p className={styles.empty}>No hay historias que coincidan.</p>;
  }

  return (
    <div className={styles.wrap} data-testid="feature-overlay-backlog-stories-table">
      {mutationError ? (
        <div role="alert" className={styles.mutationError}>
          {mutationError}
        </div>
      ) : null}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Código</th>
            <th className={styles.th}>Título</th>
            <th className={styles.th}>Estado</th>
            <th className={styles.th}>Prioridad</th>
            <th className={styles.th}>Progreso</th>
            <th className={styles.th}>Criterios</th>
            <th className={styles.th} style={{ textAlign: "right" }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const sid = row.id != null ? String(row.id) : "";
            const title = typeof row.title === "string" && row.title.trim() !== "" ? row.title.trim() : "—";
            const status = row.status != null ? String(row.status) : "—";
            const priority = row.priority != null ? String(row.priority) : "—";
            const criteriaN = acceptanceCriteriaCount(row);
            const rowBusy = actionBusyId === row.id;
            const label = displayStoryLabel(row);
            const isArchived = status === "ARCHIVED";
            const canDelete = STORY_DELETABLE_STATUSES.has(status);
            return (
              <tr key={sid || title} className={styles.tr}>
                <td className={styles.td}>
                  <span className={styles.code}>{storyCode(row)}</span>
                </td>
                <td className={styles.td}>{title}</td>
                <td className={styles.td}>
                  <Badge variant={mapStoryStatusToDsBadgeVariant(status)}>{status}</Badge>
                </td>
                <td className={styles.td}>
                  <Badge variant={priorityVariant(priority)}>{priority}</Badge>
                </td>
                <td className={styles.td}>
                  <span className={styles.denseValue}>—</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.denseValue}>{criteriaN != null ? String(criteriaN) : "—"}</span>
                </td>
                <td className={styles.td} style={{ textAlign: "right" }}>
                  <div className={styles.actionsCluster}>
                    {canView ? (
                      <button
                        type="button"
                        className={[styles.iconBtn, styles.iconBtnView].join(" ")}
                        onClick={() => sid && onOpenStory(sid)}
                        disabled={interactionDisabled || !sid || rowBusy}
                        aria-label={`Ver: ${label}`}
                        title="Ver"
                        data-testid={`feature-backlog-open-story-${sid.slice(0, 8)}`}
                      >
                        <IconEye />
                      </button>
                    ) : null}
                    {canWriteStory ? (
                      <button
                        type="button"
                        className={[styles.iconBtn, styles.iconBtnEdit].join(" ")}
                        onClick={() => sid && openEdit(sid)}
                        disabled={interactionDisabled || !sid || rowBusy}
                        aria-label={`Editar: ${label}`}
                        title="Editar"
                        data-testid={`feature-backlog-edit-story-${sid.slice(0, 8)}`}
                      >
                        <IconPencil />
                      </button>
                    ) : null}
                    {canWriteStory ? (
                      <button
                        type="button"
                        className={[styles.iconBtn, styles.iconBtnArchive].join(" ")}
                        onClick={() => handleArchiveRow(row)}
                        disabled={interactionDisabled || !sid || rowBusy || isArchived}
                        aria-label={`Archivar: ${label}`}
                        title={isArchived ? "Ya archivada" : "Archivar"}
                        data-testid={`feature-backlog-archive-story-${sid.slice(0, 8)}`}
                      >
                        <IconArchive />
                      </button>
                    ) : null}
                    {canWriteStory ? (
                      <button
                        type="button"
                        className={[styles.iconBtn, styles.iconBtnDelete].join(" ")}
                        onClick={() => handleDeleteRow(row)}
                        disabled={interactionDisabled || !sid || rowBusy || !canDelete}
                        aria-label={`Eliminar: ${label}`}
                        title={
                          !canDelete
                            ? "Solo se puede eliminar en DRAFT, READY o ARCHIVED"
                            : "Eliminar"
                        }
                        data-testid={`feature-backlog-delete-story-${sid.slice(0, 8)}`}
                      >
                        <IconTrash />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <AlertDialog
        isOpen={confirmDialog.open}
        tone={confirmDialog.tone}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        confirmVariant={confirmDialog.confirmVariant}
        busy={false}
        onCancel={closeConfirmDialog}
        onConfirm={async () => {
          const fn = confirmDialog.onConfirm;
          closeConfirmDialog();
          if (typeof fn === "function") {
            await Promise.resolve(fn());
          }
        }}
      />
    </div>
  );
}
