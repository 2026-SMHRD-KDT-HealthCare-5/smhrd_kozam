import { useState, useEffect } from "react";
import styles from "@/pages/SnoreMonitoring/SnoreMonitoring.module.css";

import { Waves } from "lucide-react";

import { formatTime } from "@/utils/common";

const ElapsedTimer = ({ isRunning }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  return (
    <div className={styles.elapsed}>
      {/* <Waves /> */}
      경과 시간
      <strong>{formatTime(seconds)}</strong>
    </div>
  );
};

export default ElapsedTimer;
