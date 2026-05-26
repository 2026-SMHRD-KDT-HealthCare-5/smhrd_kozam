const monitoringService = require("../services/monitoring_service");

const createSession = async (req, res) => {
  try {
    const { startedAt } = req.body;

    // 1. 필수 값 검증
    if (!startedAt) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "startedAt 값이 필요합니다.",
      });
    }

    // 2. 모니터링 서비스 호출 (기존 코드에서 중괄호 오타로 끊겼던 부분)
    const result = await monitoringService.createSession(startedAt);

    // 3. 성공 응답 반환
    return res.status(201).json({
      success: true,
      data: {
        sessionId: result.sessionId,
      },
      message: "세션 생성 성공",
    });
  } catch (error) {
    console.error("세션 생성 중 오류:", error);

    return res.status(500).json({
      success: false,
      data: {},
      message: "세션 생성 중 오류가 발생했습니다.",
    });
  }
};
module.exports = {
  createSession,
};
