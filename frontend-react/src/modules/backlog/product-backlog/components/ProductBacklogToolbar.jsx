import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import { ClearTableFiltersAction } from "../../../../design-system/patterns/TableColumnFilter/index.js";
import TableFilterSelect from "../../../projects/components/tables/TableFilterSelect.jsx";
import styles from "../ProductBacklogPage.module.css";

const SORT_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "priority", label: "Prioridad" },
  { value: "created_at", label: "Fecha creación" },
];

const GROUP_OPTIONS = [
  { value: "feature", label: "Por feature" },
  { value: "flat", label: "Lista plana" },
];

/**
 * Toolbar global del Product Backlog: búsqueda, proyecto, filtro por feature, creación, orden/vista.
 * Otros filtros viven en encabezados de la tabla.
 * @param {object} props
 */
export default function ProductBacklogToolbar({
  projectScoped,
  projectId,
  projectOptions,
  onProjectChange,
  searchQuery,
  onSearchChange,
  featureFilterValue,
  featureFilterOptions,
  onFeatureFilterChange,
  sortMode,
  onSortChange,
  groupByFeature,
  onGroupChange,
  featuresForCreate,
  canCreateStory,
  onCreateStoryRequest,
  hasActiveColumnFilters,
  onClearColumnFilters,
}) {
  const [createFeatureId, setCreateFeatureId] = useState("");

  useEffect(() => {
    const list = Array.isArray(featuresForCreate) ? featuresForCreate : [];
    if (list.length === 0) {
      setCreateFeatureId("");
      return;
    }
    if (!createFeatureId || !list.some((f) => f.id === createFeatureId)) {
      setCreateFeatureId(list[0].id);
    }
  }, [featuresForCreate, createFeatureId]);

  const projectSelectOptions = useMemo(() => {
    const opts = [{ value: "", label: "Proyecto…" }];
    for (const p of projectOptions) {
      if (p?.id && p?.name) opts.push({ value: String(p.id), label: String(p.name) });
    }
    return opts;
  }, [projectOptions]);

  const featureCreateOptions = useMemo(() => {
    const list = Array.isArray(featuresForCreate) ? featuresForCreate : [];
    return list.map((f) => ({
      value: f.id,
      label: f.display_key ? `${f.display_key} — ${f.title}` : f.title,
    }));
  }, [featuresForCreate]);

  const hasProject = Boolean(projectId);
  const multiFeature = featureCreateOptions.length > 1;
  const canSubmitNew = hasProject && canCreateStory && createFeatureId;

  return (
    <div className={styles.toolbarWireframe} data-testid="product-backlog-toolbar">
      {!projectScoped ? (
        <div className={styles.toolbarFieldCompact}>
          <span className={styles.toolbarLabel} id="pb-label-project">
            Proyecto
          </span>
          <TableFilterSelect
            ariaLabel="Seleccionar proyecto"
            value={projectId || ""}
            options={projectSelectOptions}
            onChange={onProjectChange}
          />
        </div>
      ) : null}

      <div className={styles.toolbarTopRow}>
        <div className={styles.toolbarSearchWrap}>
          <Input
            label=""
            placeholder="Buscar por título o ID…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar por título o ID"
            className={styles.toolbarSearchInput}
          />
        </div>
        <ClearTableFiltersAction
          hasActiveFilters={hasActiveColumnFilters}
          onClear={onClearColumnFilters}
          testId="product-backlog-clear-column-filters"
        />
        <div className={styles.toolbarPrimaryAction}>
          <Button
            variant="primary"
            type="button"
            disabled={!canSubmitNew}
            onClick={() => {
              if (createFeatureId) onCreateStoryRequest(createFeatureId);
            }}
            data-testid="product-backlog-new-story"
          >
            + Nueva historia
          </Button>
        </div>
      </div>

      <div className={styles.toolbarMetaRow}>
        {hasProject ? (
          <div className={styles.toolbarFieldCompact}>
            <span className={styles.toolbarLabel}>Feature</span>
            <TableFilterSelect
              ariaLabel="Filtrar historias por feature"
              value={featureFilterValue || ""}
              options={Array.isArray(featureFilterOptions) ? featureFilterOptions : []}
              onChange={onFeatureFilterChange}
              disabled={!hasProject}
            />
          </div>
        ) : null}
        {multiFeature ? (
          <div className={styles.toolbarFieldCompact}>
            <span className={styles.toolbarLabel}>Nueva en</span>
            <TableFilterSelect
              ariaLabel="Feature destino para nueva historia"
              value={createFeatureId}
              options={featureCreateOptions}
              onChange={setCreateFeatureId}
              disabled={!hasProject || !canCreateStory}
            />
          </div>
        ) : null}
        <div className={styles.toolbarFieldCompact}>
          <span className={styles.toolbarLabel}>Orden</span>
          <TableFilterSelect
            ariaLabel="Ordenar historias"
            value={sortMode}
            options={SORT_OPTIONS}
            onChange={(v) => onSortChange(/** @type {"manual"|"priority"|"created_at"} */ (v))}
            disabled={!hasProject}
          />
        </div>
        <div className={styles.toolbarFieldCompact}>
          <span className={styles.toolbarLabel}>Vista</span>
          <TableFilterSelect
            ariaLabel="Agrupación"
            value={groupByFeature ? "feature" : "flat"}
            options={GROUP_OPTIONS}
            onChange={(v) => onGroupChange(v === "feature")}
            disabled={!hasProject}
          />
        </div>
      </div>
    </div>
  );
}
