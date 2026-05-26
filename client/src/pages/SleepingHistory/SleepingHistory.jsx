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
import { useEffect, useState } from "react";
import { getReport, getReportList } from "@/api/history";
import { useRef } from "react";
import { useAsync } from "@/hooks/useAsync";

const SleepingHistory = () => {
  const { reportId: initialReportId } = useParams();
  const { execute: getReportAsync } = useAsync(getReport);
  const { execute: getReportListAsync } = useAsync(getReportList);

  const [reportData, setReportData] = useState({
    reportId: null,
    startDate: "2026-05-26 FAKE",
    sleepDuration: 0,
    startTime: "",
    endTime: "",
    snoreCount: 13,
    alarmsCount: 3,
    alarmCondition: "2",
    alarmStamps: [],
    feedback: {
      title: "",
      content: "",
      detail: "",
    },
    height: null,
    weight: null,
    sleepingPosture: "",
  });

  const currentReportId = useRef(initialReportId);
  const reportListRef = useRef([]);

  // 사용자의 Report 전체 목록 조회 (날짜 선택 모달용)
  const onGetReportList = () => {
    const response = getReportListAsync();
    
    if (!response.success) return;

    // TODO: 여기부터 하기
    reportListRef.current = response.data.reports;
    reportListRef.current = response.data.reports;
  };

  const onGetReport = () => {
    // const reportId = currentReportId.current || ;

    const response = getReportAsync();
    if (response.success) setReportData(response.data);
  };

  useEffect(() => {});

  //
  useEffect(() => {
    onGetReportList();
    onGetReport();
  }, []);

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
        <Timeline />
        <Summary />
        <Feedback />
        <HistoryRows />
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

const Timeline = () => {
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

const Summary = () => {
  const items = [
    ["총 수면 시간", "6시간 12분", "23:58 ~ 06:10"],
    ["코골이 감지", "12회", "보통"],
    ["알람 발생", "3회", "보통"],
    ["평균 소음", "42dB", "조용함"],
  ];
  return (
    <Card title="한눈에 보는 수면 요약" icon={<Moon />}>
      <div className={styles.summaryGrid}>
        {/* 1. 왼쪽 점수 링 */}
        <div className={styles.scoreRing}>
          <strong>82</strong>
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
              <em>{note}</em>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const Feedback = () => {
  return (
    <Card title="AI 수면 피드백" icon={<Waves />}>
      <div className={styles.feedbackRow}>
        <img src={sleepingPanda} alt="잠자는 판다" />
        <div>
          <h3>오늘은 보통 수준의 수면이었어요</h3>
          <p>
            코골이가 일부 구간에서 감지되었어요. 옆으로 눕는 자세와 규칙적인
            취침 시간이 도움이 될 수 있어요.
          </p>
          <button>
            자세한 팁 보기 <ChevronRight />
          </button>
        </div>
      </div>
    </Card>
  );
};

const HistoryRows = () => {
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
