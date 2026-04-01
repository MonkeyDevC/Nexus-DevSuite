import { FormSection } from "../../../../design-system/patterns/FormSection/FormSection.jsx";
import panelStyles from "../DevDataSettingsPanel.module.css";
import RangeField from "../ui/RangeField/RangeField.jsx";
import { MIN_AUTO_RESET_INTERVAL_MINUTES } from "../devDataLimits.js";

const INTERVAL_SLIDER_MAX_MINUTES = 24 * 60;

function formatLastRun(feedback) {
  if (!feedback || !feedback.lastRunAt) return "—";
  const when = new Date(feedback.lastRunAt);
  if (Number.isNaN(when.getTime())) return "—";
  const rel = Date.now() - when.getTime();
  const mins = Math.max(0, Math.round(rel / 60000));
  const status = feedback.lastRunStatus === "success" ? "OK" : feedback.lastRunStatus === "error" ? "Error" : "—";
  return `${status} · hace ${mins} min`;
}

/**
 * @param {{
 *   config: object,
 *   disabled: boolean,
 *   onPatch: (patch: object) => void,
 *   feedback?: object,
 * }} props
 */
export default function AutoResetSection({ config, disabled, onPatch, feedback }) {
  const ar = config.autoReset || {};
  const enabled = Boolean(ar.enabled);
  const interval = Math.max(0, Number(ar.intervalMinutes) || 0);

  const intervalHint =
    enabled && interval > 0
      ? `Mínimo efectivo con auto-reset activo: ${MIN_AUTO_RESET_INTERVAL_MINUTES} min (normalizado al guardar).`
      : "0 = sin intervalo (aunque el switch esté activo).";

  return (
    <FormSection
      title="Auto-reset"
      description="Solo ejecuta reset periódico (nunca generación). Requiere DEV_DATA_RESET_ENABLED en backend y rol MASTER."
    >
      <div className={panelStyles.autoResetHeader}>
        <div className={panelStyles.switchRow}>
          <span className={panelStyles.switchLabel} id="dev-data-auto-reset-label">
            Habilitar auto-reset
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-labelledby="dev-data-auto-reset-label"
            disabled={disabled}
            className={[panelStyles.switch, enabled ? panelStyles.switchOn : ""].filter(Boolean).join(" ")}
            onClick={() => onPatch({ autoReset: { ...ar, enabled: !enabled } })}
          >
            <span className={panelStyles.srOnly}>{enabled ? "Activado" : "Desactivado"}</span>
            <span className={panelStyles.switchKnob} aria-hidden />
          </button>
        </div>
        <div className={panelStyles.autoResetMeta}>
          <span>
            Última ejecución scheduler/UI: <strong>{formatLastRun(feedback)}</strong>
          </span>
          <span>
            Intervalo objetivo:{" "}
            <strong>
              {enabled && interval > 0 ? `cada ${interval} min` : "—"}
            </strong>
          </span>
        </div>
      </div>

      <RangeField
        label="Intervalo (minutos)"
        min={0}
        max={INTERVAL_SLIDER_MAX_MINUTES}
        step={1}
        value={interval}
        disabled={disabled || !enabled}
        hint={intervalHint}
        onChange={(n) => onPatch({ autoReset: { ...ar, intervalMinutes: n } })}
      />

      <p className={panelStyles.hint}>runOnAppStart está reservado para versiones futuras y no se expone en v1.</p>
    </FormSection>
  );
}
