const db = require("../config/database");

/**
 * 사용자별 report 목록 조회 모델
 *
 * 실제 DB 기준:
 * - sleep_reports.idx = reportId
 * - sleep_reports.session_idx = monitoring_sessions.idx
 * - monitoring_sessions.start_time / end_time으로 수면 시간 계산
 * - snoring_events는 session_idx로 직접 연결
 * - alarm_logs는 session_idx가 없으므로 user_idx + 수면 시간 범위로 매칭
 *
 * @param {Object} historyQueryData - 조회 조건 객체
 * @param {number} historyQueryData.userIdx - 인증된 사용자 ID
 * @return {Promise<Array>} report 목록
 */
const findReports = async (historyQueryData = {}) => {
  const { userIdx } = historyQueryData;

  const sql = `
    SELECT
      sr.idx AS reportId,

      DATE_FORMAT(ms.start_time, '%Y-%m-%d') AS startDate,

      TIMESTAMPDIFF(MICROSECOND, ms.start_time, ms.end_time) / 1000 AS sleepDuration,

      (
        SELECT COUNT(*)
        FROM snoring_events se
        WHERE se.session_idx = ms.idx
      ) AS snoreCount,

      (
        SELECT COUNT(*)
        FROM alarm_logs al
        WHERE al.session_idx = ms.idx
          AND al.created_at >= ms.start_time
          AND al.created_at <= ms.end_time
      ) AS alarmsCount

    FROM sleep_reports sr

    INNER JOIN monitoring_sessions ms
      ON sr.session_idx = ms.idx

    WHERE ms.end_time IS NOT NULL
      AND sr.user_idx = ?

    ORDER BY ms.start_time DESC, sr.idx DESC
  `;

  const [rows] = await db.query(sql, [userIdx]);

  return rows;
};

/**
 * report 상세 기본 데이터 조회 모델
 *
 * 상세 조회에서 필요한 기본 데이터:
 * - reportId
 * - startDate
 * - startTime
 * - endTime
 * - sleepDuration
 * - snoreCount
 * - alarmsCount
 * - feedback
 * - height
 * - weight
 * - sleepingPosture
 * - alarmCondition
 *
 * @param {Object} reportQueryData - report 조회 조건 객체
 * @param {number} reportQueryData.reportId - 조회할 report ID
 * @param {number} reportQueryData.userIdx - 인증된 사용자 ID
 * @return {Promise<Object|null>} report 상세 기본 데이터
 */
const findReportById = async (reportQueryData) => {
  const { reportId, userIdx } = reportQueryData;

  const sql = `
  SELECT
    sr.idx AS reportId,

    DATE_FORMAT(ms.start_time, '%Y-%m-%d') AS startDate,

    ms.start_time AS startTime,

    ms.end_time AS endTime,

    TIMESTAMPDIFF(MICROSECOND, ms.start_time, ms.end_time) / 1000 AS sleepDuration,

    (
      SELECT COUNT(*)
      FROM snoring_events se
      WHERE se.session_idx = ms.idx
    ) AS snoreCount,

    (
      SELECT COUNT(*)
      FROM alarm_logs al
      WHERE al.session_idx = ms.idx
    ) AS alarmsCount,

    sr.feedback AS feedback,

    sr.height AS height,

    sr.weight AS weight,

    sr.sleeping_posture AS sleepingPosture,

    ms.alarm_condition AS alarmCondition

  FROM sleep_reports sr

  INNER JOIN monitoring_sessions ms
    ON sr.session_idx = ms.idx

  WHERE sr.idx = ?
    AND ms.end_time IS NOT NULL
    AND sr.user_idx = ?
`;

  const [rows] = await db.query(sql, [reportId, userIdx]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

/**
 * report에 해당하는 코골이 구간 목록 조회 모델
 *
 * graph.snoreList에 들어갈 데이터를 조회한다.
 *
 * @param {Object} reportQueryData - report 조회 조건 객체
 * @param {number} reportQueryData.reportId - 조회할 report ID
 * @param {number} reportQueryData.userIdx - 인증된 사용자 ID
 * @return {Promise<Array>} 코골이 구간 목록
 */
const findSnoreListByReportId = async (reportQueryData) => {
  const { reportId, userIdx } = reportQueryData;

  const sql = `
    SELECT
      se.start_time AS startTime,
      se.end_time AS endTime
    FROM sleep_reports sr

    INNER JOIN monitoring_sessions ms
      ON sr.session_idx = ms.idx

    INNER JOIN snoring_events se
      ON se.session_idx = ms.idx

    WHERE sr.idx = ?
      AND sr.user_idx = ?

    ORDER BY se.start_time ASC
  `;

  const [rows] = await db.query(sql, [reportId, userIdx]);

  return rows;
};

/**
 * report에 해당하는 알람 발생 시간 목록 조회 모델
 *
 * 현재 alarm_logs에는 session_idx가 없기 때문에
 * report의 session 시간 범위 안에 발생한 user_idx 기준 알람을 조회한다.
 *
 * graph.alarmStamps에 들어갈 데이터를 만든다.
 *
 * @param {Object} reportQueryData - report 조회 조건 객체
 * @param {number} reportQueryData.reportId - 조회할 report ID
 * @param {number} reportQueryData.userIdx - 인증된 사용자 ID
 * @return {Promise<Array>} 알람 발생 시간 목록
 */
const findAlarmStampsByReportId = async (reportQueryData) => {
  const { reportId, userIdx } = reportQueryData;

  const sql = `
  SELECT
    al.created_at AS triggeredAt

  FROM sleep_reports sr

  INNER JOIN monitoring_sessions ms
    ON ms.idx = sr.session_idx

  INNER JOIN alarm_logs al
    ON al.session_idx = ms.idx

  WHERE sr.idx = ?
    AND sr.user_idx = ?
    AND ms.end_time IS NOT NULL

  ORDER BY al.created_at ASC
`;

  const [rows] = await db.query(sql, [reportId, userIdx]);

  return rows;
};

module.exports = {
  findReports,
  findReportById,
  findSnoreListByReportId,
  findAlarmStampsByReportId,
};
