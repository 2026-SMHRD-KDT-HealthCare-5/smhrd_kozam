const db = require("../config/db");

/**
 * 수면 세션 저장
 */
const insertSession = async (startedAt) => {
  const sql = `
    INSERT INTO sleep_sessions (start_time)
    VALUES (?)
  `;

  const [result] = await db.query(sql, [new Date(startedAt)]);

  return result.insertId;
};

/**
 * sessionId로 세션 조회
 */
const findSessionById = async (sessionId) => {
  const sql = `
    SELECT id, start_time, end_time, created_at
    FROM sleep_sessions
    WHERE id = ?
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
 * service에서 4개 인자를 따로 넘기므로
 * model도 4개 인자로 받는다.
 */
const insertSnoreEvent = async (
  sessionId,
  startTime,
  endTime,
  avgConfidence,
) => {
  const sql = `
    INSERT INTO snore_events (
      session_id,
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
 */
const insertAlarmLog = async (sessionId, triggeredAt) => {
  const sql = `
    INSERT INTO alarm_logs (
      session_id,
      triggered_at
    )
    VALUES (?, ?)
  `;

  await db.query(sql, [sessionId, new Date(triggeredAt)]);
};

module.exports = {
  insertSession,
  findSessionById,
  insertSnoreEvent,
  insertAlarmLog,
};
