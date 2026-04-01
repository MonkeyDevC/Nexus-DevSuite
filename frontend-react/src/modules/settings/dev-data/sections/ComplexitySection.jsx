import { FormSection } from "../../../../design-system/patterns/FormSection/FormSection.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import panelStyles from "../DevDataSettingsPanel.module.css";
import RangeField from "../ui/RangeField/RangeField.jsx";

function DistEditor({ label, value, keys, disabled, onChange }) {
  return (
    <div>
      <div className={panelStyles.metricLabel}>{label}</div>
      <div className={panelStyles.distGrid}>
        {keys.map((k) => (
          <RangeField
            key={k}
            label={k}
            min={0}
            max={100}
            step={1}
            unit="%"
            value={Number(value[k] ?? 0)}
            disabled={disabled}
            onChange={(n) => onChange(k, n)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{ config: object, disabled: boolean, onPatch: (patch: object) => void }} props
 */
export default function ComplexitySection({ config, disabled, onPatch }) {
  const cx = config.complexity || {};
  const text = cx.text || {};
  const cr = cx.criteria || {};
  const sd = cx.statusDistribution || {};
  const proj = sd.project || {};
  const feat = sd.feature || {};
  const story = sd.story || {};

  function patchStatus(path, key, n) {
    const nextSd = { ...sd };
    if (path === "project") nextSd.project = { ...proj, [key]: n };
    if (path === "feature") nextSd.feature = { ...feat, [key]: n };
    if (path === "story") nextSd.story = { ...story, [key]: n };
    onPatch({ complexity: { ...cx, statusDistribution: nextSd } });
  }

  return (
    <FormSection
      title="Complejidad"
      description="Longitudes de texto, recuentos de criterios y distribución de estados (se renorma al guardar)."
    >
      <div className={panelStyles.twoCol}>
        <Input
          label="Título mín (car)"
          type="number"
          min={1}
          value={String(text.titleMinLen ?? 1)}
          disabled={disabled}
          onChange={(e) => onPatch({ complexity: { ...cx, text: { ...text, titleMinLen: Number(e.target.value) || 1 } } })}
        />
        <Input
          label="Título máx (car)"
          type="number"
          min={1}
          value={String(text.titleMaxLen ?? 1)}
          disabled={disabled}
          onChange={(e) => onPatch({ complexity: { ...cx, text: { ...text, titleMaxLen: Number(e.target.value) || 1 } } })}
        />
        <Input
          label="Descripción mín (car)"
          type="number"
          min={1}
          value={String(text.descriptionMinLen ?? 1)}
          disabled={disabled}
          onChange={(e) =>
            onPatch({ complexity: { ...cx, text: { ...text, descriptionMinLen: Number(e.target.value) || 1 } } })
          }
        />
        <Input
          label="Descripción máx (car)"
          type="number"
          min={1}
          value={String(text.descriptionMaxLen ?? 1)}
          disabled={disabled}
          onChange={(e) =>
            onPatch({ complexity: { ...cx, text: { ...text, descriptionMaxLen: Number(e.target.value) || 1 } } })
          }
        />
      </div>
      <div className={panelStyles.twoCol}>
        <RangeField
          label="Criterios aceptación (proyecto)"
          min={0}
          max={50}
          step={1}
          value={Number(cr.projectAcceptanceCriteriaCount ?? 0)}
          disabled={disabled}
          onChange={(n) =>
            onPatch({
              complexity: { ...cx, criteria: { ...cr, projectAcceptanceCriteriaCount: n } },
            })
          }
        />
        <RangeField
          label="Criterios implementación (proyecto)"
          min={0}
          max={50}
          step={1}
          value={Number(cr.projectImplementationCriteriaCount ?? 0)}
          disabled={disabled}
          onChange={(n) =>
            onPatch({
              complexity: {
                ...cx,
                criteria: { ...cr, projectImplementationCriteriaCount: n },
              },
            })
          }
        />
        <RangeField
          label="Criterios aceptación (feature)"
          min={0}
          max={50}
          step={1}
          value={Number(cr.featureAcceptanceCriteriaCount ?? 0)}
          disabled={disabled}
          onChange={(n) =>
            onPatch({
              complexity: { ...cx, criteria: { ...cr, featureAcceptanceCriteriaCount: n } },
            })
          }
        />
        <RangeField
          label="Criterios implementación (feature)"
          min={0}
          max={50}
          step={1}
          value={Number(cr.featureImplementationCriteriaCount ?? 0)}
          disabled={disabled}
          onChange={(n) =>
            onPatch({
              complexity: {
                ...cx,
                criteria: { ...cr, featureImplementationCriteriaCount: n },
              },
            })
          }
        />
        <RangeField
          label="Criterios aceptación (historia)"
          min={0}
          max={50}
          step={1}
          value={Number(cr.storyAcceptanceCriteriaCount ?? 0)}
          disabled={disabled}
          onChange={(n) =>
            onPatch({
              complexity: { ...cx, criteria: { ...cr, storyAcceptanceCriteriaCount: n } },
            })
          }
        />
        <RangeField
          label="Criterios implementación (historia)"
          min={0}
          max={50}
          step={1}
          value={Number(cr.storyImplementationCriteriaCount ?? 0)}
          disabled={disabled}
          onChange={(n) =>
            onPatch({
              complexity: {
                ...cx,
                criteria: { ...cr, storyImplementationCriteriaCount: n },
              },
            })
          }
        />
        <Input
          label="Item criterio mín (car)"
          type="number"
          min={1}
          value={String(cr.criteriaItemMinLen ?? 1)}
          disabled={disabled}
          onChange={(e) =>
            onPatch({ complexity: { ...cx, criteria: { ...cr, criteriaItemMinLen: Number(e.target.value) || 1 } } })
          }
        />
        <Input
          label="Item criterio máx (car)"
          type="number"
          min={1}
          value={String(cr.criteriaItemMaxLen ?? 1)}
          disabled={disabled}
          onChange={(e) =>
            onPatch({ complexity: { ...cx, criteria: { ...cr, criteriaItemMaxLen: Number(e.target.value) || 1 } } })
          }
        />
      </div>
      <div className={panelStyles.sectionStack}>
        <DistEditor
          label="Proyecto (%)"
          value={proj}
          keys={["ACTIVE", "ARCHIVED"]}
          disabled={disabled}
          onChange={(k, n) => patchStatus("project", k, n)}
        />
        <DistEditor
          label="Feature (%)"
          value={feat}
          keys={["DRAFT", "APPROVED", "IN_PROGRESS", "DONE", "ARCHIVED"]}
          disabled={disabled}
          onChange={(k, n) => patchStatus("feature", k, n)}
        />
        <DistEditor
          label="Historia (%)"
          value={story}
          keys={["DRAFT", "READY", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"]}
          disabled={disabled}
          onChange={(k, n) => patchStatus("story", k, n)}
        />
      </div>
    </FormSection>
  );
}
