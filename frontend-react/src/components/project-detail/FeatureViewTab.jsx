/**
 * Pestaña Vista del overlay de feature: misma filosofía que ProjectViewTab (meta bar + cuerpo).
 */
import { useId, useState } from "react";
import { Card } from "../../design-system/components/Card/Card.jsx";
import { Badge } from "../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../design-system/components/Button/Button.jsx";
import { mapFeatureStatusToDsBadgeVariant } from "../../pages/wave1DsMappers.js";
import { featureCodeDisplay } from "./FeatureWorkspaceContent.jsx";
import styles from "./ProjectViewTab.module.css";

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

function IconUsers() {
  return (
    <svg className={styles.metaBarIconSvg} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 3c2.7 0 8 1.3 8 4v3H8v-3c0-2.7 5.3-4 8-4zm-8 0c-2.1 0-5.4 1-6.5 2.1L2 19h7v-2c0-1.5.6-2.8 1.5-3.9A9 9 0 0 1 8 15z"
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

function renderCriteriaList(label, items) {
  const list = Array.isArray(items) ? items.map((x) => String(x || "").trim()).filter(Boolean) : [];
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

export default function FeatureViewTab({ feature }) {
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const moreDetailsPanelId = useId();

  if (!feature) return null;

  const updatedStr = formatDateOnly(feature.updated_at);
  const createdStr = formatDateOnly(feature.created_at);
  const storyCount =
    feature.user_stories_count != null && Number.isFinite(Number(feature.user_stories_count))
      ? Number(feature.user_stories_count)
      : 0;

  return (
    <div className={styles.root} data-testid="feature-overlay-tab-vista">
      <div className={styles.metaBarWrap}>
        <div className={styles.metaBar} data-testid="feature-view-meta-bar">
          <MetaBarItem icon={IconBriefcase} iconToneClass={styles.metaIconAmber}>
            <span className={styles.metaBarLabel}>Código</span>
            <span className={styles.metaBarValue}>{featureCodeDisplay(feature)}</span>
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
            <span className={styles.metaBarValue}>{Math.min(100, Math.max(0, feature.progress_pct ?? 0))}%</span>
          </MetaBarItem>

          <MetaBarItem icon={IconUsers} iconToneClass={styles.metaIconPurple}>
            <span className={styles.metaBarLabel}>Historias</span>
            <span className={styles.metaBarValue}>{storyCount}</span>
          </MetaBarItem>

          <div className={styles.metaBarStatus}>
            <span className={styles.metaBarLabel}>Estado</span>
            <Badge variant={mapFeatureStatusToDsBadgeVariant(feature.status)}>{feature.status}</Badge>
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
              <span className={styles.metaDetailVal}>{abbreviateUuid(feature.id) || "—"}</span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Prioridad</span>
              <span className={styles.metaDetailVal}>{feature.priority != null ? String(feature.priority) : "—"}</span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Proyecto</span>
              <span className={styles.metaDetailVal}>{abbreviateUuid(feature.project_id) || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <Card padding="default" className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Descripción</div>
        <p className={styles.readBody}>{feature.description?.trim() ? feature.description : "—"}</p>
      </Card>

      {renderCriteriaList("Criterios de aceptación", feature.acceptance_criteria)}
      {renderCriteriaList("Criterios de implementación", feature.implementation_criteria)}
    </div>
  );
}
