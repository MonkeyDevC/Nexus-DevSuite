import { memo } from "react";
import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import {
  mapStoryItemTypeToDsBadgeVariant,
  mapStoryPriorityToDsBadgeVariant,
  mapStoryRefinementStatusToDsBadgeVariant,
} from "../../../../shared/wave1/wave1DsMappers.js";
import wave1 from "../../../../shared/wave1/wave1Surfaces.module.css";
import {
  itemTypeDisplayLabel,
  qualityColumnLabel,
  refinementStatusDisplayLabel,
} from "../utils/backlogDisplayLabels.js";
import {
  formatQualityTooltipLines,
  getPrimaryQualityFinding,
  getStoryQualityFindings,
} from "../utils/backlogQuality.js";
import styles from "../ProductBacklogPage.module.css";

function qualityBadgeVariant(story) {
  const primary = getPrimaryQualityFinding(story);
  if (!primary) return "success";
  if (primary.severity === "critical") return "danger";
  if (primary.severity === "warning") return "warning";
  return "neutral";
}

function sprintCellLabel(story) {
  const name = story.sprint_name != null ? String(story.sprint_name).trim() : "";
  if (name) return name;
  return "Backlog";
}

function StoryBacklogRowInner({ story, onSelect }) {
  const pointsLabel = story.story_points != null ? String(story.story_points) : "—";
  const initials = story.assignee_initials || null;

  const findings = getStoryQualityFindings(story);
  const qualityTitle = formatQualityTooltipLines(findings) || undefined;
  const qualityText = qualityColumnLabel(story);

  return (
    <tr data-story-id={story.id}>
      <td className={styles.gripCell} aria-hidden>
        ⋮⋮
      </td>
      <td className={styles.monoId}>{story.display_key}</td>
      <td>
        <button
          type="button"
          className={wave1.tableLink}
          onClick={() => onSelect(story.id)}
          data-testid={`story-backlog-row-${story.id}`}
        >
          {story.title}
        </button>
      </td>
      <td>
        <Badge variant={mapStoryRefinementStatusToDsBadgeVariant(story.refinement_status)}>
          {refinementStatusDisplayLabel(story.refinement_status)}
        </Badge>
      </td>
      <td>
        <Badge variant={mapStoryItemTypeToDsBadgeVariant(story.item_type)}>
          {itemTypeDisplayLabel(story.item_type)}
        </Badge>
      </td>
      <td>
        <Badge variant={mapStoryPriorityToDsBadgeVariant(story.priority)}>{story.priority}</Badge>
      </td>
      <td>{pointsLabel}</td>
      <td>
        {initials ? (
          <span className={styles.assigneeBadge} title={story.assignee_label || ""}>
            {initials}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className={styles.qualityCell}>
        <div className={styles.qualityBadgeWrap}>
          <Badge variant={qualityBadgeVariant(story)} title={qualityTitle}>
            {qualityText}
          </Badge>
        </div>
      </td>
      <td className={styles.sprintCell}>{sprintCellLabel(story)}</td>
    </tr>
  );
}

const StoryBacklogRow = memo(StoryBacklogRowInner);
export default StoryBacklogRow;
