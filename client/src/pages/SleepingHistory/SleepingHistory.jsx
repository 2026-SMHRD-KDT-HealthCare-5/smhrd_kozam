import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";

import {
  ChevronDown,
  CalendarDays,
  Waves,
  Moon,
  ChevronRight,
  Mic,
  Bell,
  User,
  ShieldCheck,
} from "lucide-react";
import styles from "./SleepingHistory.module.css";
import sleepingPanda from "@/assets/images/sleepingPanda.png";

import { getReport, getReportList } from "@/api/history";
import { useAsync } from "@/hooks/useAsync";
import { convertMsToTime, formatTime } from "@/utils/common";

const SleepingHistory = () => {
  const { reportId: initialReportId } = useParams();
  const { execute: getReportAsync } = useAsync(getReport);
  const { execute: getReportListAsync } = useAsync(getReportList);

  const [currentReportId, setCurrentReportId] = useState(initialReportId);
  const [reportData, setReportData] = useState(null);

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
        {/* <button className={styles.dateCard} onClick={onOpenModal}> */}
        <button className={styles.dateCard} onClick={() => {}}>
          <span>날짜</span>
          <strong>{reportData?.startDate}</strong>
          <ChevronDown />
          <em>
            <CalendarDays />
            날짜 선택
          </em>
        </button>
        <Timeline graph={reportData?.graph} />
        <Summary summaryData={reportData?.summary} />
        <Feedback feedbackData={reportData?.feedback} />
        <ProfileRows profileData={reportData?.profile} />
      </section>
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

  const {
    startTime: sleepStartTime,
    endTime: sleepEndTime,
    snoreList,
    alarmStamps,
  } = graphData;

  return (
    <Card title="수면/코골이 타임라인" icon={<Waves />}>
      <div className={styles.legend}>
        <span>
          <i className={styles.yellow} />
          코골이 감지
        </span>
        <span>
          <i />
          알람 발생
        </span>
      </div>
      <div className={styles.timelineBars}>
        {Array.from({ length: 47 }).map((_, index) => (
          <span
            key={index}
            className={index % 9 < 4 ? styles.purple : styles.yellow}
          />
        ))}
      </div>
      <br />
      <div className={styles.sleepRange}>
        <Moon /> <div />
        <span>06:25</span>
      </div>
    </Card>
  );
};

const Summary = ({ summaryData }) => {
  if (!summaryData) return;

  const { score, sleepDuration, startTime, endTime, snoreCount, alarmsCount } =
    summaryData;
  const { hour: durationHour, minute: durationMinute } =
    convertMsToTime(sleepDuration);
  const { hour: startHour, minute: startMinute } = formatTime(startTime);
  const { hour: endHour, minute: endMinute } = formatTime(endTime);
  const items = [
    [
      "총 수면 시간",
      `${durationHour}시간\n${durationMinute}분`,
      `${startHour}:${startMinute} ~ ${endHour}:${endMinute}`,
    ],
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
          <small>수면 점수</small>
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

  const rows = [
    [Mic, "코골이 감지", "총 감지 횟수", "12회", "보통"],
    [Bell, "알람 발생", "총 알람 횟수", "3회", "보통"],
    [
      User,
      "사용자 프로필",
      "등록된 사용자 정보",
      "김코잠",
      "1988.05.20 / 남성",
    ],
    [
      ShieldCheck,
      "당시 알람 발생 조건",
      "알람이 발생한 주요 요인",
      "소음 50 dB 이상",
      "자세 변화 · 코골이 감지",
    ],
  ];
  return rows.map(([Icon, title, sub, value, note]) => (
    <button className={styles.historyRow} key={title}>
      <Icon />
      <span>
        <strong>{title}</strong>
        <small>{sub}</small>
      </span>
      <em>
        {value}
        <small>{note}</small>
      </em>
      <ChevronRight />
    </button>
  ));
};

export default SleepingHistory;
