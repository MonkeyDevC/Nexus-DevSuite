import { FormSection } from "../../../../design-system/patterns/FormSection/FormSection.jsx";
import panelStyles from "../DevDataSettingsPanel.module.css";
import { PRESET_IDS } from "../presets.js";

const TILES = {
  balanced: { kicker: "Recomendado", title: "Equilibrado", hint: "Volumen por defecto, buen punto de partida." },
  small: { kicker: "Rápido", title: "Pequeño", hint: "Pocas entidades para pruebas locales." },
  large: { kicker: "Escala", title: "Grande", hint: "Mayor volumen; revisar confirmaciones por carga." },
  edge: { kicker: "Límite", title: "Alto volumen", hint: "Cerca de umbrales; puede requerir confirmación extra." },
};

/**
 * @param {{ disabled: boolean, onApplyPreset: (id: string) => void }} props
 */
export default function PresetsSection({ disabled, onApplyPreset }) {
  return (
    <FormSection
      title="Presets"
      description="Cada tile sobrescribe la configuración completa (sin merge parcial)."
    >
      <div className={panelStyles.presetGrid}>
        {PRESET_IDS.map((id) => {
          const tile = TILES[id] || { kicker: "Preset", title: id, hint: "" };
          return (
            <button
              key={id}
              type="button"
              className={panelStyles.presetTile}
              disabled={disabled}
              onClick={() => onApplyPreset(id)}
            >
              <span className={panelStyles.presetTileKicker}>{tile.kicker}</span>
              <span className={panelStyles.presetTileTitle}>{tile.title}</span>
              {tile.hint ? <span className={panelStyles.presetTileHint}>{tile.hint}</span> : null}
            </button>
          );
        })}
      </div>
    </FormSection>
  );
}
