import { useId, useState } from "react";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import { Input } from "../../../design-system/components/Input/Input.jsx";
import { FormSection } from "../../../design-system/patterns/FormSection/FormSection.jsx";
import wave1 from "../../../shared/wave1/wave1Surfaces.module.css";

export default function FeatureCreateForm({ onCreated, disabled }) {
  const descId = useId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled || saving) return;
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) return;
    setSaving(true);
    try {
      await onCreated({ title: t, description: d });
      setTitle("");
      setDescription("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="feature-create-form" className={wave1.createFormWrap}>
      <FormSection title="Nueva feature" description="Título y descripción son obligatorios.">
        <Input
          label="Título"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          disabled={disabled || saving}
          maxLength={500}
        />
        <div className={wave1.formField}>
          <label className={wave1.fieldLabel} htmlFor={descId}>
            Descripción
          </label>
          <textarea
            id={descId}
            className={wave1.textarea}
            rows={3}
            value={description}
            onChange={(ev) => setDescription(ev.target.value)}
            disabled={disabled || saving}
          />
        </div>
      </FormSection>
      <div className={`${wave1.navRow} ${wave1.formActionsTopMargin}`}>
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || saving || !title.trim() || !description.trim()}
          loading={saving}
        >
          Crear
        </Button>
      </div>
    </form>
  );
}
