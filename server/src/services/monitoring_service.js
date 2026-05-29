// DB 쿼리를 직접 실행하는 MODEL 파일 불러옴
// SERVICE는 controller와 model 사이에서 비즈니스 로직 담당
const monitoringModel = require("../models/monitoring_model");
const LLM_API = process.env.LLM_API_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4.1-mini";
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(LLM_API_KEY);
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
    userIdx: session.user_idx,
    sessionIdx: sessionId,
    triggeredAt: alarmLogData.triggeredAt,
    alarmType: alarmLogData.alarmType,
    alarmContent: alarmLogData.alarmContent,
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
  if (!process.env.LLM_API_URL || !process.env.LLM_API_KEY) {
    throw new Error("LLM API 설정이 없습니다.");
  }

  const systemPrompt = `너는 수면 모니터링 앱의 피드백 생성 AI다.

사용자의 수면 세션 데이터, 코골이 이벤트, 알람 로그, 프로필 정보를 바탕으로 수면 점수와 코골이 개선 피드백을 생성한다.

의학적 진단처럼 단정하지 말고, 앱에서 측정된 데이터 기반의 생활 습관 피드백 수준으로 작성한다.

반드시 아래 감점 기준에 따라 100점 만점의 수면 점수를 계산한다.

[점수 산출 기준]

1. 수면 양 점수: 최대 40점
- 기준 수면 시간은 450분이다.
- 감점 공식: |450 - 총 수면시간(분)| × 0.1
- 수면 양 점수 = 40 - 감점값
- 최하점은 0점이다.

2. 수면 연속성 점수: 최대 30점
- 알람 발생 횟수 0~2회까지는 감점하지 않는다.
- 알람 발생 횟수가 3회 이상이면 다음 공식을 적용한다.
- 수면 연속성 점수 = 30 - (알람 횟수 - 2) × 3
- 최하점은 0점이다.

3. 수면 호흡 안정도 점수: 최대 30점
- 체형 정보에 따라 코골이 감점 가중치를 다르게 적용한다.
- 정상 또는 마른 체형: 30 - (코골이 횟수 × 2)
- 과체중 또는 비만 체형: 30 - (코골이 횟수 × 3)
- 최하점은 0점이다.

4. 최종 점수
- 최종 점수 = 수면 양 점수 + 수면 연속성 점수 + 수면 호흡 안정도 점수
- 최종 점수는 0~100 사이의 정수로 반환한다.

[피드백 작성 기준]

- title은 오늘 수면 상태를 짧게 요약하는 한 문장으로 작성한다.
- content는 핵심 감점 원인과 행동 교정 요령을 50자 이내의 한국어로 요약한다.
- detail에는 다음 내용을 포함한다.
  1. 수면 양 점수, 수면 연속성 점수, 수면 호흡 안정도 점수
  2. 총 수면시간, 알람 횟수, 코골이 횟수
  3. 체형 정보와 코골이의 관련성
  4. 실천 가능한 코골이 개선 조언
- detail의 줄바꿈은 반드시 \n 문자로 처리한다.
- 친절하고 정중한 한국어 톤을 유지한다.

[출력 규칙]

반드시 아래 JSON 형식으로만 응답한다.
마크다운, 코드블록, 설명문, 앞뒤 문장은 절대 포함하지 않는다.
오직 pure JSON만 반환한다.

{
  "title": "오늘 수면에 대한 짧은 한 줄 타이틀",
  "content": "50자 이내의 핵심 요약 피드백",
  "detail": "세부 점수 내역과 구체적인 분석 및 개선 조언",
  "score": 80
}`.trim();

  const userPrompt = `
다음 수면 데이터를 분석해서 수면 피드백 JSON을 생성해줘.

데이터:
${JSON.stringify(payload, null, 2)}
`.trim();

  try {
    // 생성할 때 JSON 출력을 강제하는 generationConfig를 추가합니다.
    const geminiModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json", // 💡 마크다운 없이 순수 JSON만 반환하도록 강제
        temperature: 0.3,
      },
    });

    // API 호출 (타임아웃이나 네트워크 단절 시 에러 발생 가능)
    const result = await geminiModel.generateContent(userPrompt);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Gemini API로부터 빈 응답을 받았습니다.");
    }

    // JSON 파싱 (AI가 형식을 어겼을 때를 대비)
    return JSON.parse(responseText);
  } catch (error) {
    // 3. 에러 로깅 및 개발자가 인지할 수 있는 예외 처리
    console.error("수면 피드백 생성 중 오류 발생:", error);

    // 서비스 기획에 따라 에러 발생 시 사용자에게 보여줄 '기본 피드백' 객체를 반환하거나,
    // 상위 컨트롤러로 에러를 던집니다 (여기서는 기본값 반환 예시를 듭니다).
    return {
      title: "수면 분석 일시 오류",
      content:
        "수면 데이터를 분석하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      detail: `불편을 드려 죄송합니다. 시스템 오류로 인해 상세 분석을 불러오지 못했습니다. (Error: ${error.message})`,
      score: 0,
    };
  }
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
  console.log(`analysisData: ${JSON.stringify(analysisData)}`);
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
    sessionIdx: sessionId,
  });

  const profile = await monitoringModel.findProfileById(session.profile_idx);

  console.log("test1");
  const feedback = await generateSleepFeedback({
    session: {
      ...session,
      end_time: endedAt,
    },
    snoreEvents,
    alarmLogs,
    profile,
  });
  console.log("test2");

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
