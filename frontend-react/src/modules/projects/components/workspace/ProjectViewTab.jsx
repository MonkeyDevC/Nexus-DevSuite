/**
 * Pestaña Vista: solo lectura desde SSOT (`projectData`).
 * Metadatos en barra horizontal densa (wireframe); detalle secundario bajo “Más detalles”.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Card } from "../../../../design-system/components/Card/Card.jsx";
import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { mapProjectStatusToDsBadgeVariant } from "../../../../shared/wave1/wave1DsMappers.js";
import { getUserById } from "../../../../modules/users/usersService.js";
import { formatProjectHumanId } from "../../../../shared/workspace/workItemHumanIds.js";
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
      <path
        fill="currentColor"
        d="M14 6V4h-4v2H5v15h14V6h-5zm-4-2h4v2h-4V4zM7 8h10v11H7V8z"
      />
    </svg>
  );
}

function IconHash() {
  return (
    <svg className={styles.metaBarIconSvg} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M7.5 5h2l-.8 4H14l.8-4h2l-.8 4H19v2h-2.4l-.6 3H18v2h-2.1l-.8 4h-2l.8-4H10l-.8 4h-2l.8-4H5v-2h2.4l.6-3H6V9h2.1l.8-4zm3.4 6l-.6 3h4l.6-3h-4z"
      />
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

function IconSprint() {
  return (
    <svg className={styles.metaBarIconSvg} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h14v4H4v-4z" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg className={styles.metaBarIconSvg} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M4 21V3h12v18H4zm2-2h8V5H6v14zm2-12h2v2H8V7zm0 4h2v2H8v-2zm4-4h2v2h-2V7zm0 4h2v2h-2v-2zM16 7h4v14h-2v-4h-2V7z"
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

export default function ProjectViewTab({
  projectData,
  projectCodeDisplay,
  canReleases,
  onNavigateFeatures,
  onNavigateSprints,
  onNavigateIncidents,
  onNavigateReleases,
}) {
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const moreDetailsPanelId = useId();
  const creatorNameCacheRef = useRef(new Map());
  const [creatorDisplayName, setCreatorDisplayName] = useState(null);

  if (!projectData) return null;

  const orgAbbrev = abbreviateUuid(projectData.organization_id) || "—";
  const organizationDisplayName =
    projectData.organization_name && String(projectData.organization_name).trim()
      ? String(projectData.organization_name).trim()
      : orgAbbrev;
  const creatorAbbrev = abbreviateUuid(projectData.created_by) || "—";
  const slugDisplay = projectData.normalized_name || "—";
  const internalIdAbbrev = abbreviateUuid(projectData.id) || "—";
  const sprintName =
    projectData.current_sprint && projectData.current_sprint.name
      ? projectData.current_sprint.name
      : "—";
  const lastActivityRaw = projectData.last_activity_at || projectData.updated_at;
  const progressLabel =
    typeof projectData.progress_pct === "number" ? `${projectData.progress_pct}%` : "—";
  const teamLabel =
    typeof projectData.team_member_count === "number"
      ? `${projectData.team_member_count} miembro${projectData.team_member_count === 1 ? "" : "s"}`
      : "—";
  const projectHumanId = formatProjectHumanId(projectData.number);
  const internalIdDisplay = projectHumanId || internalIdAbbrev;
  const recordNumberPart =
    projectData.number != null &&
    !Number.isNaN(Number(projectData.number)) &&
    Number.isFinite(Number(projectData.number))
      ? String(Number(projectData.number))
      : null;
  const updatedStr = formatDateOnly(projectData.updated_at);
  const createdStr = formatDateOnly(projectData.created_at);

  useEffect(() => {
    if (!moreDetailsOpen) return;
    const userId = projectData.created_by != null ? String(projectData.created_by).trim() : "";
    if (!userId) {
      setCreatorDisplayName(null);
      return;
    }
    const cached = creatorNameCacheRef.current.get(userId);
    if (cached) {
      setCreatorDisplayName(cached);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const u = await getUserById(userId);
        const name = u && u.name ? String(u.name).trim() : "";
        const email = u && u.email ? String(u.email).trim() : "";
        const display = name || email || null;
        if (cancelled) return;
        if (display) creatorNameCacheRef.current.set(userId, display);
        setCreatorDisplayName(display);
      } catch {
        if (!cancelled) setCreatorDisplayName(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moreDetailsOpen, projectData.created_by]);

  return (
    <div className={styles.root} data-testid="project-detail-tab-vista">
      <div className={styles.metaBarWrap}>
        <div className={styles.metaBar} data-testid="project-view-meta-bar">
          <MetaBarItem icon={IconBriefcase} iconToneClass={styles.metaIconAmber}>
            <span className={styles.metaBarLabel}>Código</span>
            <span className={styles.metaBarValue} data-testid="project-view-meta-code">
              {projectCodeDisplay}
            </span>
          </MetaBarItem>

          <MetaBarItem icon={IconHash} iconToneClass={styles.metaIconSlate}>
            <span className={styles.metaBarLabel}>Versión</span>
            <span className={styles.metaBarValue} data-testid="project-view-meta-version">
              v{projectData.version}
            </span>
          </MetaBarItem>

          <MetaBarItem icon={IconCalendar} iconToneClass={styles.metaIconCyan}>
            <span className={styles.metaBarLabel}>Actualizado</span>
            <span className={styles.metaBarValueDense}>
              <span data-testid="project-view-meta-updated">{updatedStr}</span>
              <span className={styles.metaBarSep}>|</span>
              <span className={styles.metaBarInlineMuted}>Creado:</span>{" "}
              <span data-testid="project-view-meta-created">{createdStr}</span>
            </span>
          </MetaBarItem>

          <MetaBarItem icon={IconChart} iconToneClass={styles.metaIconGold}>
            <span className={styles.metaBarLabel}>Progreso</span>
            <span className={styles.metaBarValue} data-testid="project-view-meta-progress">
              {progressLabel}
            </span>
          </MetaBarItem>

          <MetaBarItem icon={IconUsers} iconToneClass={styles.metaIconPurple}>
            <span className={styles.metaBarValue} data-testid="project-view-meta-team">
              {teamLabel}
            </span>
          </MetaBarItem>

          <MetaBarItem icon={IconSprint} iconToneClass={styles.metaIconSky}>
            <span className={styles.metaBarLabel}>Sprint</span>
            <span className={styles.metaBarValue} data-testid="project-view-meta-sprint">
              {sprintName}
            </span>
          </MetaBarItem>

          <MetaBarItem icon={IconBuilding} iconToneClass={styles.metaIconTeal}>
            <span className={styles.metaBarLabel}>Organización</span>
            <span className={styles.metaBarValue} data-testid="project-view-meta-organization-name">
              {organizationDisplayName}
            </span>
          </MetaBarItem>

          <div className={styles.metaBarStatus}>
            <span className={styles.metaBarLabel}>Estado</span>
            <Badge variant={mapProjectStatusToDsBadgeVariant(projectData.status)}>
              {projectData.status}
            </Badge>
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

        <div
          id={moreDetailsPanelId}
          className={styles.metaDetailsPanel}
          data-testid="project-view-meta-details-panel"
          hidden={!moreDetailsOpen}
        >
          <div className={styles.metaDetailsGrid}>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Última actividad</span>
              <span className={styles.metaDetailVal} data-testid="project-view-meta-last-activity">
                {formatDateOnly(lastActivityRaw)}
              </span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Archivado</span>
              <span className={styles.metaDetailVal} data-testid="project-view-meta-archived">
                {projectData.archived_at ? formatDateOnly(projectData.archived_at) : "No"}
              </span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Nombre normalizado</span>
              <span className={styles.metaDetailVal} data-testid="project-view-strip-slug">
                {slugDisplay}
              </span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Creador</span>
              <span className={styles.metaDetailVal} data-testid="project-view-strip-creator">
                {creatorDisplayName || creatorAbbrev}
              </span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>ID interno</span>
              <span className={styles.metaDetailVal} data-testid="project-view-strip-id">
                {internalIdDisplay}
              </span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>N.º registro</span>
              <span className={styles.metaDetailVal} data-testid="project-view-strip-number">
                {recordNumberPart != null ? `#${recordNumberPart}` : "—"}
              </span>
            </div>
            <div className={styles.metaDetailCell}>
              <span className={styles.metaDetailKey}>Organización</span>
              <span className={styles.metaDetailVal} data-testid="project-view-meta-organization-name-details">
                {organizationDisplayName}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card padding="default" className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Descripción</div>
        <p className={styles.readBody}>{projectData.description || "—"}</p>
      </Card>

      {renderCriteriaList("Criterios de aceptación", projectData.acceptance_criteria)}
      {renderCriteriaList("Criterios de implementación", projectData.implementation_criteria)}

      <div className={styles.quickLinks}>
        <span className={styles.quickLabel}>Accesos rápidos</span>
        <div className={styles.quickRow}>
          <Button variant="outline" type="button" onClick={onNavigateFeatures}>
            Features
          </Button>
          <Button variant="outline" type="button" disabled title="Próximamente">
            Repositorio
          </Button>
          <Button variant="outline" type="button" disabled title="Próximamente">
            Deliveries
          </Button>
          <Button variant="outline" type="button" disabled title="Próximamente">
            Work orders
          </Button>
          <Button variant="outline" type="button" onClick={onNavigateSprints}>
            Sprints
          </Button>
          <Button variant="outline" type="button" onClick={onNavigateIncidents}>
            Incidentes
          </Button>
          {canReleases ? (
            <Button variant="outline" type="button" onClick={onNavigateReleases}>
              Releases
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
