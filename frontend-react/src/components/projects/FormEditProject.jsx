/**
 * ----
 * Modulo: FormEditProject
 * Descripcion: Edicion de Project con expected_version para concurrencia optimista.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-26
 * ----
 */
import { useState } from "react";
import { Button } from "../../design-system/components/Button/Button.jsx";
import { Input } from "../../design-system/components/Input/Input.jsx";
import { Textarea } from "../../design-system/components/Textarea/Textarea.jsx";
import formStyles from "./formProjects.module.css";

export default function FormEditProject({ project, onSave, busy }) {
  const [name, setName] = useState(project ? project.name : "");
  const [description, setDescription] = useState(project ? project.description || "" : "");

  if (!project) return null;

  async function submit(event) {
    event.preventDefault();
    const normalized = name.trim().replace(/\s+/g, " ");
    if (!normalized) return;
    await onSave({
      name: normalized,
      description,
      expected_version: project.version,
    });
  }

  return (
    <form className={formStyles.stack} onSubmit={submit} data-testid="project-edit-form">
      <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} data-testid="project-edit-name" />
      <Textarea label="Descripción" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} data-testid="project-edit-description" />
      <div className={formStyles.rowActions}>
        <Button variant="primary" type="submit" disabled={busy} data-testid="project-edit-submit">
          Guardar
        </Button>
      </div>
    </form>
  );
}
