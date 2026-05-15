/**
 * Formulario de alta de feature (modal embebido), alineado a FormCreateProject.
 */
import { useState } from "react";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import { Textarea } from "../../../../design-system/components/Textarea/Textarea.jsx";
import formStyles from "../../../projects/components/forms/formProjects.module.css";

/**
 * @param {{ onSubmit: (payload: { title: string, description: string }) => Promise<void>, busy?: boolean, embedded?: boolean, onCancel?: () => void }} props
 */
export default function FormCreateFeature({ onSubmit, busy, embedded = false, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) return;
    await onSubmit({ title: t, description: d });
    setTitle("");
    setDescription("");
  }

  const fields = (
    <>
      <Input
        label="Título"
        placeholder="Título"
        data-testid="feature-create-name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={500}
      />
      <Textarea
        label="Descripción"
        placeholder="Descripción"
        data-testid="feature-create-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
    </>
  );

  const actions = (
    <div className={formStyles.rowActions}>
      {typeof onCancel === "function" ? (
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel} data-testid="feature-create-cancel">
          Cancelar
        </Button>
      ) : null}
      <Button type="submit" variant="primary" disabled={busy} data-testid="feature-create-submit">
        Crear
      </Button>
    </div>
  );

  if (embedded) {
    return (
      <form className={formStyles.stack} onSubmit={handleSubmit} data-testid="feature-create-form">
        {fields}
        {actions}
      </form>
    );
  }

  return (
    <form className={formStyles.stack} onSubmit={handleSubmit} data-testid="feature-create-form">
      {fields}
      <div>{actions}</div>
    </form>
  );
}
