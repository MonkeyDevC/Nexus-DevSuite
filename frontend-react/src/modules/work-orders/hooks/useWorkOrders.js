import { useCallback, useEffect, useState } from "react";
import * as workOrdersApi from "../services/workOrders.service.js";
import { WORK_ORDER_LIST_PAGE_SIZE } from "../utils/workOrders.constants.js";

/**
 * Órdenes de una historia dentro de un proyecto (SSOT API).
 * @param {string} projectId
 * @param {string} storyId
 * @param {{ statusFilter?: string, kindFilter?: string, refreshNonce?: number }} options — "all" omite filtro API
 */
export function useWorkOrders(projectId, storyId, options = {}) {
  const { statusFilter = "all", kindFilter = "all", refreshNonce = 0 } = options;
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!projectId || !storyId) {
      setItems([]);
      setMeta({});
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { items: next, meta: nextMeta } = await workOrdersApi.listWorkOrdersForProject(projectId, {
        user_story_id: storyId,
        page: 1,
        limit: WORK_ORDER_LIST_PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        kind: kindFilter === "all" ? undefined : kindFilter,
      });
      setItems(next);
      setMeta(nextMeta);
    } catch (e) {
      setItems([]);
      setMeta({});
      setError(e && e.message ? String(e.message) : "Error cargando órdenes");
    } finally {
      setLoading(false);
    }
  }, [projectId, storyId, statusFilter, kindFilter]);

  useEffect(() => {
    load();
  }, [load, refreshNonce]);

  const createWorkOrder = useCallback(
    async (payload) => {
      const created = await workOrdersApi.createWorkOrder(projectId, payload);
      await load();
      return created;
    },
    [projectId, load],
  );

  return {
    items,
    meta,
    loading,
    error,
    refresh: load,
    createWorkOrder,
  };
}
