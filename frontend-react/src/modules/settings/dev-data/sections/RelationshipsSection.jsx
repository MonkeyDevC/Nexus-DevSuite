import { FormSection } from "../../../../design-system/patterns/FormSection/FormSection.jsx";
import panelStyles from "../DevDataSettingsPanel.module.css";

/**
 * @param {{ config: object, disabled: boolean, onPatch: (patch: object) => void }} props
 */
export default function RelationshipsSection({ config, disabled, onPatch }) {
  const rel = config.relationships || {};
  return (
    <FormSection
      title="Relaciones"
      description="En import v1, sprint_id y asignaciones permanecen null (sin IDs reales). Los flags quedan preparados para evolución."
    >
      <label className={panelStyles.checkboxRow}>
        <input
          type="checkbox"
          checked={Boolean(rel.linkStoriesToSprints)}
          disabled={disabled}
          onChange={(e) => onPatch({ relationships: { ...rel, linkStoriesToSprints: e.target.checked } })}
        />
        <span>Vincular historias a sprints (payload: sprint_id null en v1)</span>
      </label>
      <label className={panelStyles.checkboxRow}>
        <input
          type="checkbox"
          checked={Boolean(rel.linkFeaturesToReleases)}
          disabled={disabled}
          onChange={(e) => onPatch({ relationships: { ...rel, linkFeaturesToReleases: e.target.checked } })}
        />
        <span>Vincular features a releases (no soportado por import actual)</span>
      </label>
      <label className={panelStyles.checkboxRow}>
        <input
          type="checkbox"
          checked={Boolean(rel.assignStoryAssignees)}
          disabled={disabled}
          onChange={(e) => onPatch({ relationships: { ...rel, assignStoryAssignees: e.target.checked } })}
        />
        <span>Asignar historias (requiere UUID de usuario; v1 → null)</span>
      </label>
    </FormSection>
  );
}
