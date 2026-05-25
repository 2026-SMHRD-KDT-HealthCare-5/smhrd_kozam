import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAsync } from "@/hooks/useAsync";
import { useAlarm } from "@/hooks/SnoreMonitoring/useAlarm";
import { useModal } from "@/contexts/ModalContext";
import {
  checkMicPermission,
  requestMicPermission,
} from "@/utils/micPermission";
import { decodeAudio, audioBufferToWav } from "@/utils/audioConverter";
import { MONITORING_STATUS } from "@/constants/monitoring.js";
import {
  createAlarmLog,
  createSnoreEvent,
  createSession,
  updateSession,
  predictSnore,
} from "@/api/monitoring";

export function useSnoreMonitoring() {
  // --- 사용자 인증 및 훅 ---
  const navigate = useNavigate();
  const { user } = useAuth();
  const { execute: createSessionAsync, isLoading } = useAsync(createSession);
  const { execute: updateSessionAsync } = useAsync(updateSession);
  const { execute: createSnoreEventAsync } = useAsync(createSnoreEvent);
  const { execute: createAlarmLogAsync } = useAsync(createAlarmLog);
  const { execute: predictSnoreAsync } = useAsync(predictSnore);
  const { playAlarm, stopAlarm, isPlayingAlarm } = useAlarm();
  const { openModal, closeModal } = useModal();

  // --- 상태 관리 ---
  // 현재 모니터링 상태 (대기, 실행 중, 종료 중, 중지됨)
  const [monitoringStatus, setMonitoringStatus] = useState(
    MONITORING_STATUS.IDLE,
  );
  // 감지된 코골이 이벤트 목록
  const [snoreDetections, setSnoreDetections] = useState([]);
  // 알람 쿨다운 상태 (알람 발생 후 일정 시간 동안 재발생 방지)
  const [isCooldown, setIsCooldown] = useState(false);
  // 세션 종료 확인

  // --- Refs (리렌더링과 무관하게 유지되어야 하는 값들) ---
  const sessionIdRef = useRef(null);
  const reportIdRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const snoreStreakRef = useRef(0); // 연속 코골이 횟수 (지속 시간 판단용)
  const alarmActiveRef = useRef(user?.alarmCondition !== "3");
  const recordingIntervalRef = useRef(null);
  const lastAlarmTimeRef = useRef(0);
  const cooldownTimerRef = useRef(null);
  const currentStreakRef = useRef({
    // 현재 진행 중인 연속 코골이 세션 (저장을 위한 연속 판단용)
    startedAt: null,
    lastDetectedAt: null,
    confidences: [],
  });
  const patternValidSince = useRef(new Date());

  const initValidRefs = () => {
    snoreStreakRef.current = 0;
    patternValidSince.current = new Date();
  };

  const handleMicPermission = async () => {
    const { state } = await checkMicPermission();

    if (state === "granted") return true;

    if (state === "prompt") {
      return new Promise((resolve) => {
        openModal({
          title: "마이크 권한 요청",
          description:
            "코골이 감지를 위해 마이크 권한이 필요해요.\n녹음 데이터는 저장되지 않고 분석에만 사용돼요.",
          onConfirm: async () => {
            const granted = await requestMicPermission();
            resolve(granted);
          },
          onCancel: () => resolve(false),
        });
      });
    }

    if (state == "denied") {
      return new Promise((resolve) => {
        openModal({
          title: "마이크 권한 재설정 요청",
          description:
            "브라우저에서 마이크 권한을 다시 허용해야\n모니터링을 시작할 수 있어요.",
          onConfirm: () => resolve(false),
          showCancel: false,
        });
      });
    }

    return false;
  };

  /**
   * 모니터링 세션 시작
   * 서버에 세션 생성을 요청하고 녹음을 시작합니다.
   */
  const startSession = async () => {
    const granted = await handleMicPermission();

    if (!granted) return;

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
    if (isPlayingAlarm) stopAlarm();
    setMonitoringStatus(MONITORING_STATUS.FINISHING);
    setIsCooldown(false);
    stopRecording();
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
        openModal({
          title: "모니터링을 종료할까요?",
          description:
            "확인을 누르면 모니터링을 종료하고\n수면 분석이 시작돼요.",
          onConfirm: async () => {
            closeModal();
            await stopSession();
          },
        });
        break;
      case MONITORING_STATUS.STOPPED:
        navigate(`/history/${reportIdRef.current || ""}`);
        break;
      default:
        break;
    }
  };

  /**
   * 캐릭터 버튼 클릭 핸들러
   * 쿨다운 상태를 켜거나 끄는 동작을 수행합니다.
   */
  const handleToggleCooldown = () => {
    if (monitoringStatus !== MONITORING_STATUS.RUNNING) return;

    if (isPlayingAlarm) {
      stopAlarm();
      return;
    } else {
      if (isCooldown) {
        initValidRefs();
        clearTimeout(cooldownTimerRef.current);
      } else {
        cooldownTimerRef.current = setTimeout(
          () => setIsCooldown(false),
          COOLDOWN_MS,
        );
      }

      setIsCooldown(!isCooldown);
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
          await sendAudio([event.data]);
        }
      };

      // 3초마다 명시적으로 중지하고 다시 시작하여 독립적인 분석 단위(WAV) 생성
      recordingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === "recording") {
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

      // 코골이
      if (isSnore) {
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
      } else {
        // 비코골이
        snoreStreakRef.current = 0;
        if (currentStreakRef.current.startedAt) {
          // 중간에 비코골이가 섞였을 때, 마지막 감지 시점으로부터 30초가 지났는지 확인
          const gapSeconds =
            (now.getTime() -
              currentStreakRef.current.lastDetectedAt.getTime()) /
            1000;
          // [CASE C] 30초 넘게 조용함 -> 이전 코골이가 완전히 끝났다고 판단하여 DB 저장
          if (gapSeconds > 30) await saveSnoreStreak();
        }
      }
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
    currentStreakRef.current = {
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
    const triggerAlarmWithCooldown = async () => {
      const now = Date.now();
      const COOLDOWN_MS = 30 * 60 * 1000;

      if (isCooldown && now - lastAlarmTimeRef.current < COOLDOWN_MS) return;

      lastAlarmTimeRef.current = now;
      setIsCooldown(true);
      playAlarm();

      // 30분 뒤 쿨다운 해제
      cooldownTimerRef.current = setTimeout(
        () => setIsCooldown(false),
        COOLDOWN_MS,
      );
      await createAlarmLogAsync(sessionIdRef.current, {
        triggeredAt: new Date(),
      });
    };

    /**
     * 지속 시간 기반 알람 (조건 1)
     * 코골이가 약 10초 이상(연속 4회 이상 감지) 지속될 경우 알람 발생
     */
    const durationBasedAlarm = () => {
      if (snoreStreakRef.current > 3) triggerAlarmWithCooldown();
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

      if (fifthLastSnoreTime < patternValidSince.current) return;

      if (lastSnoreTime - fifthLastSnoreTime < 60 * 1000)
        triggerAlarmWithCooldown();
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
  }, [snoreDetections, user?.alarmCondition, playAlarm, createAlarmLogAsync]);

  // 언마운트 클린업 이펙트
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current)
        clearInterval(recordingIntervalRef.current);
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== "inactive")
          mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream
          ?.getTracks()
          .forEach((track) => track.stop());
      }
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      stopAlarm();
    };
  }, [stopAlarm]);

  return {
    monitoringStatus,
    snoreDetections,
    isCooldown,
    isLoading,
    user,
    handleToggleMonitoring,
    handleToggleCooldown,
  };
}
