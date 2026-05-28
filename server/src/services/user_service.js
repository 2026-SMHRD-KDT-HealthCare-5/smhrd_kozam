/**
 * 사용자 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
const db = require("../config/database");
exports.getUser = async ({ userId }) => {
  const [[userRows], [profileRows], [sessionRows], [alarmRows]] =
    await Promise.all([
      db.query(
        `
        select idx, login_id, nick, email, phone, alarm_condition, joined_at 
        from users
        where idx = ?
        `,
        [userId],
      ),
      db.query(
        `
        select height, weight, sleeping_posture, created_at
        from profiles
        where user_idx = ?
        order by created_at desc
        limit 1
        `,
        [userId],
      ),
      db.query(
        `
        select count(*) as count
        from monitoring_sessions
        where user_idx = ?
        `,
        [userId],
      ),
      db.query(
        `
        select count(*) as count
        from alarm_logs
        where user_idx = ?
        `,
        [userId],
      ),
    ]);

  if (userRows.length === 0) {
    throw new Error("USER_NOT_FOUND");
  }

  const profile = profileRows[0] ?? {};

  return {
    userId: userRows[0].idx,
    loginId: userRows[0].login_id,
    nick: userRows[0].nick,
    email: userRows[0].email,
    phone: userRows[0].phone,
    alarmCondition: userRows[0].alarm_condition,
    joinedAt: userRows[0].joined_at,
    height: profile.height ?? null,
    weight: profile.weight ?? null,
    sleepingPosture: profile.sleeping_posture ?? "",
    monitoringCount: sessionRows[0].count,
    alarmCount: alarmRows[0].count,
  };
};

exports.updateUser = async (userId, updateData) => {
  // 1. users 테이블에 해당하는 필드만 추출
  const userFields = ["nick", "email", "phone", "alarm_condition"];
  const updates = [];
  const values = [];

  Object.entries(updateData).forEach(([key, value]) => {
    // DB 컬럼명으로 매핑 (필요한 경우)
    const dbKey = key === "alarmCondition" ? "alarm_condition" : key;

    if (userFields.includes(dbKey) && value !== undefined) {
      updates.push(`${dbKey} = ?`);
      values.push(value);
    }
  });

  if (updates.length > 0) {
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE idx = ?`;
    await db.query(sql, [...values, userId]);
  }

  // 2. profiles 테이블에 해당하는 필드 추출 (height, weight, sleepingPosture)
  const profileUpdates = [];
  const profileValues = [];

  const profileMapping = {
    height: "height",
    weight: "weight",
    sleepingPosture: "sleeping_posture",
  };

  Object.entries(updateData).forEach(([key, value]) => {
    if (profileMapping[key] && value !== undefined) {
      profileUpdates.push(`${profileMapping[key]} = ?`);
      profileValues.push(value);
    }
  });

  if (profileUpdates.length > 0) {
    // 프로필은 이력 관리를 위해 새로 insert하거나, 최신 row를 update 할 수 있음
    // 여기서는 단순하게 최신 profile이 있으면 update, 없으면 insert 하는 방식을 고려하거나
    // 요구사항에 맞춰 users 테이블 row 업데이트에 집중하되 profile도 처리
    const [rows] = await db.query(
      "SELECT idx FROM profiles WHERE user_idx = ? ORDER BY created_at DESC LIMIT 1",
      [userId],
    );

    if (rows.length > 0) {
      const sql = `UPDATE profiles SET ${profileUpdates.join(", ")} WHERE idx = ?`;
      await db.query(sql, [...profileValues, rows[0].idx]);
    } else {
      const columns = [
        "user_idx",
        ...profileUpdates.map((u) => u.split(" =")[0]),
      ];
      const placeholders = columns.map(() => "?").join(", ");
      const sql = `INSERT INTO profiles (${columns.join(", ")}) VALUES (${placeholders})`;
      await db.query(sql, [userId, ...profileValues]);
    }
  }

  return await exports.getUser({ userId });
};
