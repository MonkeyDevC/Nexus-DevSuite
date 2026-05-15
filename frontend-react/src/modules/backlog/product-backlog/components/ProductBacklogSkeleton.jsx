import styles from "../ProductBacklogPage.module.css";
import wave1 from "../../../../shared/wave1/wave1Surfaces.module.css";

export default function ProductBacklogSkeleton() {
  return (
    <div className={wave1.stack} data-testid="backlog-loading" aria-busy="true">
      <div className={styles.skeletonBlock} style={{ width: "40%" }} />
      <div className={styles.skeletonBlock} style={{ width: "100%" }} />
      <div className={styles.skeletonBlock} style={{ width: "92%" }} />
      <div className={styles.skeletonBlock} style={{ width: "88%" }} />
    </div>
  );
}
