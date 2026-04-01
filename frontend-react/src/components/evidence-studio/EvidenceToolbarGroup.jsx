import styles from "./EvidenceToolbarGroup.module.css";

export default function EvidenceToolbarGroup({ label, children }) {
  return (
    <div className={styles.group}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>{children}</div>
    </div>
  );
}
