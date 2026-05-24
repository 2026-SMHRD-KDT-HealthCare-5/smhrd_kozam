import { useEffect, useState } from "react";
import styles from "./MonitoringSetting.module.css";
import { Mic, Waves, RefreshCcw, Bell, Check } from "lucide-react";
import {
  checkMicPermission,
  requestMicPermission,
} from "@/utils/micPermission";
import { useAuth } from "@/hooks/useAuth";
import { updateUser } from "@/api/user";
import { useModal } from "@/contexts/ModalContext";

const alarmConditions = [
  {
    value: "1",
    icon: <Waves />,
    title: "지속시간 기반",
    text: "코골이가 일정 시간 이상 지속되면 알람을 보내요.",
  },
  {
    value: "2",
    icon: <RefreshCcw />,
    title: "반복패턴 기반",
    text: "코골이 패턴이 반복될 때 알람을 보내요.",
  },
  {
    value: "3",
    icon: <Bell />,
    title: "알람 받지 않음",
    text: "알람을 받지 않고 분석만 진행해요.",
  },
];

const MonitoringSetting = () => {
  const { user, refreshUser } = useAuth();

  const [useMic, setUseMic] = useState(false);
  const [alarmOption, setAlarmOption] = useState(null);
  const [micErrorMessage, setMicErrorMessage] = useState("");
  const { openModal } = useModal();

  const syncMicPermission = async () => {
    const { state } = await checkMicPermission();

    setUseMic(state === "granted");
  };

  const handleMicToggle = async () => {
    const { state } = await checkMicPermission();

    if (state === "prompt") {
      const granted = await requestMicPermission();
      setUseMic(granted);
      if (!granted) return;
      setMicErrorMessage("");
      return;
    }

    if (state === "granted") {
      setMicErrorMessage(
        "마이크 권한 재설정은 브라우저에서 직접 변경만 가능합니다.",
      );
      return;
    }

    setMicErrorMessage(
      "브라우저에서 직접 마이크 권한 재설정 및 새로고침 후 시도해주세요.",
    );
  };

  const handleAlarmOption = async (alarmCondition) => {
    try {
      const result = await updateUser({
        userId: user.userId,
        alarmCondition,
      });

      if (result.success) {
        setAlarmOption(alarmCondition);
        refreshUser();
      }
    } catch (err) {
      openModal({
        title: "알람조건 변경 실패",
        description: "서버 연결이 원활하지 않아요.\n잠시 후 다시 시도해주세요.",
        showCancel: false,
      });
      console.error(err);
    }
  };

  useEffect(() => {
    syncMicPermission();
  }, []);

  useEffect(() => {
    setAlarmOption(user?.alarmCondition ?? null);
  }, [user?.alarmCondition]);

  return (
    <>
      <section className={`${styles.settingCard} ${styles.micCard}`}>
        <Mic />

        <div>
          <h2>
            마이크 권한 <span>(모니터링)</span>
          </h2>
          <p>AI 코골이 감지를 위해 마이크를 사용해요.</p>

          <p
            className={`${styles.errorMessage} ${micErrorMessage ? styles.active : ""}`}
          >
            {micErrorMessage || "\u00A0"}
          </p>
        </div>

        <Toggle isOn={useMic} onToggle={handleMicToggle} />
      </section>

      <section className={styles.settingCard}>
        <h2>
          알람 발생 조건 <span>?</span>
        </h2>
        <p>어떤 상황에서 알람을 받을지 선택하세요.</p>

        {alarmConditions.map((condition) => (
          <Option
            key={condition.value}
            active={alarmOption === condition.value}
            icon={condition.icon}
            title={condition.title}
            text={condition.text}
            onClick={() => handleAlarmOption(condition.value)}
          />
        ))}
      </section>

      <InfoCard
        title="Kozam은 더 나은 수면을 위해 함께합니다."
        text="모든 설정은 안전하게 보호되며, 언제든 변경할 수 있어요."
      />
    </>
  );
};

const Toggle = ({ isOn, onToggle }) => {
  return (
    <label className={styles.toggleContainer}>
      <div className={styles.toggleSwitch}>
        <input
          type="checkbox"
          checked={isOn}
          onChange={onToggle}
          className={styles.toggleInput}
        />

        <span className={styles.toggleSlider} />
      </div>
    </label>
  );
};

function Option({ active = false, icon, title, text, onClick }) {
  return (
    <button
      className={`${styles.option} ${active ? styles.active : ""}`}
      onClick={onClick}
    >
      {icon}

      <span>
        <strong>{title}</strong>
        <br />
        <small>{text}</small>
      </span>

      <i>{active && <Check />}</i>
    </button>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className={styles.infoCard}>
      <Waves />

      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </div>
  );
}

export default MonitoringSetting;
