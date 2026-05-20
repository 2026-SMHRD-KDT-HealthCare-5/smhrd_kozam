import sleepingPanda from "@/assets/images/sleepingPanda.png";
import { User, Mail, Phone, Lock, BedDouble } from "lucide-react";

const UserInfo = () => {
  /* TODO
    - API 연동 후 user 데이터로 대체 
    - 입력 필드 활성화 및 수정 기능 구현
    - 수면 자세 선택 기능 구현
    - 모니터링 기록 및 수면 시간 데이터 API 연동
  */

  return (
    <>
      <section className="profile-card">
        <div className="profile-top">
          <img src={sleepingPanda} alt="프로필" />
          <div>
            <h1>
              KOZAM <b>Premium</b>
            </h1>
            <p>Member since 2026</p>
            <div className="mini-stats">
              <span>
                총 수면 시간 <strong>128h 30m</strong>
              </span>
              <span>
                모니터링 기록 <strong>12회</strong>
              </span>
              <span>
                알람 사용 <strong>켜짐</strong>
              </span>
            </div>
          </div>
        </div>

        <ProfileInput label="닉네임" icon={<User />} value="KOZAM" />
        <ProfileInput label="이메일" icon={<Mail />} value="kozam@sample.com" />
        <ProfileInput label="연락처" icon={<Phone />} value="010-1234-5678" />

        <div className="two-cols">
          <ProfileInput label="키" icon={<BedDouble />} value="170 cm" />
          <ProfileInput label="몸무게" icon={<Lock />} value="70 kg" />
        </div>
        <h2>평소 수면 자세</h2>
        <div className="posture-row">
          <button className="active">정자세</button>
          <button>측면자세</button>
          <button>엎드린자세</button>
        </div>
      </section>
      <div className="footer-actions">
        <button>취소</button>
        <button>저장하기</button>
      </div>
    </>
  );
};

const ProfileInput = ({ label, icon, value, muted, action }) => {
  return (
    <label className="profile-input">
      <span>{label}</span>
      <div>
        {icon}
        <input value={value} readOnly className={muted ? "muted" : ""} />
        {action}
      </div>
    </label>
  );
};

export default UserInfo;
