/**
 * 사용자 관련 요청을 제어하는 컨트롤러
 */
const userService = require("../services/user_service");

/**
 * 사용자 정보 조회 요청 처리 컨트롤러
 */
exports.getUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "사용자 ID가 필요합니다.",
      });
    }

    if (String(req.params.id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "다른 사용자의 정보에는 접근할 수 없습니다.",
      });
    }

    const userInfo = await userService.getUser({ userId });

    res.status(200).json({
      success: true,
      data: userInfo,
      message: "조회 성공",
    });
  } catch (error) {
    console.error("❌ getUser 에러:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 회원정보 수정 요청 처리 컨트롤러
 */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.userId; // 미들웨어 통해 온 검증된 req.userId 사용

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "인증 정보가 없습니다.",
      });
    }

    const updatedUser = await userService.updateUser(userId, req.body);

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: "회원 정보가 수정되었습니다.",
    });
  } catch (error) {
    console.error("❌ updateUser 에러:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
