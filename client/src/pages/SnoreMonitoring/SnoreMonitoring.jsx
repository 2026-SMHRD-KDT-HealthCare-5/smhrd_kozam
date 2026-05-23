import startPanda from "@/assets/images/startPanda.png";
import idlePanda from "@/assets/images/idlePanda.png";
import styles from "./SnoreMonitoring.module.css";
import { Waves, Moon, Square, ShieldCheck, Mic } from "lucide-react";
import { useEffect, useState } from "react";
import { formatTime } from "client/src/utils/common";

const SnoreMonitoring = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [reportData, setReportData] = useState({});

  return (
    <main className={styles.screen}>
      <section className={styles.monitorShell}>
        <div className={styles.statusRow}>
          <span className={`${styles.pill} ${isRunning && styles.active}`}>
            <i />
            {isRunning ? "모니터링중" : "모니터링 준비 완료"}
          </span>
        </div>
        <div className={styles.orb}>
          <img
            className={`${styles.panda} ${styles.pandaStart}`}
            src={isRunning ? startPanda : idlePanda}
            alt="잠자는 판다"
          />
          <div className={styles.elapsed}>
            <Waves />
            경과 시간
            <Timer isRunning={isRunning} />
          </div>
        </div>
        <StatsBar />
        <div className={styles.controlPanel}>
          <button
            className={isRunning ? styles.stopAction : styles.startAction}
            onClick={(e) => {
              e.preventDefault();
              setIsRunning(!isRunning);

              if (isRunning) {
                // 코골이 감지 횟수,
              }
            }}
          >
            {isRunning ? <Square /> : <Moon />}
            모니터링 {isRunning ? "종료" : "시작"}
            <small>
              {isRunning ? "측정을 중지해요" : "수면 분석을 시작해요"}
            </small>
          </button>
        </div>
      </section>
    </main>
  );
};

const Timer = ({ isRunning }) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  return <strong>{formatTime(seconds)}</strong>;
};

const StatsBar = () => {
  return (
    <div className={styles.statsBar}>
      <div>
        <Mic />
        코골이 감지
        <strong>
          12<small>회</small>
        </strong>
      </div>
      <div>
        <ShieldCheck />
        알람 상태<strong>꺼짐</strong>
      </div>
    </div>
  );
};

export default SnoreMonitoring;
