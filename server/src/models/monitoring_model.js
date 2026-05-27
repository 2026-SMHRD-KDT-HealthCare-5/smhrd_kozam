const db = require("../config/db");

/**
 * 수면 세션 저장
 *
 * 실제 DB 테이블:
 * monitoring_sessions
 *
 * 컬럼 매핑:
 * userIdx         → user_idx
 * profileIdx      → profile_idx
 * startedAt       → start_time
 * alarmCondition  → alarm_condition
 *
 * @param {Object} sessionData - 세션 생성 데이터 객체
 * @param {number} sessionData.userIdx - 사용자 ID
 * @param {number} sessionData.profileIdx - 프로필 ID
 * @param {string} sessionData.startedAt - 수면 시작 시간
 * @param {string} sessionData.alarmCondition - 알람 조건
 * @return {Promise<number>} - 생성된 세션 ID
 */
const insertSession = async (sessionData) => {
  const { userIdx, profileIdx, startedAt, alarmCondition } = sessionData;

  const sql = `
    INSERT INTO monitoring_sessions (
      user_idx,
      profile_idx,
      start_time,
      alarm_condition
    )
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await db.query(sql, [
    userIdx,
    profileIdx,
    new Date(startedAt),
    alarmCondition,
  ]);

  return result.insertId;
};

/**
 * sessionId로 세션 조회
 *
 * 실제 DB 테이블:
 * monitoring_sessions
 *
 * @param {number} sessionId - 조회할 세션 ID
 * @return {Promise<Object|null>} - 세션 정보 또는 null
 */
const findSessionById = async (sessionId) => {
  const sql = `
    SELECT
      idx,
      user_idx,
      profile_idx,
      start_time,
      end_time,
      alarm_condition,
      created_at
    FROM monitoring_sessions
    WHERE idx = ?
  `;

  const [rows] = await db.query(sql, [sessionId]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

/**
 * 코골이 이벤트 저장
 *
 * 실제 DB 테이블:
 * snoring_events
 *
 * 컬럼 매핑:
 * sessionId     → session_idx
 * startTime     → start_time
 * endTime       → end_time
 * avgConfidence → avg_confidence
 *
 * @param {Object} snoreEventData - 코골이 이벤트 데이터 객체
 * @param {number} snoreEventData.sessionId - 세션 ID
 * @param {string} snoreEventData.startTime - 코골이 시작 시간
 * @param {string} snoreEventData.endTime - 코골이 종료 시간
 * @param {number} snoreEventData.avgConfidence - 평균 신뢰도
 * @return {Promise<void>} - 저장 후 별도 반환 없음
 */
const insertSnoreEvent = async (snoreEventData) => {
  const { sessionId, startTime, endTime, avgConfidence } = snoreEventData;

  const sql = `
    INSERT INTO snoring_events (
      session_idx,
      start_time,
      end_time,
      avg_confidence
    )
    VALUES (?, ?, ?, ?)
  `;

  await db.query(sql, [
    sessionId,
    new Date(startTime),
    new Date(endTime),
    avgConfidence,
  ]);
};

/**
 * 알람 로그 저장
 *
 * 실제 DB 테이블:
 * alarm_logs
 *
 * 현재 alarm_logs에는 session_idx가 없다.
 * 따라서 세션에서 가져온 user_idx를 저장한다.
 *
 * 컬럼 매핑:
 * userIdx       → user_idx
 * alarmType     → alarm_type
 * alarmContent  → alarm_content
 * triggeredAt   → created_at
 *
 * @param {Object} alarmLogData - 알람 로그 데이터 객체
 * @param {number} alarmLogData.userIdx - 사용자 ID
 * @param {string} alarmLogData.triggeredAt - 알람 발생 시간
 * @param {string} [alarmLogData.alarmType] - 알람 타입
 * @param {string} [alarmLogData.alarmContent] - 알람 내용
 * @return {Promise<void>} - 저장 후 별도 반환 없음
 */
const insertAlarmLog = async (alarmLogData) => {
  const { userIdx, triggeredAt, alarmType, alarmContent } = alarmLogData;

  const sql = `
    INSERT INTO alarm_logs (
      user_idx,
      alarm_type,
      alarm_content,
      created_at
    )
    VALUES (?, ?, ?, ?)
  `;

  await db.query(sql, [
    userIdx,

    // 클라이언트가 alarmType을 보내지 않으면 기본값 사용
    alarmType || "SNORE",

    // 클라이언트가 alarmContent를 보내지 않으면 기본 문구 사용
    alarmContent || "코골이 알람 발생",

    new Date(triggeredAt),
  ]);
};

module.exports = {
  insertSession,
  findSessionById,
  insertSnoreEvent,
  insertAlarmLog,
};
