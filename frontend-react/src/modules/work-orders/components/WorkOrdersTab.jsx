import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import stack from "../../projects/styles/projectDetailStack.module.css";
import { listUsersNormalized } from "../../admin/adminService.js";
import { useWorkOrders } from "../hooks/useWorkOrders.js";
import { formatWorkOrderDisplayId } from "../utils/workOrders.mapper.js";
import WorkOrdersFilters from "./WorkOrdersFilters.jsx";
import WorkOrdersTable from "./WorkOrdersTable.jsx";
import WorkOrdersEmptyState from "./WorkOrdersEmptyState.jsx";
import CreateWorkOrderPanel from "../panels/CreateWorkOrderPanel.jsx";
import styles from "./WorkOrdersTab.module.css";
import { formatStoryHumanId } from "../../../shared/workspace/workItemHumanIds.js";

function storyCodeDisplay(story) {
  if (!story) return "—";
  const code = formatStoryHumanId(story.number != null ? Number(story.number) : null);
  if (code) return code;
  const id = story.id != null ? String(story.id) : "";
  return id ? `US-${id.slice(0, 8)}` : "—";
}

function userInitialsFromLabel(label) {
  const s = (label || "").trim();
  if (!s) return "";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

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
 *   story: object,
 *   canWrite: boolean,
 *   createPanelOpen: boolean,
 *   onOpenCreatePanel: () => void,
 *   onCloseCreatePanel: () => void,
 *   onOpenWorkOrder: (id: string) => void,
 *   refreshNonce?: number,
 *   users: object[],
 * }} props
 */
export default function WorkOrdersTab({
  projectId,
  story,
  canWrite,
  createPanelOpen,
  onOpenCreatePanel,
  onCloseCreatePanel,
  onOpenWorkOrder,
  refreshNonce = 0,
  users = [],
}) {
  const storyId = story?.id != null ? String(story.id) : "";
  const storyLabel = storyCodeDisplay(story);

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { items, meta, loading, error, createWorkOrder, refresh } = useWorkOrders(projectId, storyId, {
    statusFilter,
    kindFilter,
    refreshNonce,
  });

  const assigneeMap = useMemo(() => {
    const m = new Map();
    users.forEach((u) => {
      const id = u.id != null ? String(u.id) : "";
      if (!id) return;
      const label = userDisplayName(u);
      m.set(id, { label, initials: userInitialsFromLabel(label) });
    });
    return m;
  }, [users]);

  const assigneeResolver = useCallback(
    (userId) => {
      if (!userId) return { label: "", initials: "" };
      const hit = assigneeMap.get(String(userId));
      if (hit) return hit;
      return { label: String(userId).slice(0, 8), initials: String(userId).slice(0, 2).toUpperCase() };
    },
    [assigneeMap],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => {
      const idLabel = formatWorkOrderDisplayId(row).toLowerCase();
      const title = (row.title || "").toLowerCase();
      const uuid = (row.id || "").toLowerCase();
      return idLabel.includes(q) || title.includes(q) || uuid.includes(q);
    });
  }, [items, search]);

  const totalListed = Number(meta.total);
  const totalDisplay = Number.isFinite(totalListed) && totalListed >= 0 ? totalListed : items.length;

  const handleCreateSubmit = useCallback(
    async (payload) => {
      await createWorkOrder(payload);
    },
    [createWorkOrder],
  );

  if (!storyId) {
    return (
      <div className={stack.error} role="alert">
        No hay historia seleccionada.
      </div>
    );
  }

  return (
    <div className={styles.root} data-testid="work-orders-tab">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Work Orders ({totalDisplay})</h2>
          <p className={styles.subtitle}>Gestiona las tareas de ejecución y reprocesos asociados a esta historia de usuario.</p>
        </div>
        {canWrite ? (
          <Button type="button" variant="primary" onClick={onOpenCreatePanel} data-testid="work-orders-new-button">
            + Nueva orden
          </Button>
        ) : null}
      </header>

      <WorkOrdersFilters
        search={search}
        onSearchChange={setSearch}
        kindFilter={kindFilter}
        onKindFilterChange={setKindFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {loading ? <div className={stack.loading}>Cargando órdenes…</div> : null}
      {error ? (
        <div className={stack.error} role="alert">
          {error}
          <div className={styles.retryWrap}>
            <Button type="button" variant="outline" onClick={() => refresh()}>
              Reintentar
            </Button>
          </div>
        </div>
      ) : null}

      {!loading && !error && filteredRows.length === 0 ? (
        <WorkOrdersEmptyState onCreateRequest={canWrite ? onOpenCreatePanel : undefined} canCreate={canWrite} />
      ) : null}

      {!loading && !error && filteredRows.length > 0 ? (
        <>
          <WorkOrdersTable rows={filteredRows} assigneeResolver={assigneeResolver} onRowOpen={onOpenWorkOrder} />
          <p className={styles.footerMeta} data-testid="work-orders-count-line">
            Mostrando {filteredRows.length}
            {search.trim() ? " coincidencias" : ""} de {totalDisplay} órdenes
          </p>
        </>
      ) : null}

      <CreateWorkOrderPanel
        open={createPanelOpen}
        storyLabel={storyLabel}
        storyId={storyId}
        users={users}
        onClose={onCloseCreatePanel}
        onSubmit={handleCreateSubmit}
        canSubmit={canWrite}
      />
    </div>
  );
}
