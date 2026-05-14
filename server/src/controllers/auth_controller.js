const authService = require("../services/auth.service");

exports.login = async (req, res) => {
  try {
    // 프론트가 보낸 값 추출
    const { loginId, password } = req.body;

    // service 호출
    const user = await authService.login(loginId, password);

    // 응답 반환
    res.status(200).json({
      message: "로그인 성공",
      user,
    });
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
};
