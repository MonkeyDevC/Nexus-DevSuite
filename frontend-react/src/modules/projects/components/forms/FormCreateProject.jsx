/**
 * ----
 * Modulo: FormCreateProject
 * Descripcion: Formulario de alta Project con validacion minima de entrada.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-26
 * ----
 */
import { useState } from "react";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { Card } from "../../../../design-system/components/Card/Card.jsx";
import { Input } from "../../../../design-system/components/Input/Input.jsx";
import { Textarea } from "../../../../design-system/components/Textarea/Textarea.jsx";
import formStyles from "./formProjects.module.css";

/**
 * @param {{ onSubmit: (payload: { name: string, description: string }) => Promise<void>, busy?: boolean, embedded?: boolean, onCancel?: () => void }} props
 */
export default function FormCreateProject({ onSubmit, busy, embedded = false, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const normalized = name.trim().replace(/\s+/g, " ");
    if (!normalized) return;
    await onSubmit({ name: normalized, description });
    setName("");
    setDescription("");
  }

  const fields = (
    <>
      <Input
        label="Nombre"
        placeholder="Nombre"
        data-testid="project-create-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={255}
      />
      <Textarea
        label="Descripción"
        placeholder="Descripción"
        data-testid="project-create-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
    </>
  );

  const actions = (
    <div className={formStyles.rowActions}>
      {typeof onCancel === "function" ? (
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel} data-testid="project-create-cancel">
          Cancelar
        </Button>
      ) : null}
      <Button type="submit" variant="primary" disabled={busy} data-testid="project-create-submit">
        Crear
      </Button>
    </div>
  );

  if (embedded) {
    return (
      <form className={formStyles.stack} onSubmit={handleSubmit} data-testid="project-create-form">
        {fields}
        {actions}
      </form>
    );
  }

  return (
    <Card padding="default">
      <form className={formStyles.stack} onSubmit={handleSubmit} data-testid="project-create-form">
        <h2 className={formStyles.title}>Nuevo proyecto</h2>
        {fields}
        <div>{actions}</div>
      </form>
    </Card>
  );
}
