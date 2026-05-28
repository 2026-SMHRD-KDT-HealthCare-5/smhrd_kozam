import styles from "./FeedbackDetailModal.module.css";

const FeedbackDetailModal = ({ open, detail, onClose }) => {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <span>AI 수면 분석</span>
            <h2>상세 피드백</h2>
          </div>

          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className={styles.feedbackDetail}>
          <p>{detail}</p>
        </div>
      </section>
    </div>
  );
};

export default FeedbackDetailModal;
