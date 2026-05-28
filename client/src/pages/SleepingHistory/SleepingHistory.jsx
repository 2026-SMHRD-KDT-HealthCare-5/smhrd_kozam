import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";

import {
  ChevronDown,
  CalendarDays,
  Waves,
  Moon,
  ChevronRight,
  User,
  ShieldCheck,
} from "lucide-react";
import styles from "./SleepingHistory.module.css";
import sleepingPanda from "@/assets/images/sleepingPanda.png";

import { getReport, getReportList } from "@/api/history";
import { useAsync } from "@/hooks/useAsync";
import { convertMsToTime, formatTime } from "@/utils/common";
import ReportSelectModal from "@/components/SleepingHistory/ReportSelectModal";

const TIMELINE_LEGEND = [
  { type: "ALARM", label: "알람 발생", class: "white" },
  { type: "SNORE", label: "코골이 발생", class: "yellow" },
  { type: "NORMAL", label: "일반 수면", class: "purple" },
];

const formatDateKorean = (dateString) => {
  if (!dateString) return;

  const [year, month, day] = dateString.split("-");

  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
};

const SleepingHistory = () => {
  const { reportId: initialReportId } = useParams();

  const { execute: getReportAsync } = useAsync(getReport);
  const { execute: getReportListAsync } = useAsync(getReportList);

  const [currentReportId, setCurrentReportId] = useState(initialReportId);
  const [reportData, setReportData] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const reportListRef = useRef([]);

  const fetchReport = useCallback(
    async (reportId) => {
      if (!reportId) return;

      const response = await getReportAsync(reportId);

      if (!response.success) return;

      setReportData(response.data);
    },
    [getReportAsync],
  );

  const handleSelectReport = (reportId) => {
    if (!reportId) return;
    setCurrentReportId(reportId);
    setIsReportModalOpen(false);
  };

  useEffect(() => {
    fetchReport(currentReportId);
  }, [currentReportId, fetchReport]);

  useEffect(() => {
    const initialize = async () => {
      const response = await getReportListAsync();

      if (!response.success) return;

      reportListRef.current = response.data.reports;
      setCurrentReportId(response.data.lastReportId);
    };

    initialize();
  }, [getReportListAsync]);

  return (
    <main className={styles.screen}>
      <section className={styles.contentStack}>
        <button
          className={styles.dateCard}
          onClick={() => setIsReportModalOpen(true)}
        >
          <span>날짜</span>
          {/* <strong>{selectedDate.label}</strong> */}
          <strong>{formatDateKorean(reportData?.startDate)}</strong>
          <ChevronDown />
          <em>
            <CalendarDays />
            날짜 선택
          </em>
        </button>
        <Timeline graphData={reportData?.graph} />
        <Summary summaryData={reportData?.summary} />
        <Feedback feedbackData={reportData?.feedback} />
        <ProfileRows profileData={reportData?.profile} />
      </section>
      <ReportSelectModal
        open={isReportModalOpen}
        reportList={reportListRef.current}
        selectedReportId={currentReportId}
        onSelect={handleSelectReport}
        onClose={() => setIsReportModalOpen(false)}
      />
      ReportSelectModal
    </main>
  );
};

const Card = ({ title, icon, children }) => {
  return (
    <section className={styles.card}>
      <h2>
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
};

const Timeline = ({ graphData }) => {
  if (!graphData) return;

  const buildTimelineBars = (graph, totalBars = 50) => {
    const start = new Date(graph.startTime).getTime();
    const end = new Date(graph.endTime).getTime();
    const duration = end - start;
    const barDuration = duration / totalBars;

    return Array.from({ length: totalBars }, (_, index) => {
      const barStart = start + index * barDuration;
      const barEnd = barStart + barDuration;

      const snoreDetected = graph.snoreList.some((snore) => {
        const snoreStart = new Date(snore.startTime).getTime();
        const snoreEnd = new Date(snore.endTime).getTime();
        return snoreStart < barEnd && snoreEnd > barStart; // 겹침 여부
      });

      const alarmTriggered = graph.alarmStamps.some((stamp) => {
        const alarmTime = new Date(stamp).getTime();
        return alarmTime >= barStart && alarmTime < barEnd;
      });

      return { id: index, alarmTriggered, snoreDetected };
    });
  };

  const timelineBars = buildTimelineBars(graphData);
  const { hour: startHour, minute: startMinute } = formatTime(
    graphData.startTime,
  );
  const { hour: endHour, minute: endMinute } = formatTime(graphData.endTime);

  return (
    <Card title="수면/코골이 타임라인" icon={<Waves />}>
      <div className={styles.legend}>
        {TIMELINE_LEGEND.map((legend) => {
          return (
            <span key={legend.type}>
              <i className={styles[legend.class]} />
              {legend.label}
            </span>
          );
        })}
      </div>
      <div className={styles.timelineBars}>
        {timelineBars.map((bar) => {
          const barClassName = bar.alarmTriggered
            ? styles.alarm
            : bar.snoreDetected
              ? styles.yellow
              : styles.purple;
          const label = bar.alarmTriggered
            ? "알람 발생"
            : bar.snoreDetected
              ? "코골이 감지"
              : "감지 없음";

          return <span key={bar.id} className={barClassName} title={label} />;
        })}
      </div>
      <div className={styles.sleepRange}>
        <span>{`${startHour}:${startMinute}`}</span>

        <div />
        <span>{`${endHour}:${endMinute}`}</span>
      </div>
    </Card>
  );
};

const Summary = ({ summaryData }) => {
  if (!summaryData) return;

  const { score, sleepDuration, snoreCount, alarmsCount } = summaryData;
  const { hour: durationHour, minute: durationMinute } =
    convertMsToTime(sleepDuration);
  const items = [
    ["총 수면 시간", `${durationHour}시간 ${durationMinute}분`],
    ["코골이 감지", `${snoreCount}회`],
    ["알람 발생", `${alarmsCount}회`],
  ];

  return (
    <Card title="한눈에 보는 수면 요약" icon={<Moon />}>
      <div className={styles.summaryGrid}>
        {/* 1. 왼쪽 점수 링 */}
        <div className={styles.scoreRing}>
          <strong>{score}</strong>
          <span>점</span>
        </div>

        {/* 2. 오른쪽 4개 정보 그리드 (div로 한 번 감싸줍니다) */}
        <div>
          {items.map(([label, value, note]) => (
            <div className={styles.summaryItem} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              {/* 시안처럼 '조용함'일 때는 초록색 등 조건부 서식을 넣으면 더 완벽합니다 */}
              {note && <em>{note}</em>}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const Feedback = ({ feedbackData }) => {
  if (!feedbackData) return;

  const { title, content, detail } = feedbackData;

  return (
    <Card title="AI 수면 피드백" icon={<Waves />}>
      <div className={styles.feedbackRow}>
        <img src={sleepingPanda} alt="잠자는 판다" />
        <div>
          <h3>{title}</h3>
          <p>{content}</p>
          <button>
            자세한 팁 보기 <ChevronRight />
          </button>
        </div>
      </div>
    </Card>
  );
};

const ProfileRows = ({ profileData }) => {
  if (!profileData) return;

  const { height, weight, sleepingPosture, alarmCondition } = profileData;

  const alarmConditionMap = {
    1: "지속시간 기반",
    2: "반복패턴 기반",
    3: "알람 받지 않음",
  };

  const rows = [
    [
      User,
      "사용자 신체 정보",
      "평소수면자세",
      `${height}cm / ${weight}kg`,
      sleepingPosture,
    ],

    [
      ShieldCheck,
      "당시 알람 발생 조건",
      "설정된 알람 방식",
      // "모니터링 설정 기준",
      alarmConditionMap[String(alarmCondition)] ?? "-",
    ],
  ];
  return rows.map(([Icon, title, sub, value, note]) => (
    <div className={styles.historyRow} key={title}>
      <Icon />
      <span>
        <strong>{title}</strong>
        <small>{sub}</small>
      </span>
      <em>
        {value}
        <small>{note}</small>
      </em>
    </div>
  ));
};

export default SleepingHistory;
