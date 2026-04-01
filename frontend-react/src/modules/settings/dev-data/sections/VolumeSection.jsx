import { FormSection } from "../../../../design-system/patterns/FormSection/FormSection.jsx";
import panelStyles from "../DevDataSettingsPanel.module.css";
import RangeField from "../ui/RangeField/RangeField.jsx";
import {
  MAX_FEATURES_PER_PROJECT,
  MAX_INCIDENTS_PER_PROJECT,
  MAX_PROJECTS,
  MAX_SPRINTS_PER_PROJECT,
  MAX_STORIES_PER_FEATURE,
} from "../devDataLimits.js";

/**
 * @param {{ config: object, disabled: boolean, onPatch: (patch: object) => void }} props
 */
export default function VolumeSection({ config, disabled, onPatch }) {
  const v = config.volume || {};
  return (
    <FormSection
      title="Volumen"
      description="Objetivos de volumen. El import solo persiste proyectos, features e historias; sprints e incidentes son referencia de planificación."
    >
      <div className={panelStyles.volumeGrid}>
        <RangeField
          label="Proyectos"
          min={1}
          max={MAX_PROJECTS}
          step={1}
          value={Number(v.projects ?? 1)}
          disabled={disabled}
          hint={`Rango: 1–${MAX_PROJECTS}`}
          onChange={(n) => onPatch({ volume: { ...v, projects: n } })}
        />
        <RangeField
          label="Features por proyecto"
          min={0}
          max={MAX_FEATURES_PER_PROJECT}
          step={1}
          value={Number(v.featuresPerProject ?? 0)}
          disabled={disabled}
          hint={`Rango: 0–${MAX_FEATURES_PER_PROJECT}`}
          onChange={(n) => onPatch({ volume: { ...v, featuresPerProject: n } })}
        />
        <RangeField
          label="Historias por feature"
          min={0}
          max={MAX_STORIES_PER_FEATURE}
          step={1}
          value={Number(v.storiesPerFeature ?? 0)}
          disabled={disabled}
          hint={`Rango: 0–${MAX_STORIES_PER_FEATURE}`}
          onChange={(n) => onPatch({ volume: { ...v, storiesPerFeature: n } })}
        />
        <RangeField
          label="Sprints por proyecto (planificado)"
          min={0}
          max={MAX_SPRINTS_PER_PROJECT}
          step={1}
          value={Number(v.sprintsPerProject ?? 0)}
          disabled={disabled}
          hint={`Rango: 0–${MAX_SPRINTS_PER_PROJECT}`}
          onChange={(n) => onPatch({ volume: { ...v, sprintsPerProject: n } })}
        />
        <RangeField
          label="Incidentes por proyecto (planificado)"
          min={0}
          max={MAX_INCIDENTS_PER_PROJECT}
          step={1}
          value={Number(v.incidentsPerProject ?? 0)}
          disabled={disabled}
          hint={`Rango: 0–${MAX_INCIDENTS_PER_PROJECT}`}
          onChange={(n) => onPatch({ volume: { ...v, incidentsPerProject: n } })}
        />
      </div>
    </FormSection>
  );
}
