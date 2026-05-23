import { useEffect, useRef, useState } from "react";
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
  predictSnore,
} from "@/api/monitoring";
import { MONITORING_STATUS, STATUS_CONFIG } from "@/constants/monitoring.js";
import { useAlarm } from "@/hooks/useAlarm";
import { decodeAudio, audioBufferToWav } from "@/utils/audioConverter";

const SnoreMonitoring = () => {
  const { user } = useAuth();
  const { execute: createSessionAsync, isLoading } = useAsync(createSession);
  const { execute: updateSessionAsync } = useAsync(updateSession);
  // const { execute: createSnoreEventAsync } = useAsync(createSnoreEvent);
  // const { execute: createSnoreEventAsync } = useAsync(createAlarmLog);
  const { execute: predictSnoreAsync } = useAsync(predictSnore);
  const { playAlarm, stopAlarm } = useAlarm();

  const [monitoringStatus, setMonitoringStatus] = useState(
    MONITORING_STATUS.IDLE,
  );
  const [snoreDetections, setSnoreDetections] = useState([]);
  const [isCooldown, setIsCooldown] = useState(false);

  const sessionIdRef = useRef(null);
  const reportIdRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const snoreStreakRef = useRef(0);
  const alarmActiveRef = useRef(user?.alarmCondition !== "3");
  const recordingIntervalRef = useRef(null);
  const lastAlarmTimeRef = useRef(0);

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

    await startRecording();
  };

  const stopSession = async () => {
    setMonitoringStatus(MONITORING_STATUS.FINISHING);
    setIsCooldown(false);
    stopRecording();

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const singleChunk = [event.data];
          await sendAudio(singleChunk);
        }
      };

      // 3초마다 명시적으로 중지하고 다시 시작하여 독립적인 파일을 만듭니다.
      recordingIntervalRef.current = setInterval(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
        }
      }, 3000);

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("마이크 접근 오류:", err);
    }
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const sendAudio = async (chunks) => {
    if (!chunks || chunks.length === 0) return;

    try {
      const webmBlob = new Blob(chunks, { type: "audio/webm" });
      const audioBuffer = await decodeAudio(webmBlob);
      const wavBlob = audioBufferToWav(audioBuffer);

      const formData = new FormData();
      formData.append("audio", wavBlob, "recording.wav");

      const data = await predictSnoreAsync(formData);
      if (!data || !data.success) return;

      const onSnoringDetected = () => {
        setSnoreDetections((prev) => [
          ...prev,
          { startedAt: new Date(), confidence: data.data.snoreProb || 1.0 },
        ]);
        snoreStreakRef.current += 1;
      };

      const onSnoringNotDetected = () => {
        snoreStreakRef.current = 0;
      };

      data.data.predicted === "snore"
        ? onSnoringDetected()
        : onSnoringNotDetected();
    } catch (err) {
      console.error("오디오 분석 준비 중 오류:", err);
    }
  };

  useEffect(() => {
    if (!alarmActiveRef.current) return;

    const triggerAlarmWithCooldown = () => {
      const now = Date.now();
      const COOLDOWN_MS = 30 * 60 * 1000;

      if (now - lastAlarmTimeRef.current < COOLDOWN_MS) {
        return;
      }

      lastAlarmTimeRef.current = now;
      setIsCooldown(true);
      playAlarm();

      setTimeout(() => {
        setIsCooldown(false);
      }, COOLDOWN_MS);
    };

    const durationBasedAlarm = () => {
      // 10초 이상 지속
      if (snoreStreakRef.current > 3) {
        triggerAlarmWithCooldown();
      }
    };

    const patternBasedAlarm = () => {
      // 1분내 5회 이상
      if (snoreDetections.length < 5) return;

      const lastSnoreTime = new Date(
        snoreDetections.at(-1)?.startedAt,
      ).getTime();
      const fifthLastSnoreTime = new Date(
        snoreDetections.at(-5)?.startedAt,
      ).getTime();

      if (lastSnoreTime - fifthLastSnoreTime < 60 * 1000) {
        triggerAlarmWithCooldown();
      }
    };

    switch (user?.alarmCondition) {
      case 1:
      case "1":
        durationBasedAlarm();
        break;

      case 2:
      case "2":
        patternBasedAlarm();
        break;

      default:
        break;
    }
  }, [snoreDetections, user?.alarmCondition, playAlarm]);

  return (
    <main className={styles.screen}>
      {isLoading && <LoadingSpinner />}
      <section className={styles.monitorShell}>
        <StatusPill text={currentStatus.text} active={isRunning} />
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
