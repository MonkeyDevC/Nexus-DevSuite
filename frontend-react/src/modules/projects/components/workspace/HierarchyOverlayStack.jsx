import styles from "./HierarchyOverlayStack.module.css";

const DEPTH_CLASS = {
  0: styles.layerDepth0,
  1: styles.layerDepth1,
  2: styles.layerDepth2,
  3: styles.layerDepth3,
};

/**
 * Capa del stack jerárquico. Solo `isTop` recibe interacción (pointer-events).
 * @param {{ depth: 0 | 1 | 2 | 3, isTop: boolean, children: import('react').ReactNode, className?: string }} props
 */
export function HierarchyOverlayStackLayer({ depth, isTop, children, className = "" }) {
  const depthCls = DEPTH_CLASS[depth] ?? styles.layerDepth0;
  const rootClass = [styles.layer, depthCls, isTop ? styles.layerTop : styles.layerDimmed, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} data-stack-depth={String(depth)} data-stack-top={isTop ? "true" : "false"}>
      {children}
    </div>
  );
}

/**
 * Contenedor de escena: altura fija única para capas absolutas apiladas.
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function HierarchyOverlayStack({ children, className = "" }) {
  return <div className={[styles.scene, className].filter(Boolean).join(" ")}>{children}</div>;
}
