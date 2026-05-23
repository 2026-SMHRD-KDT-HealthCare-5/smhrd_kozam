import { useRef, useState } from "react";
import styles from "./SnoreMonitoring.module.css";

import LoadingSpinner from "@/components/Common/LoadingSpinner";
import StatusPill from "@/components/SnoreMonitoring/StatusPill";
import ElapsedTimer from "@/components/SnoreMonitoring/ElapsedTimer";
import StatsBar from "@/components/SnoreMonitoring/StatsBar";
import ActionButtonContent from "@/components/SnoreMonitoring/ActionButtonContent";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { useAsync } from "@/hooks/useAsync";
import {
  createAlarmLog,
  createSnoreEvent,
  createSession,
  updateSession,
} from "@/api/monitoring";
import { MONITORING_STATUS, STATUS_CONFIG } from "@/constants/monitoring.js";

const SnoreMonitoring = () => {
  const { user } = useAuth();
  const { execute: createSessionAsync, isLoading } = useAsync(createSession);
  const { execute: updateSessionAsync } = useAsync(updateSession);
  // const { execute: createSnoreEventAsync } = useAsync(createSnoreEvent);
  // const { execute: createSnoreEventAsync } = useAsync(createAlarmLog);

  const [monitoringStatus, setMonitoringStatus] = useState(
    MONITORING_STATUS.IDLE,
  );
  const [snoreDetections, setSnoreDetections] = useState([]);

  const sessionIdRef = useRef(null);
  const reportIdRef = useRef(null);
  const snoreStreakRef = useRef(0);

  const currentStatus = STATUS_CONFIG[monitoringStatus];
  const isRunning = monitoringStatus === MONITORING_STATUS.RUNNING;
  const isFinishing = monitoringStatus === MONITORING_STATUS.FINISHING;
  const shouldShowTimer =
    monitoringStatus !== MONITORING_STATUS.FINISHING &&
    monitoringStatus !== MONITORING_STATUS.STOPPED;

  const actionButtonClassName =
    isRunning || isFinishing ? styles.stopAction : styles.startAction;

  const startSession = async () => {
    const data = await createSessionAsync({ startedAt: new Date() });

    if (!data.success) return;

    sessionIdRef.current = data.sessionId;
    setMonitoringStatus(MONITORING_STATUS.RUNNING);
  };

  const stopSession = async () => {
    setMonitoringStatus(MONITORING_STATUS.FINISHING);

    const data = await updateSessionAsync(sessionIdRef.current, {
      endedAt: new Date(),
    });

    if (!data.success) return;

    reportIdRef.current = data.reportId;
    setMonitoringStatus(MONITORING_STATUS.STOPPED);
  };

  const handleToggleMonitoring = async () => {
    switch (monitoringStatus) {
      case MONITORING_STATUS.IDLE:
        await startSession();
        break;

      case MONITORING_STATUS.RUNNING:
        stopSession();
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
      {isLoading && <LoadingSpinner />}
      <section className={styles.monitorShell}>
        <StatusPill text={currentStatus.text} active={isRunning} />

        <div className={styles.orb}>
          <AnimatePresence>
            <motion.div
              key={monitoringStatus}
              className={`${styles.panda} ${styles.pandaStart}`}
              style={{ x: "-50%" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{
                scale: 1.03,
                y: -8,
                cursor: "pointer",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                opacity: { duration: 0.2 },
              }}
            >
              <img
                src={currentStatus.image}
                alt={`${monitoringStatus} panda`}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </motion.div>
          </AnimatePresence>

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
            disabled={isFinishing || isLoading}
          >
            <ActionButtonContent config={currentStatus.button} />
          </button>
        </div>
      </section>
    </main>
  );
};

export default SnoreMonitoring;
