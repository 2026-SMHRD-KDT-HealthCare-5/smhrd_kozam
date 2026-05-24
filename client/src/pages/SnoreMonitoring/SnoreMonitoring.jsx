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

/**
 * 코골이 모니터링 페이지 컴포넌트
 * 마이크를 통해 실시간으로 오디오를 녹음하고 AI 모델을 통해 코골이를 감지합니다.
 * 감지된 결과에 따라 사용자 설정에 맞는 알람을 발생시킵니다.
 */
const SnoreMonitoring = () => {
  // --- 사용자 인증 및 API 훅 ---
  const { user } = useAuth();
  const { execute: createSessionAsync, isLoading } = useAsync(createSession);
  const { execute: updateSessionAsync } = useAsync(updateSession);
  const { execute: createSnoreEventAsync } = useAsync(createSnoreEvent);
  // const { execute: createSnoreEventAsync } = useAsync(createAlarmLog);
  const { execute: predictSnoreAsync } = useAsync(predictSnore);
  const { playAlarm, stopAlarm } = useAlarm();

  // --- 상태 관리 ---
  // 현재 모니터링 상태 (대기, 실행 중, 종료 중, 중지됨)
  const [monitoringStatus, setMonitoringStatus] = useState(
    MONITORING_STATUS.IDLE,
  );
  // 감지된 코골이 이벤트 목록
  const [snoreDetections, setSnoreDetections] = useState([]);
  // 알람 쿨다운 상태 (알람 발생 후 일정 시간 동안 재발생 방지)
  const [isCooldown, setIsCooldown] = useState(false);

  // --- Refs (리렌더링과 무관하게 유지되어야 하는 값들) ---
  const sessionIdRef = useRef(null); // 현재 모니터링 세션 ID
  const reportIdRef = useRef(null); // 생성된 리포트 ID
  const mediaRecorderRef = useRef(null); // MediaRecorder 인스턴스
  const audioChunksRef = useRef([]); // 녹음된 오디오 데이터 조각
  const snoreStreakRef = useRef(0); // 연속 코골이 횟수 (지속 시간 판단용)
  const alarmActiveRef = useRef(user?.alarmCondition !== "3"); // 알람 활성화 여부 (사용자 설정)
  const recordingIntervalRef = useRef(null); // 녹음 조각 생성을 위한 인터벌
  const lastAlarmTimeRef = useRef(0); // 마지막 알람 발생 시간
  const cooldownTimerRef = useRef(null); // 쿨다운 해제용 타이머
  const currentStreakRef = useRef({
    // 현재 진행 중인 연속 코골이 세션
    startedAt: null,
    lastDetectedAt: null,
    confidences: [], // (평균 신뢰도 계산용)
  });

  // --- 파생된 값들 ---
  const currentStatus = STATUS_CONFIG[monitoringStatus];
  const isRunning = monitoringStatus === MONITORING_STATUS.RUNNING;
  const isFinishing = monitoringStatus === MONITORING_STATUS.FINISHING;
  const shouldShowTimer =
    monitoringStatus !== MONITORING_STATUS.FINISHING &&
    monitoringStatus !== MONITORING_STATUS.STOPPED;
  const actionButtonClassName =
    isRunning || isFinishing ? styles.stopAction : styles.startAction;

  /**
   * 모니터링 세션 시작
   * 서버에 세션 생성을 요청하고 녹음을 시작합니다.
   */
  const startSession = async () => {
    const data = await createSessionAsync({ startedAt: new Date() });
    if (!data.success) return;

    sessionIdRef.current = data.sessionId;
    setMonitoringStatus(MONITORING_STATUS.RUNNING);

    await startRecording();
  };

  /**
   * 모니터링 세션 종료
   * 녹음을 중지하고 서버에 세션 종료 정보를 업데이트합니다.
   */
  const stopSession = async () => {
    setMonitoringStatus(MONITORING_STATUS.FINISHING);
    setIsCooldown(false);
    stopRecording();

    // 종료 시점에 아직 저장되지 않고 진행 중이던 코골이 세션이 있다면 강제 저장
    await saveSnoreStreak();

    const data = await updateSessionAsync(sessionIdRef.current, {
      endedAt: new Date(),
    });
    if (!data.success) return;

    reportIdRef.current = data.reportId;
    setMonitoringStatus(MONITORING_STATUS.STOPPED);
  };

  /**
   * 모니터링 버튼 클릭 핸들러
   * 현재 상태에 따라 시작 또는 종료 동작을 수행합니다.
   */
  const handleToggleMonitoring = async () => {
    switch (monitoringStatus) {
      case MONITORING_STATUS.IDLE:
        await startSession();
        break;

      case MONITORING_STATUS.RUNNING:
        stopSession();
        break;

      case MONITORING_STATUS.STOPPED:
        // TODO: 리포트 상세 페이지 등으로 이동 기능 추가 필요
        break;

      default:
        break;
    }
  };

  /**
   * 오디오 녹음 시작
   * 브라우저 마이크 권한을 획득하고 3초 간격으로 오디오 데이터를 분할하여 분석에 전달합니다.
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      // 데이터 가용 시 분석 함수 호출
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const singleChunk = [event.data];
          await sendAudio(singleChunk);
        }
      };

      // 3초마다 명시적으로 중지하고 다시 시작하여 독립적인 분석 단위(WAV) 생성
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

  /**
   * 오디오 녹음 중지 및 리소스 해제
   */
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

  /**
   * 녹음된 오디오 데이터를 AI 서버로 전송하여 코골이 여부 예측
   * @param {Blob[]} chunks - 녹음된 오디오 데이터 조각들
   */
  const sendAudio = async (chunks) => {
    if (!chunks || chunks.length === 0) return;

    try {
      // 1. WebM 데이터를 WAV 형식으로 변환 (서버 분석 요구사항)
      const webmBlob = new Blob(chunks, { type: "audio/webm" });
      const audioBuffer = await decodeAudio(webmBlob);
      const wavBlob = audioBufferToWav(audioBuffer);

      // 2. FormData에 오디오 파일 추가
      const formData = new FormData();
      formData.append("audio", wavBlob, "recording.wav");

      // 3. 서버에 예측 요청
      const data = await predictSnoreAsync(formData);
      if (!data || !data.success) return;

      // 이후 처리 로직에서 사용할 변수
      const now = new Date();
      const isSnore = data.data.predicted === "snore";
      const confidence = data.data.snoreProb || 1.0;

      const onSnoringDetected = () => {
        if (!currentStreakRef.current.startedAt) {
          // [CASE A] 새로운 코골이 시작
          currentStreakRef.current = {
            startedAt: now,
            lastDetectedAt: now,
            confidences: [confidence],
          };
        } else {
          // [CASE B] 기존 코골이 지속 중 (데이터 누적)
          currentStreakRef.current.lastDetectedAt = now;
          currentStreakRef.current.confidences.push(confidence);
        }

        setSnoreDetections((prev) => [...prev, { startedAt: now, confidence }]);
        snoreStreakRef.current += 1;
      };

      const onSnoringNotDetected = async () => {
        snoreStreakRef.current = 0;
        if (currentStreakRef.current.startedAt) {
          // 중간에 비코골이가 섞였을 때, 마지막 감지 시점으로부터 30초가 지났는지 확인
          const gapSeconds =
            (now.getTime() -
              currentStreakRef.current.lastDetectedAt.getTime()) /
            1000;

          if (gapSeconds > 30) {
            // [CASE C] 30초 넘게 조용함 -> 이전 코골이가 완전히 끝났다고 판단하여 DB 저장
            await saveSnoreStreak();
          }
        }
      };

      // AI 예측 결과에 따라 처리
      isSnore ? onSnoringDetected() : onSnoringNotDetected();
    } catch (err) {
      console.error("오디오 분석 준비 중 오류:", err);
    }
  };

  /**
   * 기준에 따라 지속되었다고 판단한 코골이 세션을
   * 서버에 코골이 데이터 저장을 요청
   */
  const saveSnoreStreak = async () => {
    const { startedAt, lastDetectedAt, confidences } = currentStreakRef.current;
    if (!startedAt) return;

    const durationSeconds =
      (lastDetectedAt.getTime() - startedAt.getTime()) / 1000;

    // 최소 10초 이상 지속된 경우만 유효한 코골이로 인정하여 DB 저장
    if (durationSeconds >= 10) {
      const avgConfidence =
        confidences.reduce((a, b) => a + b, 0) / confidences.length;

      // 코골이 저장 API 호출
      const data = await createSnoreEventAsync(sessionIdRef.current, {
        startedAt,
        endedAt: lastDetectedAt,
        avgConfidence: Number(avgConfidence.toFixed(2)),
      });
      if (!data.success) return;
    }

    // 저장 후 다음 묶음을 위해 초기화
    currentEpisodeRef.current = {
      startedAt: null,
      lastDetectedAt: null,
      confidences: [],
    };
  };

  /**
   * 알람 트리거 효과
   * 코골이 감지 목록이나 사용자 설정이 변경될 때마다 알람 조건을 검사합니다.
   */
  useEffect(() => {
    if (!alarmActiveRef.current) return;

    /**
     * 쿨다운을 고려한 알람 실행
     * 알람이 한 번 울리면 30분 동안 다시 울리지 않도록 설정합니다.
     */
    const triggerAlarmWithCooldown = () => {
      const now = Date.now();
      const COOLDOWN_MS = 30 * 60 * 1000; // 30분

      if (now - lastAlarmTimeRef.current < COOLDOWN_MS) {
        return;
      }

      lastAlarmTimeRef.current = now;
      setIsCooldown(true);
      playAlarm();

      // 30분 뒤 쿨다운 해제
      cooldownTimerRef.current = setTimeout(() => {
        setIsCooldown(false);
      }, COOLDOWN_MS);
    };

    /**
     * 지속 시간 기반 알람 (조건 1)
     * 코골이가 약 10초 이상(연속 4회 이상 감지) 지속될 경우 알람 발생
     */
    const durationBasedAlarm = () => {
      if (snoreStreakRef.current > 3) {
        triggerAlarmWithCooldown();
      }
    };

    /**
     * 빈도 패턴 기반 알람 (조건 2)
     * 1분 내에 코골이가 5회 이상 감지될 경우 알람 발생
     */
    const patternBasedAlarm = () => {
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

    // 사용자 설정에 따른 알람 로직 실행
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

  /**
   * 컴포넌트 언마운트 시 정리 작업
   * 모든 인터벌, 타이머, 녹음 리소스 및 알람을 중지합니다.
   */
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream
            .getTracks()
            .forEach((track) => track.stop());
        }
      }

      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }

      stopAlarm();
    };
  }, [stopAlarm]);

  return (
    <main className={styles.screen}>
      {/* 로딩 상태 표시 */}
      {isLoading && <LoadingSpinner />}

      <section className={styles.monitorShell}>
        {/* 현재 상태 표시 (Pill UI) */}
        <StatusPill text={currentStatus.text} active={isRunning} />

        {/* 알람 쿨다운 안내 배너 */}
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

        {/* 중앙 판다 캐릭터 및 타이머 영역 */}
        <div className={styles.orb}>
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

          {/* 실행 중이거나 중지된 경우 타이머 표시 */}
          {shouldShowTimer && <ElapsedTimer isRunning={isRunning} />}
        </div>

        {/* 통계 바 (감지 횟수 및 설정 정보) */}
        <StatsBar
          snoreCount={snoreDetections.length}
          alarmCondition={user?.alarmCondition}
        />

        {/* 제어 패널 (시작/중지 버튼) */}
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
