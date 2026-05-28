import styles from "@/pages/SnoreMonitoring/SnoreMonitoring.module.css";
import { Mic, ShieldCheck } from "lucide-react";
import { ALARM_CONDITION_TEXT } from "@/constants/monitoring";

const StatsBar = ({ snoreCount, alarmCondition }) => {
  return (
    <div className={styles.statsBar}>
      <div>
        <span className={styles.statsLabel}>
          <Mic />
          코골이 감지
        </span>
        <strong>
          {snoreCount}
          <small>회</small>
        </strong>
      </div>

      <div>
        <ShieldCheck />
        알람 조건
        <strong>{ALARM_CONDITION_TEXT[alarmCondition]}</strong>
      </div>
    </div>
  );
};

export default StatsBar;
