/**
 * Contratos del workspace jerárquico (JSDoc SSOT para shell, tabs y capas).
 * No runtime: solo documentación verificable por humanos y el IDE.
 */

/**
 * @typedef {0|1|2} WorkspaceStackDepth
 */

/**
 * @typedef {{ id: string, label: string, icon?: string }} WorkspaceTabDescriptor
 */

/**
 * @typedef {object} DetailWorkspaceShellProps
 * @property {import('react').ReactNode} header
 * @property {import('react').ReactNode} [chrome] — barra de tabs u otro chrome compartido
 * @property {import('react').ReactNode} children — cuerpo scrollable (WorkspaceBody interno)
 * @property {import('react').ReactNode} [footer]
 * @property {WorkspaceStackDepth} [depth]
 * @property {string} [rootDataTestId]
 * @property {string} [bodyClassName]
 * @property {string} [className]
 */

/**
 * @typedef {object} StackLayerContract
 * @property {WorkspaceStackDepth} depth
 * @property {boolean} isTop — solo la capa superior recibe pointer-events
 * @property {number} zIndex Tier visual (implementado en CSS del contenedor)
 */
