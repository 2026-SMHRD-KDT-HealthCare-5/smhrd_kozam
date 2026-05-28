const historyService = require("../services/history_service");

/**
 * 사용자별 report 목록 조회 컨트롤러
 *
 * Endpoint:
 * GET /api/history/reports
 */
const getReports = async (req, res) => {
  try {
    const result = await historyService.getReports({
      userIdx: Number(req.userId),
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "",
    });
  } catch (error) {
    console.error("리포트 목록 조회 중 오류:", error);

    return res.status(500).json({
      success: false,
      data: {},
      message: "리포트 목록 조회 중 오류가 발생했습니다.",
    });
  }
};

/**
 * report 데이터 상세 조회 컨트롤러
 *
 * Endpoint:
 * GET /api/history/reports/:reportId
 */
const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    // reportId 숫자 검증
    if (!reportId || Number.isNaN(Number(reportId))) {
      return res.status(400).json({
        success: false,
        data: {},
        message: "유효하지 않은 reportId 값입니다.",
      });
    }

    const result = await historyService.getReportById({
      reportId: Number(reportId),
      userIdx: Number(req.userId),
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "",
    });
  } catch (error) {
    console.error("리포트 상세 조회 중 오류:", error);

    if (error.message === "리포트를 찾을 수 없습니다.") {
      return res.status(404).json({
        success: false,
        data: {},
        message: "존재하지 않는 리포트입니다.",
      });
    }

    return res.status(500).json({
      success: false,
      data: {},
      message: "리포트 상세 조회 중 오류가 발생했습니다.",
    });
  }
};

module.exports = {
  getReports,
  getReportById,
};
