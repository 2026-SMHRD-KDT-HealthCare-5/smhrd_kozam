// DB 쿼리를 직접 실행하는 MODEL 파일 불러옴
// SERVICE는 controller와 model 사이에서 비즈니스 로직 담당
const monitoringModel = require("../models/monitoring_model");

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
 * @return {Promise<{sessionId: number}>} - 생성된 세션 ID
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

  // controller로 반환할 데이터 형태를 정리한다.
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
 * @return {Promise<void>} - 저장 완료 후 별도 반환 없음
 */
const createSnoreEvent = async (snoreEventData) => {
  const { sessionId, userIdx } = snoreEventData;

  // 세션 존재 여부 확인
  const session = await monitoringModel.findSessionById(sessionId, userIdx);

  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  if (session.end_time) {
    throw new Error("이미 종료된 세션입니다.");
  }

  // 세션이 존재하면 코골이 이벤트 저장
  // 중요: 객체를 그대로 model로 전달한다.
  await monitoringModel.insertSnoreEvent(snoreEventData);
};

/**
 * 알람 로그 저장 서비스
 *
 * 역할:
 * 1. sessionId로 monitoring_sessions에서 세션을 조회한다.
 * 2. 세션의 user_idx를 가져온다.
 * 3. alarm_logs 테이블에는 session_idx가 없으므로 user_idx 기준으로 저장한다.
 *
 * @param {Object} alarmLogData - 알람 로그 데이터 객체
 * @param {number} alarmLogData.sessionId - 알람이 발생한 세션 ID
 * @param {number} alarmLogData.userIdx - 인증된 사용자 ID
 * @param {string} alarmLogData.triggeredAt - 알람 발생 시간
 * @param {string} [alarmLogData.alarmType] - 알람 타입
 * @param {string} [alarmLogData.alarmContent] - 알람 내용
 * @return {Promise<void>} - 저장 완료 후 별도 반환 없음
 */
const createAlarmLog = async (alarmLogData) => {
  const { sessionId, userIdx } = alarmLogData;

  // 세션 존재 여부 확인
  const session = await monitoringModel.findSessionById(sessionId, userIdx);

  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  if (session.end_time) {
    throw new Error("이미 종료된 세션입니다.");
  }

  // alarm_logs 테이블에는 session_idx가 없으므로
  // 조회한 세션의 user_idx를 alarmLogData에 추가해서 model로 넘긴다.
  await monitoringModel.insertAlarmLog({
    ...alarmLogData,
    userIdx: session.user_idx,
  });
};
/**
 * 수면 점수 임시 계산 함수
 *
 * 실제 LLM API가 score를 내려주기 전까지 사용할 임시 계산식이다.
 * 나중에 LLM 응답에서 score를 받으면 이 함수는 제거하거나 보조용으로만 사용하면 된다.
 *
 * 계산 기준:
 * 1. 기본 점수 100점
 * 2. 코골이 1회당 2점 감점
 * 3. 알람 1회당 5점 감점
 * 4. 10점 단위로 반올림
 * 5. 최소 0점, 최대 100점 제한
 *
 * @param {number} snoreCount - 코골이 이벤트 개수
 * @param {number} alarmsCount - 알람 발생 개수
 * @return {number} 수면 점수
 */
const calculateSleepScore = (snoreCount, alarmsCount) => {
  const rawScore = 100 - snoreCount * 2 - alarmsCount * 5;
  const roundedScore = Math.round(rawScore / 10) * 10;

  return Math.max(0, Math.min(100, roundedScore));
};

/**
 * 수면 피드백 생성 함수
 *
 * 명세상 이 부분에서 LLM API를 호출해야 한다.
 * 현재는 실제 LLM API 정보가 없으므로,
 * LLM 응답 형태와 동일한 임시 피드백 객체를 생성한다.
 *
 * 나중에 실제 LLM API를 붙일 때는 이 함수 내부만 교체하면 된다.
 *
 * 최종 저장 형태:
 * {
 *   "title": "...",
 *   "content": "...",
 *   "detail": "...",
 *   "score": 80
 * }
 *
 * @param {Object} analysisData - 수면 분석에 필요한 데이터
 * @param {Object} analysisData.session - 세션 정보
 * @param {Array} analysisData.snoreEvents - 코골이 이벤트 목록
 * @param {Array} analysisData.alarmLogs - 알람 로그 목록
 * @param {Object|null} analysisData.profile - 사용자 프로필 정보
 * @return {Promise<Object>} 피드백 객체
 */
const generateSleepFeedback = async (analysisData) => {
  const snoreCount = analysisData.snoreEvents.length;
  const alarmsCount = analysisData.alarmLogs.length;
  const score = calculateSleepScore(snoreCount, alarmsCount);

  if (score >= 80) {
    return {
      title: "안정적인 수면이었어요.",
      content: "코골이와 알람 발생이 적은 편이에요.",
      detail:
        "수면 중 방해 요소가 비교적 적었습니다. 현재 수면 습관을 유지하면서 일정한 취침 시간을 지키는 것이 좋습니다.",
      score,
    };
  }

  if (score >= 50) {
    return {
      title: "중간 정도의 수면이었어요.",
      content: "코골이 또는 알람 발생이 일부 있었어요.",
      detail:
        "수면 중 코골이 이벤트와 알람 발생이 확인되었습니다. 옆으로 누워 자기, 음주 피하기, 취침 전 과식 줄이기 같은 습관 개선이 도움이 될 수 있습니다.",
      score,
    };
  }

  return {
    title: "방해가 많은 수면이었어요.",
    content: "코골이와 알람 발생이 많은 편이에요.",
    detail:
      "수면 중 반복적인 코골이와 알람 발생이 확인되었습니다. 수면 자세, 베개 높이, 코막힘 여부를 점검하고 반복될 경우 전문 상담을 고려하는 것이 좋습니다.",
    score,
  };
};

/**
 * 수면 세션 종료 서비스
 *
 * 역할:
 * 1. sessionId로 monitoring_sessions에서 세션을 조회한다.
 * 2. 세션이 없으면 에러를 발생시킨다.
 * 3. 이미 종료된 세션이면 에러를 발생시킨다.
 * 4. endedAt이 start_time보다 빠른지 검증한다.
 * 5. monitoring_sessions.end_time 값을 업데이트한다.
 * 6. 코골이 이벤트 목록을 조회한다.
 * 7. 알람 로그 목록을 조회한다.
 *    - alarm_logs에는 session_idx가 없으므로 user_idx + 시간 범위로 조회한다.
 * 8. profile 정보를 조회한다.
 * 9. LLM 응답 형태의 feedback 객체를 생성한다.
 * 10. sleep_reports.feedback 컬럼에 JSON 문자열로 저장한다.
 * 11. 생성된 reportId를 반환한다.
 *
 * @param {Object} sessionEndData - 세션 종료 데이터 객체
 * @param {number} sessionEndData.sessionId - 종료할 세션 ID
 * @param {number} sessionEndData.userIdx - 인증된 사용자 ID
 * @param {string} sessionEndData.endedAt - 수면 종료 시간
 * @return {Promise<{reportId: number}>} - 생성된 리포트 ID
 */
const endSession = async (sessionEndData) => {
  const { sessionId, userIdx, endedAt } = sessionEndData;

  // 1. 세션 존재 여부 확인
  const session = await monitoringModel.findSessionById(sessionId, userIdx);

  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  // 2. 이미 종료된 세션인지 확인
  if (session.end_time) {
    throw new Error("이미 종료된 세션입니다.");
  }

  // 3. 종료 시간이 시작 시간보다 빠른지 확인
  const startTimeMs = new Date(session.start_time).getTime();
  const endTimeMs = new Date(endedAt).getTime();

  if (endTimeMs < startTimeMs) {
    throw new Error("종료 시간은 시작 시간보다 빠를 수 없습니다.");
  }

  // 4. 해당 세션의 코골이 이벤트 목록 조회
  const snoreEvents = await monitoringModel.findSnoreEventsBySessionId({
    sessionId,
  });

  // 5. 해당 수면 시간 범위 안에 발생한 알람 로그 조회
  // alarm_logs에는 session_idx가 없으므로 user_idx와 시간 범위로 조회한다.
  const alarmLogs = await monitoringModel.findAlarmLogsBySessionTime({
    userIdx: session.user_idx,
    startTime: session.start_time,
    endTime: endedAt,
  });

  // 6. 세션에 연결된 프로필 정보 조회
  const profile = await monitoringModel.findProfileById(session.profile_idx);

  // 7. LLM 응답 형태의 피드백 생성
  // 현재는 임시 함수이고, 추후 실제 LLM API 호출로 교체하면 된다.
  const feedback = await generateSleepFeedback({
    session: {
      ...session,
      end_time: endedAt,
    },
    snoreEvents,
    alarmLogs,
    profile,
  });

  // 8. sleep_reports.feedback 컬럼에 JSON 문자열로 저장
  const feedbackJson = JSON.stringify(feedback);

  // 9. 종료 처리와 리포트 생성은 하나의 트랜잭션에서 반영
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

  // 10. controller로 reportId 반환
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
