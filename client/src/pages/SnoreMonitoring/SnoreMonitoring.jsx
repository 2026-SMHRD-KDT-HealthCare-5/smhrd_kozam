import idlePanda from "@/assets/images/idlePanda.png";
import runningPanda from "@/assets/images/startPanda.png";
import finishingPanda from "@/assets/images/thinkingPanda.png";
import stoppedPanda from "@/assets/images/happyPanda.png";

import styles from "./SnoreMonitoring.module.css";

import { Waves, Moon, Sun, Square, ShieldCheck, Mic } from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { formatTime } from "client/src/utils/common";
import { useAuth } from "client/src/hooks/useAuth";

const MONITORING_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  FINISHING: "finishing",
  STOPPED: "stopped",
};

const STATUS_CONFIG = {
  [MONITORING_STATUS.IDLE]: {
    text: "모니터링 준비 완료",
    image: idlePanda,
    button: {
      label: "모니터링 시작",
      description: "클릭하고 수면 분석을 시작해요",
      icon: Moon,
    },
  },

  [MONITORING_STATUS.RUNNING]: {
    text: "모니터링중",
    image: runningPanda,
    button: {
      label: "모니터링 중지",
      description: "클릭하고 모니터링을 종료해요",
      icon: Square,
    },
  },

  [MONITORING_STATUS.FINISHING]: {
    text: "오늘의 수면 AI 분석중...",
    image: finishingPanda,
    button: {
      label: "수면 분석중...",
      description: "잠시만 기다려주시면 분석 결과가 나옵니다",
      icon: Square,
    },
  },

  [MONITORING_STATUS.STOPPED]: {
    text: "수면 분석 완료!",
    image: stoppedPanda,
    button: {
      label: "분석 결과 보러가기",
      description: "클릭하고 오늘의 수면 분석 결과를 확인해요",
      icon: Sun,
    },
  },
};

const ALARM_CONDITION_TEXT = {
  1: "지속시간 기반",
  2: "반복패턴 기반",
  3: "알람 받지 않음",
};

const SnoreMonitoring = () => {
  const { user } = useAuth();

  const [monitoringStatus, setMonitoringStatus] = useState(
    MONITORING_STATUS.IDLE,
  );

  const [snoreDetections, setSnoreDetections] = useState([]);

  const sessionIdRef = useRef(null);
  const snoreStreakRef = useRef(0);

  const currentStatus = STATUS_CONFIG[monitoringStatus];

  const isRunning = monitoringStatus === MONITORING_STATUS.RUNNING;

  const isFinishing = monitoringStatus === MONITORING_STATUS.FINISHING;

  const shouldShowTimer = useMemo(() => {
    return ![MONITORING_STATUS.FINISHING, MONITORING_STATUS.STOPPED].includes(
      monitoringStatus,
    );
  }, [monitoringStatus]);

  const actionButtonClassName =
    isRunning || isFinishing ? styles.stopAction : styles.startAction;

  const handleToggleMonitoring = () => {
    switch (monitoringStatus) {
      case MONITORING_STATUS.IDLE:
        setMonitoringStatus(MONITORING_STATUS.RUNNING);
        break;

      case MONITORING_STATUS.RUNNING:
        setMonitoringStatus(MONITORING_STATUS.FINISHING);

        setTimeout(() => {
          setMonitoringStatus(MONITORING_STATUS.STOPPED);
        }, 3000);

        break;

      case MONITORING_STATUS.STOPPED:
        // TODO: navigate("/history")
        break;

      default:
        break;
    }
  };

  return (
    <main className={styles.screen}>
      <section className={styles.monitorShell}>
        <StatusPill text={currentStatus.text} active={isRunning} />

        <div className={styles.orb}>
          <img
            className={`${styles.panda} ${styles.pandaStart}`}
            src={currentStatus.image}
            alt={`${monitoringStatus} panda`}
          />

          {shouldShowTimer && <ElapsedTimer isRunning={isRunning} />}
        </div>

        <StatsBar
          snoreCount={snoreDetections.length}
          alarmCondition={user?.alarmCondition}
        />

        <div className={styles.controlPanel}>
          <button
            className={actionButtonClassName}
            onClick={handleToggleMonitoring}
            disabled={isFinishing}
          >
            <ActionButtonContent config={currentStatus.button} />
          </button>
        </div>
      </section>
    </main>
  );
};

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

const ElapsedTimer = ({ isRunning }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  return (
    <div className={styles.elapsed}>
      <Waves />
      경과 시간
      <strong>{formatTime(seconds)}</strong>
    </div>
  );
};

const ActionButtonContent = ({ config }) => {
  const Icon = config.icon;

  return (
    <>
      <Icon />
      {config.label}
      <small>{config.description}</small>
    </>
  );
};

const StatsBar = ({ snoreCount, alarmCondition }) => {
  return (
    <div className={styles.statsBar}>
      <div>
        <Mic />
        코골이 감지
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

export default SnoreMonitoring;
