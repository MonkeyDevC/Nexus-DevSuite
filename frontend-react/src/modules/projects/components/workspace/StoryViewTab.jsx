/**
 * Pestaña Vista del overlay de historia: misma cinta de métricas + secciones que FeatureViewTab.
 */
import { useId, useState } from "react";
import { Card } from "../../../../design-system/components/Card/Card.jsx";
import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { mapStoryStatusToDsBadgeVariant } from "../../../../shared/wave1/wave1DsMappers.js";
import { featureCodeDisplay } from "./FeatureWorkspaceContent.jsx";
import { formatStoryHumanId } from "../../../../shared/workspace/workItemHumanIds.js";
import styles from "./ProjectViewTab.module.css";

function storyCodeDisplay(story) {
  if (!story) return "—";
  const code = formatStoryHumanId(story.number != null ? Number(story.number) : null);
  if (code) return code;
  const id = story.id != null ? String(story.id) : "";
  return id ? `US-${id.slice(0, 8)}` : "—";
}

function formatDateOnly(value) {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function abbreviateUuid(value) {
  if (value == null || value === "") return null;
  const s = String(value);
  if (s.length <= 10) return s;
  return `${s.slice(0, 8)}…`;
}

function storyProgressPercent(story) {
  const s = String(story?.status || "").toUpperCase();
  if (s === "DONE" || s === "ARCHIVED") return 100;
  return 0;
}

function criteriaAsLines(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x ?? "").trim()).filter(Boolean);
  if (typeof raw === "object") {
    return Object.values(raw)
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);
  }
  const str = String(raw).trim();
  return str ? [str] : [];
}

function IconBriefcase() {
  return (
    <svg className={styles.metaBarIconSvg} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M14 6V4h-4v2H5v15h14V6h-5zm-4-2h4v2h-4V4zM7 8h10v11H7V8z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className={styles.metaBarIconSvg} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M8 2v2H6a2 2 0 0 0-2 2v2h16V6a2 2 0 0 0-2-2h-2V2h-2v2h-4V2H8zm10 8H6v10h12V10z"
      />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className={styles.metaBarIconSvg} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M4 19h16v2H4v-2zm3-6h3v5H7v-5zm5-8h3v13h-3V5zm5 4h3v9h-3V9z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg className={styles.metaBarIconSvg} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M3.9 12c0-1.7 1.4-3.1 3.1-3.1h4V7H7c-2.8 0-5 2.2-5 5s2.2 5 5 5h4v-1.9H7c-1.7 0-3.1-1.4-3.1-3.1zm13.1 3.1h-4V17h4c2.8 0 5-2.2 5-5s-2.2-5-5-5h-4v1.9h4c1.7 0 3.1 1.4 3.1 3.1s-1.4 3.1-3.1 3.1zM8 11h8v2H8v-2z"
      />
    </svg>
  );
}

function IconSprint() {
  return (
    <svg className={styles.metaBarIconSvg} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M5 4h4l2 3h8v2h-4.2L13 15H7L5 12H3V4h2zm2 2v6h1.6l1.2-2H17v-2H9.8L8.6 6H7zm8 9H7l-1 3h12l-3-3z"
      />
    </svg>
  );
}

function MetaBarItem({ icon: Icon, iconToneClass, children }) {
  return (
    <div className={styles.metaBarItem} role="group">
      <span className={`${styles.metaBarIconWrap} ${iconToneClass}`} aria-hidden>
        <Icon />
      </span>
      <div className={styles.metaBarItemBody}>{children}</div>
    </div>
  );
}

function renderCriteriaList(label, raw) {
  const list = criteriaAsLines(raw);
  if (list.length === 0) {
    return (
      <Card padding="default" className={styles.sectionCard}>
        <div className={styles.sectionTitle}>{label}</div>
        <p className={styles.muted}>Ninguno</p>
      </Card>
    );
  }
  return (
    <Card padding="default" className={styles.sectionCard}>
      <div className={styles.sectionTitle}>{label}</div>
      <ul className={styles.criteriaList}>
        {list.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </Card>
  );
}

export default function StoryViewTab({ story, parentFeature }) {
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const moreDetailsPanelId = useId();

  if (!story) return null;

  const updatedStr = formatDateOnly(story.updated_at);
  const createdStr = formatDateOnly(story.created_at);
  const progressPct = storyProgressPercent(story);
  const featureCode = parentFeature ? featureCodeDisplay(parentFeature) : "—";
  const sprintLabel =
    story.sprint_name?.trim() ||
    (story.sprint_id?.trim() ? `Sprint (${String(story.sprint_id).slice(0, 8)}…)` : "") ||
    "Sin sprint asignado";

  return (
    <div className={styles.root} data-testid="story-overlay-tab-vista">
      <div className={styles.metaBarWrap}>
        <div className={styles.metaBar} data-testid="story-view-meta-bar">
          <MetaBarItem icon={IconBriefcase} iconToneClass={styles.metaIconAmber}>
            <span className={styles.metaBarLabel}>Código</span>
            <span className={styles.metaBarValue}>{storyCodeDisplay(story)}</span>
          </MetaBarItem>

          <MetaBarItem icon={IconCalendar} iconToneClass={styles.metaIconCyan}>
            <span className={styles.metaBarLabel}>Actualizado</span>
            <span className={styles.metaBarValueDense}>
              <span>{updatedStr}</span>
              <span className={styles.metaBarSep}>|</span>
              <span className={styles.metaBarInlineMuted}>Creado:</span> <span>{createdStr}</span>
            </span>
          </MetaBarItem>

          <MetaBarItem icon={IconChart} iconToneClass={styles.metaIconGold}>
            <span className={styles.metaBarLabel}>Progreso</span>
            <span className={styles.metaBarValue}>{progressPct}%</span>
          </MetaBarItem>

          <MetaBarItem icon={IconLink} iconToneClass={styles.metaIconPurple}>
            <span className={styles.metaBarLabel}>Feature</span>
            <span className={styles.metaBarValue}>{featureCode}</span>
          </MetaBarItem>

          <MetaBarItem icon={IconSprint} iconToneClass={styles.metaIconCyan}>
            <span className={styles.metaBarLabel}>Sprint</span>
            <span className={styles.metaBarValue} data-testid="story-view-sprint">
              {sprintLabel}
            </span>
          </MetaBarItem>

          <div className={styles.metaBarStatus}>
            <span className={styles.metaBarLabel}>Estado</span>
            <Badge variant={mapStoryStatusToDsBadgeVariant(story.status)}>{story.status}</Badge>
          </div>

          <div className={styles.metaBarActions}>
            <Button
              variant="outline"
              type="button"
              className={styles.metaBarMoreBtn}
              aria-expanded={moreDetailsOpen}
              aria-controls={moreDetailsPanelId}
              onClick={() => setMoreDetailsOpen((o) => !o)}
            >
              {moreDetailsOpen ? "Menos detalles" : "Más detalles"}
            </Button>
          </div>
        </div>

        <div id={moreDetailsPanelId} className={styles.metaDetailsPanel} hidden={!moreDetailsOpen}>
          <div className={styles.metaDetailsGrid}>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>ID interno</span>
              <span className={styles.metaDetailVal}>{abbreviateUuid(story.id) || "—"}</span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Prioridad</span>
              <span className={styles.metaDetailVal}>{story.priority != null ? String(story.priority) : "—"}</span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Feature (ID)</span>
              <span className={styles.metaDetailVal}>{abbreviateUuid(story.feature_id) || "—"}</span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Sprint (ID)</span>
              <span className={styles.metaDetailVal}>{abbreviateUuid(story.sprint_id) || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <Card padding="default" className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Descripción</div>
        <p className={styles.readBody}>{story.description?.trim() ? story.description : "—"}</p>
      </Card>

      {renderCriteriaList("Criterios de aceptación", story.acceptance_criteria)}
      {renderCriteriaList("Criterios de implementación", story.implementation_criteria)}
    </div>
  );
}
