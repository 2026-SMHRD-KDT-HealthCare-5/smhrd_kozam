/**
 * 사용자 관련 요청을 제어하는 컨트롤러
 */
const authService = require("../services/user_service");

/**
 * 회원정보 수정 요청 처리 컨트롤러
 * @param {Request} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 */
exports.getUser = async (req, res) => {
  // const userInfo = authService.getUser(req.body);

  const userInfo = {
    userId: 1,
    loginId: "hs",
    nick: "해성",
    email: "haexunx@gmail.com",
    phone: "010-2202-5508",
    alarmCondition: "2",
    joinedAt: "2026",
    height: 172,
    weight: 73,
    sleepingPosture: "엎드린자세",
    monitoringCount: 12,
    alarmCount: 50,
  };

  try {
    res.status(200).json({
      success: true,
      data: userInfo,
      message: "",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await authService.updateUser(req.body);

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: "",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updatedSettings = authService.updateSettings(req.body);

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: "",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};
