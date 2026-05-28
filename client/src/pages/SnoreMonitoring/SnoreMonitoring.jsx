import styles from "./SnoreMonitoring.module.css";
import { motion, AnimatePresence } from "framer-motion";

// Components
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StatusPill from "@/components/SnoreMonitoring/StatusPill";
import ElapsedTimer from "@/components/SnoreMonitoring/ElapsedTimer";
import StatsBar from "@/components/SnoreMonitoring/StatsBar";
import ActionButtonContent from "@/components/SnoreMonitoring/ActionButtonContent";

import { useSnoreMonitoring } from "@/hooks/SnoreMonitoring/useSnoreMonitoring";
import { MONITORING_STATUS, STATUS_CONFIG } from "@/constants/monitoring.js";

/**
 * 코골이 모니터링 페이지 컴포넌트
 * 마이크를 통해 실시간으로 오디오를 녹음하고 AI 모델을 통해 코골이를 감지합니다.
 * 감지된 결과에 따라 사용자 설정에 맞는 알람을 발생시킵니다.
 */
const SnoreMonitoring = () => {
  const {
    monitoringStatus,
    snoreDetections,
    isCooldown,
    isLoading,
    user,
    handleToggleMonitoring,
    handleToggleCooldown,
  } = useSnoreMonitoring();

  const currentStatus = STATUS_CONFIG[monitoringStatus];
  const isRunning = monitoringStatus === MONITORING_STATUS.RUNNING;
  const isFinishing = monitoringStatus === MONITORING_STATUS.FINISHING;
  const shouldShowTimer =
    monitoringStatus !== MONITORING_STATUS.FINISHING &&
    monitoringStatus !== MONITORING_STATUS.STOPPED;
  const actionButtonClassName =
    isRunning || isFinishing ? styles.stopAction : styles.startAction;

  return (
    <main className={styles.screen}>
      <section className={styles.monitorShell}>
        <div className={styles.cooldownWrapper}>
          <AnimatePresence>
            {isCooldown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={styles.cooldownBanner}
              >
                ⏳ 알람 쿨다운 작동 중 (30분간 방해금지)
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.orb} onClick={handleToggleCooldown}>
          <StatusPill text={currentStatus.text} active={isRunning} />

          <AnimatePresence mode="wait">
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

      {isLoading && <LoadingSpinner />}
    </main>
  );
};

export default SnoreMonitoring;
