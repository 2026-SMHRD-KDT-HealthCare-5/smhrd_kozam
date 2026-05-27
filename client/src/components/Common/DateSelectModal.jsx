import { CalendarDays, Check } from "lucide-react";
import styles from "./DateSelectModal.module.css";

const DateSelectModal = ({
  open,
  dates,
  selectedDateId,
  onSelect,
  onClose,
}) => {
  if (!open) return null;

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
          {dates.map((date) => {
            const isSelected = date.id === selectedDateId;

            return (
              <button
                type="button"
                key={date.id}
                className={`${styles.dateCard} ${isSelected ? styles.selected : ""}`}
                onClick={() => onSelect(date)}
              >
                <CalendarDays />

                <span>
                  <strong>{date.label}</strong>
                  <small>{date.summary}</small>
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

export default DateSelectModal;
