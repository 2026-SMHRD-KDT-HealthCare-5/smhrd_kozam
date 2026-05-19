/**
 * 인증 관련 요청을 제어하는 컨트롤러
 */
const authService = require("../services/auth_service");

/**
 * 로그인 요청 처리 컨트롤러
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 */
exports.login = async (req, res) => {
  try {
    // 1. 요청 본문(body)에서 로그인 정보 추출
    const { loginId, password } = req.body;

    // 2. 인증 서비스 호출하여 비즈니스 로직 수행 (DB 조회 포함)
    const user = await authService.login({ loginId, password });

    // 3. 로그인 성공 시 200 상태코드와 함께 사용자 정보 반환
    res.status(200).json({
      message: "로그인 성공!",
      user: user,
    });
  } catch (error) {
    // 4. 에러 발생 시(아이디 미존재, 비밀번호 불일치 등) 401 상태코드와 에러 메시지 반환
    console.error("❌ 로그인 에러:", error.message);
    res.status(401).json({
      message: error.message,
    });
  }
};
