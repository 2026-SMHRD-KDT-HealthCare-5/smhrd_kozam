import sleepingPanda from "@/assets/images/sleepingPanda.png";
import { User, Mail, Phone, Lock, BedDouble } from "lucide-react";
import { getUserById } from "@/api/user";
import { useEffect, useState } from "react";

const UserInfo = () => {
  /* TODO
    - API 연동 후 user 데이터로 대체 
    - 입력 필드 활성화 및 수정 기능 구현
    - 수면 자세 선택 기능 구현
    - 모니터링 기록 및 수면 시간 데이터 API 연동
  */
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUserById(1);
      setUser(userData);
    };

    fetchUser();
  }, []);

  return (
    <>
      <section className="profile-card">
        <div className="profile-top">
          <img src={sleepingPanda} alt="프로필" />
          <div>
            <h1>
              KOZAM <b>Premium</b>
            </h1>
            <p>Member since {user?.joined_at}</p>
            <div className="mini-stats">
              <span>
                모니터링 기록 <strong>{user?.monitoring_count || 0}회</strong>
              </span>
              <span>
                알람 횟수 <strong>{user?.alarm_count || 0}회</strong>
              </span>
            </div>
          </div>
        </div>

        <ProfileInput
          label="닉네임"
          icon={<User />}
          value={user?.nick || "KOZAM"}
          type="text"
        />
        <ProfileInput
          label="이메일"
          icon={<Mail />}
          value={user?.email || "kozam@sample.com"}
          type="text"
        />
        <ProfileInput
          label="연락처"
          icon={<Phone />}
          value={user?.phone || "010-1234-5678"}
          type="text"
        />

        <div className="two-cols">
          <ProfileInput
            label="키"
            icon={<BedDouble />}
            value={user?.height ? `${user.height} cm` : "cm"}
          />
          <ProfileInput
            label="몸무게"
            icon={<Lock />}
            value={user?.weight ? `${user.weight} kg` : "kg"}
          />
        </div>
        <h2>평소 수면 자세</h2>
        <div className="posture-row">
          <button
            className={user?.sleeping_posture === "정자세" ? "active" : ""}
          >
            정자세
          </button>
          <button
            className={user?.sleeping_posture === "측면자세" ? "active" : ""}
          >
            측면자세
          </button>
          <button
            className={user?.sleeping_posture === "엎드린자세" ? "active" : ""}
          >
            엎드린자세
          </button>
        </div>
      </section>
      <div className="footer-actions">
        <button>취소</button>
        <button>저장하기</button>
      </div>
    </>
  );
};

const ProfileInput = ({ label, icon, value, muted, action, type }) => {
  return (
    <label className="profile-input">
      <span>{label}</span>
      <div>
        {icon}
        <input type={type} value={value} className={muted ? "muted" : ""} />
        {action}
      </div>
    </label>
  );
};

export default UserInfo;
