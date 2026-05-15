import { memo } from "react";
import StoryBacklogRow from "./StoryBacklogRow.jsx";
import { backlogStripRedundantFeatureCodeFromTitle } from "../utils/backlogFeatureTitleDisplay.js";
import styles from "../ProductBacklogPage.module.css";

const COL_COUNT = 10;

function FeatureGroupSectionInner({
  feature,
  stories,
  expanded,
  onToggleExpanded,
  onSelectStory,
  showGroupChrome,
  featuresById,
}) {
  if (showGroupChrome && feature) {
    const count = stories.length;
    const groupTitle = backlogStripRedundantFeatureCodeFromTitle(feature.title, feature.number);
    return (
      <>
        <tr className={styles.groupHeaderRow}>
          <td colSpan={COL_COUNT}>
            <button
              type="button"
              className={styles.groupHeaderBtn}
              onClick={() => onToggleExpanded(feature.id)}
              aria-expanded={expanded}
              data-testid={`product-backlog-feature-toggle-${feature.id}`}
            >
              <span aria-hidden>{expanded ? "▼" : "▶"}</span>
              <span>
                Feature: {feature.display_key ? `${feature.display_key} — ` : ""}
                {groupTitle} ({count} {count === 1 ? "historia" : "historias"})
              </span>
            </button>
          </td>
        </tr>
        {expanded
          ? stories.map((story) => (
              <StoryBacklogRow key={story.id} story={story} onSelect={onSelectStory} />
            ))
          : null}
        {expanded ? (
          <tr className={styles.gripPlaceholderRow}>
            <td colSpan={COL_COUNT}>⋮⋮ Reordenación próximamente</td>
          </tr>
        ) : null}
      </>
    );
  }

  return (
    <>
      {stories.map((story) => (
        <StoryBacklogRow key={story.id} story={story} onSelect={onSelectStory} />
      ))}
      {stories.length > 0 ? (
        <tr className={styles.gripPlaceholderRow}>
          <td colSpan={COL_COUNT}>⋮⋮ Reordenación próximamente</td>
        </tr>
      ) : null}
    </>
  );
}

const FeatureGroupSection = memo(FeatureGroupSectionInner);
export default FeatureGroupSection;
