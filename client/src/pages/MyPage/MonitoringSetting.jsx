import styles from "./MonitoringSetting.module.css";
import { Mic, Waves, RefreshCcw, Bell, Check } from "lucide-react";

const MonitoringSetting = () => {
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
        <button className={`${styles.switch}`} aria-label="마이크 권한 켜짐">
          <i />
        </button>
      </section>
      <section className={`${styles.settingCard}`}>
        <h2>
          알람 발생 조건 <span>?</span>
        </h2>
        <p>어떤 상황에서 알람을 받을지 선택하세요.</p>
        <Option
          active
          icon={<Waves />}
          title="지속시간 기반"
          text="코골이가 일정 시간 이상 지속되면 알람을 보내요."
        />
        <Option
          icon={<RefreshCcw />}
          title="반복패턴 기반"
          text="코골이 패턴이 반복될 때 알람을 보내요."
        />
        <Option
          icon={<Bell />}
          title="알람 받지 않음"
          text="알람을 받지 않고 분석만 진행해요."
        />
      </section>

      <InfoCard
        title="Kozam은 더 나은 수면을 위해 함께합니다."
        text="모든 설정은 안전하게 보호되며, 언제든 변경할 수 있어요."
      />
    </>
  );
};

function Option({ active = false, icon, title, text }) {
  return (
    <button className={`${styles.option} ${active ? "active" : ""}`}>
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
