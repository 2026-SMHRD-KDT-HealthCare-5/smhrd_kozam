import { useEffect, useState } from "react";
import styles from "./MonitoringSetting.module.css";
import { Mic, Waves, RefreshCcw, Bell, Check } from "lucide-react";
import {
  checkMicPermission,
  requestMicPermission,
} from "client/src/utils/micPermission";
import { useAuth } from "client/src/hooks/useAuth";
import { updateUser } from "client/src/api/user";

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
  const [useMic, setUseMic] = useState(false);
  const [alarmOption, setAlarmOption] = useState(null);
  const { user, refreshUser } = useAuth();

  const handleAlarmOption = async (alarmOption) => {
    const success = await updateUser(user.userId, {
      ...user,
      alarmCondition: alarmOption,
    });

    // if (success) refreshUser();
    if (success) setAlarmOption(alarmOption);
  };

  useEffect(() => {
    const initializeMicPermission = async () => {
      const { state } = await checkMicPermission();
      setUseMic(state === "granted");
    };

    initializeMicPermission();
  }, []);

  useEffect(() => {
    setAlarmOption(user?.alarmCondition);
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
        </div>
        <Toggle
          isOn={useMic}
          onToggle={async () => {
            if (useMic) return;

            const { state: permissionState } = await checkMicPermission();

            if (permissionState === "prompt") {
              const result = await requestMicPermission();
              setUseMic(result);
            } else {
              // TODO: 모달 구현
              console.log("브라우저에서 직접 마이크 권한 재설정 후 시도");
            }
          }}
        />
      </section>
      <section className={`${styles.settingCard}`}>
        <h2>
          알람 발생 조건 <span>?</span>
        </h2>
        <p>어떤 상황에서 알람을 받을지 선택하세요.</p>
        {alarmConditions.map((e) => (
          <Option
            key={e.value}
            active={alarmOption === e.value}
            icon={e.icon}
            title={e.title}
            text={e.text}
            onClick={() => handleAlarmOption(e.value)}
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
    <label className={`${styles.toggleContainer}`}>
      <div className={`${styles.toggleSwitch}`}>
        <input
          type="checkbox"
          checked={isOn}
          onChange={onToggle}
          className={`${styles.toggleInput}`}
          disabled={isOn}
        />
        <span className={`${styles.toggleSlider}`} />
      </div>
    </label>
  );
};

function Option({ active = false, icon, title, text, onClick }) {
  return (
    <button
      className={`${styles.option} ${active ? "active" : ""}`}
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
    <div className={`${styles.infoCard}`}>
      <Waves />
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </div>
  );
}

export default MonitoringSetting;
