/**
 * ----
 * Modulo: LoadingSpinner
 * Descripcion: Indicador de carga consistente para dominio Project.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-26
 * ----
 */
export default function LoadingSpinner({ show }) {
  if (!show) return null;
  return <div className="text-muted">Cargando...</div>;
}
