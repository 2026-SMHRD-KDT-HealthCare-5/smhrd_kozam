/**
 * 사용자 관련 요청을 제어하는 컨트롤러
 */
const authService = require("../services/user_service");

/**
 * 회원정보 수정 요청 처리 컨트롤러
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 */
exports.updateUser = async (req, res) => {
  try {
    // 1. 요청 본문(body)에서 업데이트할 유저 정보 수집
    const { loginId, password } = req.body;

    // 2. 회원정보 수정 서비스 호출하여 비즈니스 로직 수행 (DB 조작 포함)
    const user = await authService.login({ loginId, password });

    // 3. 로그인 성공 시 200 상태코드와 함께 사용자 정보 반환
    res.status(200).json({
      message: "로그인 성공!",
      user: user,
    });
  } catch (error) {
    // 4. 에러 발생 시 401 상태코드와 에러 메시지 반환
    console.error("❌ 로그인 에러:", error.message);
    res.status(401).json({
      message: error.message,
    });
  }
};

exports.updateSettings = async (req, res) => {
  const data = {
    userId: 1,
    useMic: true,
    alarmCondition: "2",
    alarmActive: true,
  };

  try {
    res.status(200).json({
      success: true,
      data: data,
      message: "",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUser = async (req, res) => {
  // authService.getUser();

  const data = {
    userId: 1,
    loginId: "hs",
    nick: "해성",
    email: "haexunx@gmail.com",
    phone: "010-2202-5508",
    joinedAt: "2026",
    height: 172,
    weight: 73,
    sleepingPosture: "엎드린자세",
    useMic: true,
    alarmCondition: "2",
    alarmActive: true,
    monitoringCount: 12,
    alarmCount: 50,
  };

  try {
    res.status(200).json({
      success: true,
      data: data,
      message: "",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};
