// DB 쿼리를 직접 실행하는 MODEL 파일 불러옴
// SERVICE 는  controller 와 model 사이에서 비지니스 로직 담당
const monitoringModel = require("../models/monitoring_model");

/**
 * 수면 세션 생성 서비스
 * 1. controller 에서 받은 startedAt 값을 model 로 전달
 * 2. DB에 세션을 저장한 뒤 생성된 sessionId를 반환
 *
 * @param {string} startedAt - 수면 시작 시간
 * @return {Promise<{sessionId: number}>} - 생성된 세션의 ID
 *
 */
const createSession = async (startedAt) => {
  // model의 실제 DB insert 작업을 요청한다.
  const sessionId = await monitoringModel.insertSession(startedAt);

  // controller 로 반환할 데이터 형태를 정리한다.
  return { sessionId };
};
/** 코골이 이벤트 저장
 * 1. 해당 sessionId가 존재하는지 확인
 * 2. 존재하면 snore_events  테이블에 저장
 *
 * @param {Object} snoreEventData - 코골이 이벤트 데이터 객체
 * @param {number} snoreEventData.sessionId - 이벤트가 속한 세션의 고유ID(어떤수면중에 발생했는지)
 * @param {string} snoreEventData.startTime - 코골이 이벤트 시작 시간
 * @param {string} snoreEventData.endTime - 코골이 이벤트 종료 시간
 * @param {number} snoreEventData.avgConfidence - 코골이 이벤트의 평균 신뢰도(0~1사이값)
 * @return {Promise<void>} - 저장 완료 후 별도의 반환 값 없음
 */
const createSnoreEvent = async (
  sessionId,
  startTime,
  endTime,
  avgConfidence,
) => {
  // 먼저 세션이 실제 DB에 있는지 확인
  const session = await monitoringModel.findSessionById(sessionId);
  //세션이 없으면 controller에서 404로 처리할 수 있따록 에러 던지기
  if (!session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }

  // 세션이 존재하면 코골이 이벤트를 저장한다
  await monitoringModel.insertSnoreEvent({
    sessionId,
    startTime,
    endTime,
    avgConfidence,
  });
};

// 다른 파일에서 createSession 함수를 사용할 수 있도록 내보낸다.
module.exports = {
  createSession,
  createSnoreEvent,
};
