import idlePanda from "@/assets/images/idlePanda.png";
import runningPanda from "@/assets/images/startPanda.png";
import finishingPanda from "@/assets/images/thinkingPanda.png";
import stoppedPanda from "@/assets/images/happyPanda.png";
import { Moon, Square, Sun } from "lucide-react";

export const MONITORING_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  FINISHING: "finishing",
  STOPPED: "stopped",
};

export const STATUS_CONFIG = {
  [MONITORING_STATUS.IDLE]: {
    text: "모니터링 준비 완료",
    image: idlePanda,
    button: {
      label: "모니터링 시작",
      description: "클릭하고 수면 분석을 시작해요",
      icon: Moon,
    },
  },
  [MONITORING_STATUS.RUNNING]: {
    text: "모니터링중",
    image: runningPanda,
    button: {
      label: "모니터링 중지",
      description: "클릭하고 모니터링을 종료해요",
      icon: Square,
    },
  },
  [MONITORING_STATUS.FINISHING]: {
    text: "오늘의 수면 AI 분석중...",
    image: finishingPanda,
    button: {
      label: "수면 분석중...",
      description: "잠시만 기다려주시면 분석 결과가 나옵니다",
      icon: Square,
    },
  },
  [MONITORING_STATUS.STOPPED]: {
    text: "수면 분석 완료!",
    image: stoppedPanda,
    button: {
      label: "분석 결과 보러가기",
      description: "클릭하고 오늘의 수면 분석 결과를 확인해요",
      icon: Sun,
    },
  },
};

export const ALARM_CONDITION_TEXT = {
  1: "지속시간 기반",
  2: "반복패턴 기반",
  3: "알람 받지 않음",
};
