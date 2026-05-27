// DB 쿼리를 직접 실행하는 MODEL 파일 불러옴
// SERVICE는 controller와 model 사이에서 비즈니스 로직 담당
const monitoringModel = require("../models/monitoring_model");

/**
 * 수면 세션 생성 서비스
 *
 * 역할:
 * 1. controller에서 받은 startedAt 값을 model로 전달
 * 2. DB에 세션을 저장한 뒤 생성된 sessionId를 반환
 *
 * @param {string} startedAt - 수면 시작 시간
 * @return {Promise<{sessionId: number}>} - 생성된 세션의 ID
 */
const createSession = async (startedAt) => {
  // model의 실제 DB insert 작업을 요청한다.
  const sessionId = await monitoringModel.insertSession(startedAt);

  // controller로 반환할 데이터 형태를 정리한다.
  return { sessionId };
};

/**
 * 코골이 이벤트 저장 서비스
 *
 * 역할:
 * 1. 전달받은 코골이 이벤트 데이터에서 sessionId를 확인
 * 2. 해당 sessionId가 실제 DB에 존재하는지 확인
 * 3. 세션이 존재하면 snore_events 테이블에 저장
 *
 * @param {Object} snoreEventData - 코골이 이벤트 데이터 객체
 * @param {number} snoreEventData.sessionId - 이벤트가 속한 세션의 고유 ID
 * @param {string} snoreEventData.startTime - 코골이 이벤트 시작 시간
 * @param {string} snoreEventData.endTime - 코골이 이벤트 종료 시간
 * @param {number} snoreEventData.avgConfidence - 코골이 이벤트 평균 신뢰도
 * @return {Promise<void>} - 저장 완료 후 별도의 반환 값 없음
 */
const createSnoreEvent = async (snoreEventData) => {
  // 전달받은 객체에서 sessionId만 꺼낸다.
  const { sessionId } = snoreEventData;

  // 먼저 세션이 실제 DB에 있는지 확인한다.
  const session = await monitoringModel.findSessionById(sessionId);

  // 세션이 없으면 존재하지 않는 세션에 이벤트가 저장되지 않도록 에러를 던진다.
  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  // 세션이 존재하면 코골이 이벤트를 저장한다.
  // 중요: 여러 인자로 쪼개지 않고 객체 그대로 model에 전달한다.
  await monitoringModel.insertSnoreEvent(snoreEventData);
};

/**
 * 알람 로그 저장 서비스
 *
 * 역할:
 * 1. 전달받은 알람 로그 데이터에서 sessionId를 확인
 * 2. 해당 sessionId가 실제 DB에 존재하는지 확인
 * 3. 세션이 존재하면 alarm_logs 테이블에 저장
 * 4. 생성된 alarmLogId를 controller로 반환
 *
 * @param {Object} alarmLogData - 알람 로그 데이터 객체
 * @param {number} alarmLogData.sessionId - 알람이 발생한 세션의 고유 ID
 * @param {string} alarmLogData.triggeredAt - 알람 발생 시간
 * @return {Promise<{alarmLogId: number}>} - 생성된 알람 로그 ID
 */
const createAlarmLog = async (alarmLogData) => {
  // 전달받은 객체에서 sessionId만 꺼낸다.
  const { sessionId } = alarmLogData;

  // 먼저 세션이 실제 DB에 있는지 확인한다.
  const session = await monitoringModel.findSessionById(sessionId);

  // 세션이 없으면 존재하지 않는 세션에 알람 로그가 저장되지 않도록 에러를 던진다.
  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  await monitoringModel.insertAlarmLog(alarmLogData);
};

// 다른 파일에서 service 함수들을 사용할 수 있도록 내보낸다.
module.exports = {
  createSession,
  createSnoreEvent,
  createAlarmLog,
};
