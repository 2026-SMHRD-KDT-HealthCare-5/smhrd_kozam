/**
 * 인증 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
const db = require("../config/database");

/**
 * 로그인 처리 서비스
 * @param {Object} param0 - 로그인 정보 (loginId, password)
 * @returns {Object} 로그인 성공 시 사용자 정보
 */
exports.login = async ({ loginId, password }) => {
  console.log("🚀 서비스 진입! DB 조회 시작 - 입력한 ID:", loginId);

  try {
    // 1. DB에서 사용자 아이디로 정보 조회 (login_id 컬럼 사용)
    const sql = "SELECT * FROM users WHERE login_id = ?";
    const [rows] = await db.query(sql, [loginId]);

    console.log("🔎 DB에서 꺼내온 데이터:", rows);

    // 2. 해당 아이디를 가진 사용자가 없는 경우 예외 처리
    if (rows.length === 0) {
      throw new Error("아이디가 존재하지 않습니다.");
    }

    const user = rows[0];

    // 3. 비밀번호 비교 (현재 DB 데이터는 평문 '123' 형태로 가정)
    if (password !== user.password) {
      throw new Error("비밀번호가 틀렸습니다.");
    }

    // 4. 로그인 성공 시 필요한 사용자 정보만 반환
    return {
      userId: user.idx,
      loginId: user.login_id,
      nick: user.nick,
    };
  } catch (error) {
    // 에러 발생 시 상위 컨트롤러로 던짐
    throw error;
  }
};
