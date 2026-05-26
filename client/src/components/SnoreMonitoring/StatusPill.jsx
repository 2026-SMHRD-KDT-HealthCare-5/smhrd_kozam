import styles from "@/pages/SnoreMonitoring/SnoreMonitoring.module.css";

const StatusPill = ({ text, active }) => {
  const displayText = active ? text.replace("...", "") : text;

  return (
    <div className={styles.statusRow}>
      <span className={`${styles.pill} ${active ? styles.active : ""}`}>
        {/* <i /> */}
        {displayText}
        {active && <span className={styles.loadingDots}>...</span>}
      </span>
    </div>
  );
};

export default StatusPill;
