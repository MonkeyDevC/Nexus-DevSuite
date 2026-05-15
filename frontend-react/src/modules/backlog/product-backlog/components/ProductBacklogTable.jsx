import FeatureGroupSection from "./FeatureGroupSection.jsx";
import { TableColumnFilter } from "../../../../design-system/patterns/TableColumnFilter/index.js";
import styles from "../ProductBacklogPage.module.css";

/**
 * @typedef {object} ColumnFilterBinding
 * @property {string} value
 * @property {{ value: string, label: string }[]} options
 * @property {(next: string) => void} onChange
 * @property {boolean} [disabled]
 */

/**
 * @param {object} props
 * @param {import("../utils/backlogGrouping.js").BacklogFeatureSection[]} props.sections
 * @param {Record<string, boolean>} props.expandedFeatureIds
 * @param {(featureId: string) => void} props.onToggleFeatureExpanded
 * @param {(storyId: string) => void} props.onSelectStory
 * @param {boolean} props.groupByFeature
 * @param {boolean} props.filtersDisabled
 * @param {{
 *   refinement: ColumnFilterBinding,
 *   priority: ColumnFilterBinding,
 *   assignee: ColumnFilterBinding,
 *   quality: ColumnFilterBinding,
 *   itemType: ColumnFilterBinding,
 *   readySprint: ColumnFilterBinding,
 * }} props.columnFilters
 */

function ThWithColumnFilter({ label, binding, allLabel, testId }) {
  const { value, options, onChange, disabled } = binding;
  return (
    <th scope="col">
      <div className={styles.thWithFilter}>
        <span className={styles.thWithFilterLabel}>{label}</span>
        <TableColumnFilter
          value={value}
          options={options}
          onChange={onChange}
          allLabel={allLabel}
          ariaLabelTrigger={`Filtrar por ${label}`}
          disabled={Boolean(disabled)}
          testIdTrigger={testId}
        />
      </div>
    </th>
  );
}

export default function ProductBacklogTable({
  sections,
  expandedFeatureIds,
  onToggleFeatureExpanded,
  onSelectStory,
  groupByFeature,
  featuresById,
  filtersDisabled,
  columnFilters,
}) {
  const fd = Boolean(filtersDisabled);
  const cf = columnFilters;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table} data-testid="backlog-table">
        <thead>
          <tr>
            <th scope="col" aria-label="Reordenar" />
            <th scope="col">ID</th>
            <th scope="col">Título</th>
            <ThWithColumnFilter
              label="Estado"
              binding={{ ...cf.refinement, disabled: fd || cf.refinement.disabled }}
              allLabel="Todas"
              testId="backlog-col-filter-refinement"
            />
            <ThWithColumnFilter
              label="Tipo"
              binding={{ ...cf.itemType, disabled: fd || cf.itemType.disabled }}
              allLabel="Todas"
              testId="backlog-col-filter-item-type"
            />
            <ThWithColumnFilter
              label="Prioridad"
              binding={{ ...cf.priority, disabled: fd || cf.priority.disabled }}
              allLabel="Todas"
              testId="backlog-col-filter-priority"
            />
            <th scope="col">Pts</th>
            <ThWithColumnFilter
              label="Asignado"
              binding={{ ...cf.assignee, disabled: fd || cf.assignee.disabled }}
              allLabel="Todos"
              testId="backlog-col-filter-assignee"
            />
            <ThWithColumnFilter
              label="Calidad"
              binding={{ ...cf.quality, disabled: fd || cf.quality.disabled }}
              allLabel="Todas"
              testId="backlog-col-filter-quality"
            />
            <ThWithColumnFilter
              label="Sprint"
              binding={{ ...cf.readySprint, disabled: fd || cf.readySprint.disabled }}
              allLabel="Todas"
              testId="backlog-col-filter-ready-sprint"
            />
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => {
            const fid = section.feature?.id ?? "_flat";
            const expanded = section.feature ? expandedFeatureIds[section.feature.id] !== false : true;
            return (
              <FeatureGroupSection
                key={fid}
                feature={section.feature}
                stories={section.stories}
                expanded={expanded}
                onToggleExpanded={onToggleFeatureExpanded}
                onSelectStory={onSelectStory}
                showGroupChrome={groupByFeature && section.feature != null}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
