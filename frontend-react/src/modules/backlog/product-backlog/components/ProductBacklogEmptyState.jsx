import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { EmptyState } from "../../../../design-system/patterns/EmptyState/EmptyState.jsx";

/**
 * @param {"no_project"|"no_stories"|"filtered_empty"} props.variant
 * @param {() => void} [props.onPickProject]
 * @param {() => void} [props.onClearFilters]
 */
export default function ProductBacklogEmptyState({ variant, onPickProject, onClearFilters }) {
  if (variant === "no_project") {
    return (
      <EmptyState
        title="Selecciona un proyecto"
        description="El Product Backlog está asociado a un único proyecto. Usa el selector de la barra de herramientas para elegir uno y cargar features e historias."
        actions={
          onPickProject ? (
            <Button variant="primary" type="button" onClick={onPickProject}>
              Elegir proyecto
            </Button>
          ) : null
        }
      />
    );
  }
  if (variant === "filtered_empty") {
    return (
      <EmptyState
        title="Sin resultados"
        description="No hay historias que coincidan con los filtros o la búsqueda actuales."
        actions={
          onClearFilters ? (
            <Button variant="secondary" type="button" onClick={onClearFilters}>
              Limpiar filtros
            </Button>
          ) : null
        }
      />
    );
  }
  return (
    <EmptyState
      title="Sin historias en backlog"
      description="No hay historias visibles para este proyecto. Crea historias desde las features del proyecto o revisa permisos."
    />
  );
}
