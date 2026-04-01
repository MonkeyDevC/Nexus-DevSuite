import { FormSection } from "../../../../design-system/patterns/FormSection/FormSection.jsx";
import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import panelStyles from "../DevDataSettingsPanel.module.css";

const ACTION_LABEL = {
  none: "—",
  reset: "Reset manual",
  autoReset: "Auto-reset",
  generate: "Generate",
  resetThenGenerate: "Reset + Generate",
};

function feedbackBadgeVariant(status) {
  if (status === "success") return "success";
  if (status === "error") return "danger";
  return "neutral";
}

function buildConsoleLines(feedback) {
  const lines = [];
  const rawTs = feedback?.lastRunAt;
  const when = rawTs ? new Date(rawTs) : null;
  const ts =
    when && !Number.isNaN(when.getTime())
      ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : "—";
  const st = feedback?.lastRunStatus ?? "idle";
  const act = ACTION_LABEL[feedback?.lastAction] || feedback?.lastAction || "none";

  lines.push({ text: `[${ts}] Estado: ${st}`, muted: false });
  lines.push({ text: `[${ts}] Acción: ${act}`, muted: false });

  if (feedback?.lastSummary && typeof feedback.lastSummary === "object") {
    const s = feedback.lastSummary;
    lines.push({
      text: `[${ts}] Resumen → proyectos: ${s.projects_created ?? "—"}, features: ${s.features_created ?? "—"}, historias: ${s.stories_created ?? "—"}`,
      muted: true,
    });
    lines.push({
      text: `[${ts}] Nota: sprints/incident import N/A → ${s.sprints_created ?? 0} / ${s.incidents_created ?? 0}`,
      muted: true,
    });
  }

  if (Array.isArray(feedback?.phasesCompleted) && feedback.phasesCompleted.length > 0) {
    lines.push({
      text: `[${ts}] Fases: ${feedback.phasesCompleted.join(" → ")}`,
      muted: true,
    });
  }

  if (feedback?.lastError) {
    lines.push({ text: `[${ts}] ERROR: ${feedback.lastError}`, muted: false });
  }

  if (lines.length <= 2 && st === "idle") {
    lines.push({ text: "[—] Sin ejecuciones recientes en esta sesión.", muted: true });
  }

  return lines;
}

/**
 * @param {{ feedback: object }} props
 */
export default function FeedbackSection({ feedback }) {
  const action = ACTION_LABEL[feedback?.lastAction] || feedback?.lastAction || "—";
  const status = feedback?.lastRunStatus ?? "idle";
  const statusLabel =
    status === "success" ? "Éxito" : status === "error" ? "Error" : status === "idle" ? "Inactivo" : status;
  const phases =
    Array.isArray(feedback?.phasesCompleted) && feedback.phasesCompleted.length > 0
      ? feedback.phasesCompleted.join(" → ")
      : null;
  const summary = feedback?.lastSummary;
  const consoleLines = buildConsoleLines(feedback);

  return (
    <FormSection
      title="Última ejecución"
      description="Log compacto derivado del feedback atómico persistido (sin datos inventados)."
    >
      <div className={panelStyles.twoCol}>
        <div className={panelStyles.metric}>
          <span className={panelStyles.metricLabel}>Estado</span>
          <span className={panelStyles.metricValue}>
            <Badge variant={feedbackBadgeVariant(status)} appearance="light" data-testid="dev-data-feedback-status">
              {statusLabel}
            </Badge>
          </span>
        </div>
        <div className={panelStyles.metric}>
          <span className={panelStyles.metricLabel}>Acción</span>
          <span className={panelStyles.metricValueSmall}>{action}</span>
        </div>
        <div className={panelStyles.metric}>
          <span className={panelStyles.metricLabel}>Run ID</span>
          <span className={panelStyles.metricValueSmall}>{feedback?.lastRunId || "—"}</span>
        </div>
        <div className={panelStyles.metric}>
          <span className={panelStyles.metricLabel}>Marca de tiempo</span>
          <span className={panelStyles.metricValueSmall}>{feedback?.lastRunAt || "—"}</span>
        </div>
      </div>
      {phases ? (
        <p className={panelStyles.hint}>
          Fases completadas: <strong>{phases}</strong>
        </p>
      ) : null}
      {summary && typeof summary === "object" ? (
        <div className={panelStyles.previewBox}>
          <div className={panelStyles.metricLabel}>Resumen import</div>
          <div className={panelStyles.previewGrid}>
            <div className={panelStyles.metric}>
              <span className={panelStyles.metricLabel}>Proyectos</span>
              <span className={panelStyles.metricValue}>{summary.projects_created ?? "—"}</span>
            </div>
            <div className={panelStyles.metric}>
              <span className={panelStyles.metricLabel}>Features</span>
              <span className={panelStyles.metricValue}>{summary.features_created ?? "—"}</span>
            </div>
            <div className={panelStyles.metric}>
              <span className={panelStyles.metricLabel}>Historias</span>
              <span className={panelStyles.metricValue}>{summary.stories_created ?? "—"}</span>
            </div>
            <div className={panelStyles.metric}>
              <span className={panelStyles.metricLabel}>Sprints (N/A import)</span>
              <span className={panelStyles.metricValue}>{summary.sprints_created ?? 0}</span>
            </div>
            <div className={panelStyles.metric}>
              <span className={panelStyles.metricLabel}>Incidentes (N/A import)</span>
              <span className={panelStyles.metricValue}>{summary.incidents_created ?? 0}</span>
            </div>
          </div>
        </div>
      ) : null}
      {feedback?.lastPreview?.totals ? (
        <div className={panelStyles.previewBox}>
          <div className={panelStyles.metricLabel}>Preview en ejecución</div>
          <div className={panelStyles.previewGrid}>
            {Object.entries(feedback.lastPreview.totals).map(([k, v]) => (
              <div key={k} className={panelStyles.metric}>
                <span className={panelStyles.metricLabel}>{k}</span>
                <span className={panelStyles.metricValue}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className={panelStyles.metricLabel}>Registro</div>
      <pre className={panelStyles.feedbackConsole} data-testid="dev-data-feedback-console">
        {consoleLines.map((line, idx) => (
          <p
            key={`dev-data-log-${idx}`}
            className={[panelStyles.feedbackLine, line.muted ? panelStyles.feedbackLineMuted : ""]
              .filter(Boolean)
              .join(" ")}
          >
            {line.text}
          </p>
        ))}
      </pre>
    </FormSection>
  );
}
