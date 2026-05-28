// DB 쿼리를 직접 실행하는 MODEL 파일 불러옴
// SERVICE는 controller와 model 사이에서 비즈니스 로직 담당
const monitoringModel = require("../models/monitoring_model");
const LLM_API = process.env.LLM_API_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL;
/**
 * 수면 세션 생성 서비스
 *
 * 역할:
 * 1. controller에서 받은 세션 데이터를 model로 전달한다.
 * 2. DB에 세션을 저장한 뒤 생성된 sessionId를 반환한다.
 *
 * @param {Object} sessionData - 세션 생성 데이터 객체
 * @param {string} sessionData.startedAt - 수면 시작 시간
 * @param {number} sessionData.userIdx - 사용자 ID
 * @return {Promise<{sessionId: number}>} 생성된 세션 ID
 */
const createSession = async (sessionData) => {
  const settings = await monitoringModel.findSessionSettingsByUserId(
    sessionData.userIdx,
  );

  if (!settings || !settings.profile_idx) {
    throw new Error("모니터링 프로필을 찾을 수 없습니다.");
  }

  const sessionId = await monitoringModel.insertSession({
    ...sessionData,
    profileIdx: settings.profile_idx,
    alarmCondition: String(settings.alarm_condition || "3"),
  });

  return { sessionId };
};

/**
 * 코골이 이벤트 저장 서비스
 *
 * 역할:
 * 1. 전달받은 코골이 이벤트 데이터에서 sessionId를 확인한다.
 * 2. 해당 sessionId가 monitoring_sessions 테이블에 존재하는지 확인한다.
 * 3. 세션이 존재하면 snoring_events 테이블에 저장한다.
 *
 * @param {Object} snoreEventData - 코골이 이벤트 데이터 객체
 * @param {number} snoreEventData.sessionId - 이벤트가 속한 세션 ID
 * @param {number} snoreEventData.userIdx - 인증된 사용자 ID
 * @param {string} snoreEventData.startTime - 코골이 이벤트 시작 시간
 * @param {string} snoreEventData.endTime - 코골이 이벤트 종료 시간
 * @param {number} snoreEventData.avgConfidence - 코골이 이벤트 평균 신뢰도
 * @return {Promise<void>} 저장 완료 후 별도 반환 없음
 */
const createSnoreEvent = async (snoreEventData) => {
  const { sessionId, userIdx } = snoreEventData;

  const session = await monitoringModel.findSessionById(sessionId, userIdx);

  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  if (session.end_time) {
    throw new Error("이미 종료된 세션입니다.");
  }

  await monitoringModel.insertSnoreEvent(snoreEventData);
};

/**
 * 알람 로그 저장 서비스
 *
 * 역할:
 * 1. sessionId로 monitoring_sessions에서 세션을 조회한다.
 * 2. 세션이 현재 로그인 사용자 소유인지 확인한다.
 * 3. alarm_logs 테이블에 user_idx와 session_idx를 함께 저장한다.
 *
 * @param {Object} alarmLogData - 알람 로그 데이터 객체
 * @param {number} alarmLogData.sessionId - 알람이 발생한 세션 ID
 * @param {number} alarmLogData.userIdx - 인증된 사용자 ID
 * @param {string} alarmLogData.triggeredAt - 알람 발생 시간
 * @param {string} [alarmLogData.alarmType] - 알람 타입
 * @param {string} [alarmLogData.alarmContent] - 알람 내용
 * @return {Promise<void>} 저장 완료 후 별도 반환 없음
 */
const createAlarmLog = async (alarmLogData) => {
  const { sessionId, userIdx } = alarmLogData;

  const session = await monitoringModel.findSessionById(sessionId, userIdx);

  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  if (session.end_time) {
    throw new Error("이미 종료된 세션입니다.");
  }

  await monitoringModel.insertAlarmLog({
    ...alarmLogData,
    userIdx: session.user_idx,
  });
};

/**
 * 날짜 값을 ISO 문자열로 변환한다.
 *
 * @param {Date|string|null} value - 날짜 값
 * @return {string|null} ISO 문자열 또는 null
 */
const toISOStringOrNull = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

/**
 * 수면 시간 분 단위 계산 함수
 *
 * 주의:
 * 이 함수는 점수를 직접 계산하기 위한 함수가 아니다.
 * LLM에게 전달할 수면 분석 입력값을 만들기 위한 전처리 함수다.
 *
 * @param {Date|string} startTime - 수면 시작 시간
 * @param {Date|string} endTime - 수면 종료 시간
 * @return {number} 수면 시간, 분 단위
 */
const calculateSleepDurationMinutes = (startTime, endTime) => {
  const startTimeMs = new Date(startTime).getTime();
  const endTimeMs = new Date(endTime).getTime();

  if (Number.isNaN(startTimeMs) || Number.isNaN(endTimeMs)) {
    return 0;
  }

  const durationMs = endTimeMs - startTimeMs;

  if (durationMs <= 0) {
    return 0;
  }

  return Math.round(durationMs / 1000 / 60);
};

/**
 * 코골이 총 지속 시간 초 단위 계산 함수
 *
 * 주의:
 * 이 함수도 점수 계산용이 아니라 LLM 입력값 생성용이다.
 *
 * @param {Array} snoreEvents - 코골이 이벤트 목록
 * @return {number} 코골이 총 지속 시간, 초 단위
 */
const calculateTotalSnoreDurationSeconds = (snoreEvents = []) => {
  return snoreEvents.reduce((totalSeconds, event) => {
    const startTimeMs = new Date(event.start_time).getTime();
    const endTimeMs = new Date(event.end_time).getTime();

    if (Number.isNaN(startTimeMs) || Number.isNaN(endTimeMs)) {
      return totalSeconds;
    }

    const durationSeconds = Math.max(
      0,
      Math.round((endTimeMs - startTimeMs) / 1000),
    );

    return totalSeconds + durationSeconds;
  }, 0);
};

/**
 * LLM 피드백 생성을 위한 입력 데이터를 만든다.
 *
 * @param {Object} analysisData - 수면 분석 원본 데이터
 * @param {Object} analysisData.session - 세션 정보
 * @param {Array} analysisData.snoreEvents - 코골이 이벤트 목록
 * @param {Array} analysisData.alarmLogs - 알람 로그 목록
 * @param {Object|null} analysisData.profile - 사용자 프로필 정보
 * @return {Object} LLM 입력 데이터
 */
const buildSleepFeedbackPayload = (analysisData) => {
  const { session, snoreEvents, alarmLogs, profile } = analysisData;

  const sleepDurationMinutes = calculateSleepDurationMinutes(
    session.start_time,
    session.end_time,
  );

  const totalSnoreDurationSeconds =
    calculateTotalSnoreDurationSeconds(snoreEvents);

  return {
    session: {
      sessionId: session.idx,
      startTime: toISOStringOrNull(session.start_time),
      endTime: toISOStringOrNull(session.end_time),
      sleepDurationMinutes,
      alarmCondition: session.alarm_condition,
    },

    snoring: {
      count: snoreEvents.length,
      totalDurationSeconds: totalSnoreDurationSeconds,
      events: snoreEvents.map((event) => {
        return {
          startTime: toISOStringOrNull(event.start_time),
          endTime: toISOStringOrNull(event.end_time),
          avgConfidence:
            event.avg_confidence === null ? null : Number(event.avg_confidence),
        };
      }),
    },

    alarms: {
      count: alarmLogs.length,
      events: alarmLogs.map((alarm) => {
        return {
          triggeredAt: toISOStringOrNull(alarm.created_at),
          alarmType: alarm.alarm_type,
          alarmContent: alarm.alarm_content,
        };
      }),
    },

    profile: {
      height:
        profile && profile.height !== null ? Number(profile.height) : null,
      weight:
        profile && profile.weight !== null ? Number(profile.weight) : null,
      sleepingPosture: profile ? profile.sleeping_posture : null,
    },
  };
};

/**
 * LLM API에 수면 피드백 생성을 요청한다.
 *
 * @param {Object} payload - LLM 입력 데이터
 * @return {Promise<Object>} LLM 피드백 응답 객체
 */
const requestSleepFeedbackFromLLM = async (payload) => {
  if (!LLM_API_URL || !LLM_API_KEY) {
    throw new Error("LLM API 설정이 없습니다.");
  }

  const systemPrompt = `
너는 수면 모니터링 앱의 피드백 생성 AI다.
사용자의 수면 세션 데이터, 코골이 이벤트, 알람 로그, 프로필 정보를 바탕으로 수면 피드백을 생성한다.

반드시 아래 JSON 형식으로만 응답해야 한다.
마크다운, 설명문, 코드블록은 절대 포함하지 마라.

{
  "title": "짧은 제목",
  "content": "사용자가 바로 이해할 수 있는 한두 문장 요약",
  "detail": "수면 상태에 대한 구체적인 분석과 실천 가능한 조언",
  "score": 0
}

score는 0부터 100 사이의 정수다.
의학적 진단처럼 단정하지 말고, 앱에서 측정된 데이터 기반의 생활 습관 피드백 수준으로 작성한다.
`.trim();

  const userPrompt = `
다음 수면 데이터를 분석해서 수면 피드백 JSON을 생성해줘.

데이터:
${JSON.stringify(payload, null, 2)}
`.trim();

  const response = await fetch(LLM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.3,
      response_format: {
        type: "json_object",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LLM API 오류:", errorText);

    throw new Error("LLM 피드백 생성에 실패했습니다.");
  }

  const result = await response.json();

  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("LLM 피드백 응답이 비어 있습니다.");
  }

  return JSON.parse(content);
};

/**
 * LLM 응답을 sleep_reports.feedback에 저장 가능한 형태로 정리한다.
 *
 * @param {Object} feedback - LLM 응답 객체
 * @return {Object} 정규화된 피드백 객체
 */
const normalizeLLMFeedback = (feedback) => {
  const score = Number(feedback.score);

  return {
    title:
      typeof feedback.title === "string" && feedback.title.trim()
        ? feedback.title.trim()
        : "수면 리포트",

    content:
      typeof feedback.content === "string" && feedback.content.trim()
        ? feedback.content.trim()
        : "수면 데이터 분석 결과를 확인해보세요.",

    detail:
      typeof feedback.detail === "string" && feedback.detail.trim()
        ? feedback.detail.trim()
        : "수면 중 코골이와 알람 발생 기록을 바탕으로 생성된 피드백입니다.",

    score: Number.isNaN(score)
      ? 0
      : Math.max(0, Math.min(100, Math.round(score))),
  };
};
/**
 * 수면 피드백 생성 함수
 *
 * 실제 LLM API를 호출해서 피드백을 생성한다.
 *
 * @param {Object} analysisData - 수면 분석에 필요한 데이터
 * @param {Object} analysisData.session - 세션 정보
 * @param {Array} analysisData.snoreEvents - 코골이 이벤트 목록
 * @param {Array} analysisData.alarmLogs - 알람 로그 목록
 * @param {Object|null} analysisData.profile - 사용자 프로필 정보
 * @return {Promise<Object>} 피드백 객체
 */
const generateSleepFeedback = async (analysisData) => {
  const payload = buildSleepFeedbackPayload(analysisData);

  const llmFeedback = await requestSleepFeedbackFromLLM(payload);

  return normalizeLLMFeedback(llmFeedback);
};

/**
 * 수면 세션 종료 서비스
 *
 * 역할:
 * 1. sessionId로 monitoring_sessions에서 세션을 조회한다.
 * 2. 세션이 없으면 에러를 발생시킨다.
 * 3. 이미 종료된 세션이면 에러를 발생시킨다.
 * 4. endedAt이 start_time보다 빠른지 검증한다.
 * 5. 코골이 이벤트 목록을 조회한다.
 * 6. 알람 로그 목록을 조회한다.
 * 7. profile 정보를 조회한다.
 * 8. LLM 응답 형태의 feedback 객체를 생성한다.
 * 9. sleep_reports.feedback 컬럼에 JSON 문자열로 저장한다.
 * 10. monitoring_sessions.end_time 업데이트와 sleep_reports 생성을 트랜잭션으로 처리한다.
 * 11. 생성된 reportId를 반환한다.
 *
 * @param {Object} sessionEndData - 세션 종료 데이터 객체
 * @param {number} sessionEndData.sessionId - 종료할 세션 ID
 * @param {number} sessionEndData.userIdx - 인증된 사용자 ID
 * @param {string} sessionEndData.endedAt - 수면 종료 시간
 * @return {Promise<{reportId: number}>} 생성된 리포트 ID
 */
const endSession = async (sessionEndData) => {
  const { sessionId, userIdx, endedAt } = sessionEndData;

  const session = await monitoringModel.findSessionById(sessionId, userIdx);

  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  if (session.end_time) {
    throw new Error("이미 종료된 세션입니다.");
  }

  const startTimeMs = new Date(session.start_time).getTime();
  const endTimeMs = new Date(endedAt).getTime();

  if (endTimeMs < startTimeMs) {
    throw new Error("종료 시간은 시작 시간보다 빠를 수 없습니다.");
  }

  const snoreEvents = await monitoringModel.findSnoreEventsBySessionId({
    sessionId,
  });

  const alarmLogs = await monitoringModel.findAlarmLogsBySessionId({
    sessionId,
  });

  const profile = await monitoringModel.findProfileById(session.profile_idx);

  const feedback = await generateSleepFeedback({
    session: {
      ...session,
      end_time: endedAt,
    },
    snoreEvents,
    alarmLogs,
    profile,
  });

  const feedbackJson = JSON.stringify(feedback);

  const reportId = await monitoringModel.finalizeSessionReport(
    { sessionId, userIdx, endedAt },
    {
      userId: session.user_idx,
      sessionIdx: session.idx,
      feedback: feedbackJson,
      height: profile ? profile.height : null,
      weight: profile ? profile.weight : null,
      sleepingPosture: profile ? profile.sleeping_posture : null,
    },
  );

  return {
    reportId,
  };
};

module.exports = {
  createSession,
  createSnoreEvent,
  createAlarmLog,
  endSession,
};
