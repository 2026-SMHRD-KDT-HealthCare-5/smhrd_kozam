import { CalendarDays, Check } from "lucide-react";
import styles from "./ReportSelectModal.module.css";
import { convertMsToTime, formatTime } from "@/utils/common";

const formatDateKorean = (dateString) => {
  if (!dateString) return;

  const [year, month, day] = dateString.split("-");

  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
};

const ReportSelectModal = ({
  open,
  reportList,
  selectedReportId,
  onSelect,
  onClose,
}) => {
  if (!open) return;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span>저장된 기록</span>
            <h2>날짜 선택</h2>
          </div>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className={styles.dateGrid}>
          {reportList.map((report) => {
            const isSelected = report.reportId === selectedReportId;
            const { hour, minute } = convertMsToTime(report.sleepDuration);

            return (
              <button
                type="button"
                key={report.reportId}
                className={`${styles.dateCard} ${isSelected ? styles.selected : ""}`}
                onClick={() => onSelect(report.reportId)}
              >
                <CalendarDays />

                <span>
                  <strong>{formatDateKorean(report.startDate)}</strong>
                  <small>{`수면 ${hour}시간 ${minute}분 · 코골이 ${report.snoreCount}회 · 알람 ${report.alarmsCount}회 · 점수 ${report.score}점 `}</small>
                </span>

                {isSelected && <Check />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ReportSelectModal;
