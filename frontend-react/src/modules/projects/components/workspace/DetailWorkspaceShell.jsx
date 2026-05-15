/**
 * Shell maestro único del detalle jerárquico (Project / Feature / Story).
 * Slots: header, chrome (tabs), body scrollable, footer opcional.
 */
import stack from "../../styles/projectDetailStack.module.css";
import depthStyles from "./DetailWorkspaceShell.module.css";
import { WorkspaceBody } from "./WorkspaceBody.jsx";

const DEPTH_SHADOW = {
  1: depthStyles.depthShadow1,
  2: depthStyles.depthShadow2,
  3: depthStyles.depthShadow3,
};

/**
 * @param {import('./workspaceShellContracts.js').DetailWorkspaceShellProps} props
 */
export function DetailWorkspaceShell({
  header,
  chrome = null,
  children,
  footer = null,
  depth = 0,
  rootDataTestId,
  bodyClassName = "",
  className = "",
}) {
  const shadowCls = depth > 0 ? DEPTH_SHADOW[depth] ?? "" : "";
  const rootClass = [stack.card, stack.cardStackLayer, shadowCls, className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} data-detail-workspace-depth={String(depth)} data-testid={rootDataTestId}>
      {header ? <div className={stack.stackHeader}>{header}</div> : null}
      {chrome}
      <WorkspaceBody className={bodyClassName}>{children}</WorkspaceBody>
      {footer}
    </div>
  );
}
