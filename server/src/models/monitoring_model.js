const db = require("../config/database");

/**
 * 세션 생성에 사용할 사용자 설정과 최신 프로필을 조회한다.
 *
 * @param {number} userIdx - 인증된 사용자 ID
 * @return {Promise<Object|null>} 사용자 설정 또는 null
 */
const findSessionSettingsByUserId = async (userIdx) => {
  const sql = `
    SELECT
      u.idx AS user_idx,
      u.alarm_condition,
      p.idx AS profile_idx
    FROM users u
    LEFT JOIN profiles p
      ON p.idx = (
        SELECT latest_profile.idx
        FROM profiles latest_profile
        WHERE latest_profile.user_idx = u.idx
        ORDER BY latest_profile.created_at DESC, latest_profile.idx DESC
        LIMIT 1
      )
    WHERE u.idx = ?
  `;

  const [rows] = await db.query(sql, [userIdx]);

  return rows[0] || null;
};

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
 * @param {number} userIdx - 인증된 사용자 ID
 * @return {Promise<Object|null>} - 세션 정보 또는 null
 */
const findSessionById = async (sessionId, userIdx) => {
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
      AND user_idx = ?
  `;

  const [rows] = await db.query(sql, [sessionId, userIdx]);

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
  const { userIdx, sessionId, triggeredAt, alarmType, alarmContent } =
    alarmLogData;

  const sql = `
    INSERT INTO alarm_logs (
      user_idx,
      session_idx,
      alarm_type,
      alarm_content,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  await db.query(sql, [
    userIdx,
    sessionId,

    // 클라이언트가 alarmType을 보내지 않으면 기본값 사용
    alarmType || "SNORE",

    // 클라이언트가 alarmContent를 보내지 않으면 기본 문구 사용
    alarmContent || "코골이 알람 발생",

    new Date(triggeredAt),
  ]);
};
/**
 * 수면 세션 종료 시간 업데이트
 *
 * 실제 DB 테이블:
 * monitoring_sessions
 *
 * 컬럼 매핑:
 * sessionId → idx
 * endedAt   → end_time
 *
 * @param {Object} sessionEndData - 세션 종료 데이터 객체
 * @param {number} sessionEndData.sessionId - 종료할 세션 ID
 * @param {string} sessionEndData.endedAt - 수면 종료 시간
 * @return {Promise<void>} - 업데이트 후 별도 반환 없음
 */
const updateSessionEndTime = async (sessionEndData, executor = db) => {
  const { sessionId, endedAt } = sessionEndData;

  const sql = `
    UPDATE monitoring_sessions
    SET end_time = ?
    WHERE idx = ?
      AND user_idx = ?
      AND end_time IS NULL
  `;

  const [result] = await executor.query(sql, [
    new Date(endedAt),
    sessionId,
    sessionEndData.userIdx,
  ]);

  if (result.affectedRows === 0) {
    throw new Error("이미 종료된 세션입니다.");
  }
};

/**
 * 세션 ID로 코골이 이벤트 목록 조회
 *
 * 실제 DB 테이블:
 * snoring_events
 *
 * 세션 종료 시 LLM 분석용 데이터로 사용한다.
 *
 * @param {Object} snoreQueryData - 코골이 이벤트 조회 객체
 * @param {number} snoreQueryData.sessionId - 세션 ID
 * @return {Promise<Array>} - 코골이 이벤트 목록
 */
const findSnoreEventsBySessionId = async (snoreQueryData) => {
  const { sessionId } = snoreQueryData;

  const sql = `
    SELECT
      idx,
      session_idx,
      start_time,
      end_time,
      avg_confidence,
      created_at
    FROM snoring_events
    WHERE session_idx = ?
    ORDER BY start_time ASC
  `;

  const [rows] = await db.query(sql, [sessionId]);

  return rows;
};

/**
 * 수면 시간 범위 안에 발생한 알람 로그 조회
 *
 * 실제 DB 테이블:
 * alarm_logs
 *
 * 주의:
 * alarm_logs에는 session_idx가 없으므로
 * user_idx와 created_at 시간 범위로 해당 세션 중 발생한 알람을 찾는다.
 *
 * @param {Object} alarmQueryData - 알람 로그 조회 객체
 * @param {number} alarmQueryData.userIdx - 사용자 ID
 * @param {Date|string} alarmQueryData.startTime - 수면 시작 시간
 * @param {Date|string} alarmQueryData.endTime - 수면 종료 시간
 * @return {Promise<Array>} - 알람 로그 목록
 */
const findAlarmLogsBySessionTime = async (alarmQueryData) => {
  const { userIdx, startTime, endTime } = alarmQueryData;

  const sql = `
    SELECT
      idx,
      user_idx,
      alarm_type,
      alarm_content,
      created_at
    FROM alarm_logs
    WHERE user_idx = ?
      AND created_at >= ?
      AND created_at <= ?
    ORDER BY created_at ASC
  `;

  const [rows] = await db.query(sql, [
    userIdx,
    new Date(startTime),
    new Date(endTime),
  ]);

  return rows;
};

/**
 * profile ID로 프로필 조회
 *
 * 실제 DB 테이블:
 * profiles
 *
 * 세션 종료 시점에 sleep_reports에 저장할
 * height, weight, sleeping_posture 값을 가져온다.
 *
 * @param {number} profileIdx - 조회할 profile ID
 * @return {Promise<Object|null>} - 프로필 정보 또는 null
 */
const findProfileById = async (profileIdx) => {
  const sql = `
    SELECT
      idx,
      user_idx,
      height,
      weight,
      sleeping_posture,
      created_at
    FROM profiles
    WHERE idx = ?
  `;

  const [rows] = await db.query(sql, [profileIdx]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

/**
 * 수면 리포트 생성
 *
 * 실제 DB 테이블:
 * sleep_reports
 *
 * 컬럼 매핑:
 * userId          → user_id
 * sessionIdx      → session_idx
 * feedback        → feedback
 * height          → height
 * weight          → weight
 * sleepingPosture → sleeping_posture
 *
 * feedback 컬럼에는 LLM 응답 객체를 JSON.stringify 한 문자열이 저장된다.
 *
 * 예:
 * {
 *   "title": "어떠한 수면이었어요.",
 *   "content": "피드백 세줄 요약",
 *   "detail": "상세 피드백",
 *   "score": 80
 * }
 *
 * @param {Object} reportData - 리포트 생성 데이터 객체
 * @param {number} reportData.userId - 사용자 ID
 * @param {number} reportData.sessionIdx - 세션 ID
 * @param {string} reportData.feedback - LLM 피드백 JSON 문자열
 * @param {number|null} reportData.height - 키
 * @param {number|null} reportData.weight - 몸무게
 * @param {string|null} reportData.sleepingPosture - 수면 자세
 * @return {Promise<number>} - 생성된 report ID
 */
const insertSleepReport = async (reportData, executor = db) => {
  const { userId, sessionIdx, feedback, height, weight, sleepingPosture } =
    reportData;

  const sql = `
    INSERT INTO sleep_reports (
      user_idx,
      session_idx,
      feedback,
      height,
      weight,
      sleeping_posture
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] = await executor.query(sql, [
    userId,
    sessionIdx,
    feedback,
    height,
    weight,
    sleepingPosture,
  ]);

  return result.insertId;
};

/**
 * 세션 종료 시간 갱신과 리포트 생성은 반드시 함께 반영한다.
 *
 * @param {Object} sessionEndData - 종료 대상 세션 데이터
 * @param {Object} reportData - 생성할 리포트 데이터
 * @return {Promise<number>} 생성된 report ID
 */
const finalizeSessionReport = async (sessionEndData, reportData) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await updateSessionEndTime(sessionEndData, connection);
    const reportId = await insertSleepReport(reportData, connection);
    await connection.commit();
    return reportId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  findSessionSettingsByUserId,
  insertSession,
  findSessionById,
  insertSnoreEvent,
  insertAlarmLog,
  updateSessionEndTime,
  findSnoreEventsBySessionId,
  findAlarmLogsBySessionTime,
  findProfileById,
  insertSleepReport,
  finalizeSessionReport,
};
