import { createContext, useCallback, useContext, useState } from "react";

import Modal from "@/components/common/Modal";

const ModalContext = createContext();

const initialModal = {
  isOpen: false,
  title: "",
  description: "",
  confirmText: "확인",
  cancelText: "취소",
  onConfirm: null,
  onCancel: null,
  showCancel: true,
};

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(initialModal);

  const closeModal = useCallback(() => {
    setModal(initialModal);
  }, []);

  const openModal = useCallback((options = {}) => {
    setModal({
      ...initialModal,
      ...options,
      isOpen: true,
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (modal.onConfirm) {
      await modal.onConfirm();
    }

    closeModal();
  }, [modal, closeModal]);

  const handleCancel = useCallback(async () => {
    if (modal.onCancel) {
      await modal.onCancel();
    }

    closeModal();
  }, [modal, closeModal]);

  return (
    <ModalContext.Provider
      value={{
        openModal,
        closeModal,
      }}
    >
      {children}

      <Modal
        open={modal.isOpen}
        title={modal.title}
        description={modal.description}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
