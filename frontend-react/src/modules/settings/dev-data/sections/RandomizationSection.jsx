import { RefreshCw } from "lucide-react";
import { FormSection } from "../../../../design-system/patterns/FormSection/FormSection.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import panelStyles from "../DevDataSettingsPanel.module.css";
import RangeField from "../ui/RangeField/RangeField.jsx";

function newSeedString() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `seed-${crypto.randomUUID()}`;
  }
  return `seed-${Date.now()}`;
}

/**
 * @param {{ config: object, disabled: boolean, onPatch: (patch: object) => void }} props
 */
export default function RandomizationSection({ config, disabled, onPatch }) {
  const rnd = config.randomness || {};
  return (
    <FormSection
      title="Aleatoriedad controlada"
      description="Misma semilla + misma configuración → mismo payload. Jitter afecta longitudes de texto."
    >
      <div className={panelStyles.seedRow}>
        <Input
          label="Semilla (seed)"
          value={String(rnd.seed ?? "")}
          disabled={disabled}
          onChange={(e) => onPatch({ randomness: { ...rnd, seed: e.target.value } })}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          aria-label="Generar nueva semilla"
          title="Nueva semilla"
          onClick={() => onPatch({ randomness: { ...rnd, seed: newSeedString() } })}
        >
          <RefreshCw size={18} aria-hidden />
        </Button>
      </div>
      <RangeField
        label="Jitter"
        min={0}
        max={50}
        step={1}
        unit="%"
        value={Number(rnd.jitterPct ?? 0)}
        disabled={disabled}
        hint="Rango: 0–50%"
        onChange={(n) => onPatch({ randomness: { ...rnd, jitterPct: n } })}
      />
      <p className={panelStyles.hint}>Modo determinista activo (contrato v1).</p>
    </FormSection>
  );
}
