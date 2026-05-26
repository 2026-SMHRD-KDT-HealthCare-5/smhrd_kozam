import styles from "./Modal.module.css";

const Modal = ({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
  showCancel = true,
}) => {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>

        <div className={styles.actions}>
          {showCancel && (
            <button className={styles.cancelBtn} onClick={onCancel}>
              {cancelText}
            </button>
          )}

          <button className={styles.confirmBtn} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
