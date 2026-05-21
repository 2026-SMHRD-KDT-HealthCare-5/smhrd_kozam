/**
 * 사용자 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
const db = require("../config/database");

exports.getUser = async ({ userId }) => {
  const [[userRows], [profileRows], [settingRows], [sessionRows], [alarmRows]] =
    await Promise.all([
      db.query(
        `
        select idx, login_id, nick, email, phone, joined_at 
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
        select use_mic, alarm_condition, is_active, created_at
        from settings
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

  return {
    userId: userRows[0].idx,
    loginId: userRows[0].login_id,
    nick: userRows[0].nick,
    email: userRows[0].email,
    phone: userRows[0].phone,
    joinedAt: userRows[0].joined_at,
    height: profileRows[0].height,
    weight: profileRows[0].weight,
    sleepingPosture: profileRows[0].sleeping_posture,
    useMic: settingRows[0].use_mic,
    alarmCondition: settingRows[0].alarm_condition,
    alarmActive: settingRows[0].is_active,
    monitoringCount: sessionRows[0].count,
    alarmCount: alarmRows[0].count,
  };
};
