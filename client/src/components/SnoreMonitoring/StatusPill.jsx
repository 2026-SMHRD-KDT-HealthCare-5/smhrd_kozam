import styles from "@/pages/SnoreMonitoring/SnoreMonitoring.module.css";

const StatusPill = ({ text, active }) => {
  return (
    <div className={styles.statusRow}>
      <span className={`${styles.pill} ${active ? styles.active : ""}`}>
        <i />
        {text}
      </span>
    </div>
  );
};

export default StatusPill;
