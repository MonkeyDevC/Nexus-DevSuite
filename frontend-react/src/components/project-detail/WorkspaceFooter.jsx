import stack from "../../pages/projectDetailStack.module.css";

/**
 * Pie del shell con estilo de barra fija compartida (`footerBar` del design stack).
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function WorkspaceFooter({ children, className = "" }) {
  return <footer className={[stack.footerBar, className].filter(Boolean).join(" ")}>{children}</footer>;
}
