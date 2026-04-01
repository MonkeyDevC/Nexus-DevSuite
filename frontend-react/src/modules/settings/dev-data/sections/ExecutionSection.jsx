import { Layers, Rocket, RotateCcw } from "lucide-react";
import { FormSection } from "../../../../design-system/patterns/FormSection/FormSection.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { StatCard, StatCardGrid } from "../../../../design-system/patterns/StatCard/StatCard.jsx";
import panelStyles from "../DevDataSettingsPanel.module.css";
import { computeVolumeTotals } from "../devDataLimits.js";

/**
 * @param {{
 *   config: object,
 *   preview: object,
 *   disabled: boolean,
 *   busy: boolean,
 *   blocked: boolean,
 *   onPatch: (patch: object) => void,
 *   onReset: () => void,
 *   onGenerate: () => void,
 *   onResetThenGenerate: () => void,
 * }} props
 */
export default function ExecutionSection({
  config,
  preview,
  disabled,
  busy,
  blocked,
  onPatch,
  onReset,
  onGenerate,
  onResetThenGenerate,
}) {
  const ex = config.execution || {};
  const load = preview?.estimatedLoad;
  const loadLabel = load === "low" ? "Baja" : load === "medium" ? "Media" : load === "high" ? "Alta" : "—";

  const totals = preview?.totals || {};
  const volume = config.volume || {};
  const { totalFeatures, totalStories } = computeVolumeTotals(volume);
  const plannedEntities =
    Number(totalFeatures) + Number(totalStories) + Number(totals.sprints ?? 0) + Number(totals.incidents ?? 0);

  return (
    <FormSection
      title="Ejecución"
      description="Generate envía import. Reset borra data dummy. Reset+Generate detiene el flujo si falla el reset."
    >
      <div className={panelStyles.twoCol}>
        <label className={panelStyles.checkboxRow}>
          <input
            type="checkbox"
            checked={ex.requireConfirmOnMedium !== false}
            disabled={disabled || busy}
            onChange={(e) =>
              onPatch({ execution: { ...ex, requireConfirmOnMedium: e.target.checked } })
            }
          />
          <span>Confirmar si carga estimada es media (&gt;500 historias)</span>
        </label>
        <label className={panelStyles.checkboxRow}>
          <input
            type="checkbox"
            checked={ex.requireConfirmOnHigh !== false}
            disabled={disabled || busy}
            onChange={(e) =>
              onPatch({ execution: { ...ex, requireConfirmOnHigh: e.target.checked } })
            }
          />
          <span>Confirmar si carga estimada es alta (&gt;1000 historias)</span>
        </label>
      </div>

      <div className={panelStyles.executionActions}>
        <div className={panelStyles.executionPrimaryRow}>
          <Button
            type="button"
            variant="primary"
            fullWidth
            disabled={disabled || busy || blocked}
            onClick={onGenerate}
          >
            <Rocket size={18} aria-hidden />
            {busy ? "Ejecutando…" : "Generate"}
          </Button>
          <Button type="button" variant="secondary" fullWidth disabled={disabled || busy} onClick={onReset}>
            <RotateCcw size={18} aria-hidden />
            {busy ? "Ejecutando…" : "Reset"}
          </Button>
        </div>
        <Button
          type="button"
          variant="danger"
          fullWidth
          disabled={disabled || busy || blocked}
          onClick={onResetThenGenerate}
        >
          <Layers size={18} aria-hidden />
          {busy ? "Ejecutando…" : "Reset + Generate"}
        </Button>
      </div>

      <div className={panelStyles.previewBox} data-testid="dev-data-preview">
        <div className={panelStyles.metricLabel}>Vista previa (determinista)</div>
        <StatCardGrid className={panelStyles.statCardTight}>
          <StatCard label="Entidades plan (~)" value={`${plannedEntities}+`} variant="neutral" />
          <StatCard label="Historias" value={String(totals.stories ?? "—")} variant="neutral" />
          <StatCard label="Carga estimada" value={loadLabel} variant="primary" />
          <StatCard
            label="Estado"
            value={blocked ? "Bloqueado" : "Listo"}
            variant={blocked ? "danger" : "success"}
            hint={blocked ? "Supera 2000 historias" : "Puede ejecutar acciones"}
          />
        </StatCardGrid>
        <div className={panelStyles.loadBadge}>
          {blocked ? <span className={panelStyles.metricLabel}>Generate deshabilitado por volumen</span> : null}
        </div>
        {Array.isArray(preview?.notes) && preview.notes.length > 0 ? (
          <ul className={panelStyles.notesList}>
            {preview.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </FormSection>
  );
}
