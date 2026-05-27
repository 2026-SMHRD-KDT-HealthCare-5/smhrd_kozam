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

    // 2. 모니터링 서비스 호출
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

/**
 * 코골이 이벤트 저장 컨트롤러
 *
 * 1. URL params에서 sessionId 추출
 * 2. body에서 startTime, endTime, avgConfidence 추출
 * 3. 값 검증 후 service에 저장 요청을 보낸다.
 */
const createSnoreEvent = async (req, res) => {
  try {
    // URL에서 sessionId 추출
    const { sessionId } = req.params;

    // 요청 body에서 코골이 이벤트 정보 추출
    const { startTime, endTime, avgConfidence } = req.body;

    // 필수 값 검증
    // avgConfidence는 0도 유효한 값이므로 undefined로 검사한다.
    if (!startTime || !endTime || avgConfidence === undefined) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "startTime, endTime, avgConfidence 값이 필요합니다.",
      });
    }

    // sessionId 숫자 검증
    if (Number.isNaN(Number(sessionId))) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "유효한 sessionId 값을 입력해주세요.",
      });
    }

    // avgConfidence 범위 검증
    if (avgConfidence < 0 || avgConfidence > 1) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "avgConfidence 값은 0과 1 사이여야 합니다.",
      });
    }

    // service에 코골이 이벤트 저장 요청
    // 중요: 여러 인자로 쪼개지 않고 객체 하나로 전달한다.
    await monitoringService.createSnoreEvent({
      sessionId: Number(sessionId),
      startTime,
      endTime,
      avgConfidence,
    });

    return res.status(201).json({
      success: true,
      data: {},
      message: "코골이 이벤트 저장 성공",
    });
  } catch (error) {
    console.error("코골이 이벤트 저장 중 오류:", error);

    // 존재하지 않는 sessionId인 경우
    if (error.message === "세션을 찾을 수 없습니다.") {
      return res.status(404).json({
        success: false,
        data: {},
        message: "존재하지 않는 세션입니다.",
      });
    }

    return res.status(500).json({
      success: false,
      data: {},
      message: "코골이 이벤트 저장 중 오류가 발생했습니다.",
    });
  }
};

/**
 * 알람 로그 저장 컨트롤러
 *
 * 1. URL params에서 sessionId 추출
 * 2. body에서 triggeredAt 추출
 * 3. 값 검증 후 service에 저장 요청을 보낸다.
 * 4. 저장 결과를 클라이언트에게 응답한다.
 */
const createAlarmLog = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { triggeredAt } = req.body;

    if (!sessionId || Number.isNaN(Number(sessionId))) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "유효하지 않은 sessionId 값입니다.",
      });
    }

    if (!triggeredAt) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "triggeredAt 값은 필수입니다.",
      });
    }

    await monitoringService.createAlarmLog({
      sessionId: Number(sessionId),
      triggeredAt,
    });

    return res.status(201).json({
      success: true,
      data: {},
      message: "알람 로그 저장 완료",
    });
  } catch (error) {
    console.error("알람 로그 저장 중 오류:", error);

    if (error.message === "세션을 찾을 수 없습니다.") {
      return res.status(404).json({
        success: false,
        data: {},
        message: "존재하지 않는 세션입니다.",
      });
    }

    return res.status(500).json({
      success: false,
      data: {},
      message: "알람 로그 저장 중 오류가 발생했습니다.",
    });
  }
};

module.exports = {
  createSession,
  createSnoreEvent,
  createAlarmLog,
};
