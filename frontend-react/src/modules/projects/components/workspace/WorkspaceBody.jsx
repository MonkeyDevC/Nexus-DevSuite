import stack from "../../styles/projectDetailStack.module.css";

/**
 * Contenedor de cuerpo scrolleable del shell (misma región que `.body` del stack).
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function WorkspaceBody({ children, className = "" }) {
  return <div className={[stack.body, className].filter(Boolean).join(" ")}>{children}</div>;
}
