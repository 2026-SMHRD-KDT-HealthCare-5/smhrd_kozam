import sleepingPanda from "@/assets/images/sleepingPanda.png";
import { User, Mail, Phone, Lock, BedDouble } from "lucide-react";
import { getUserById } from "@/api/user";
import { useEffect, useState } from "react";
import { useAsync } from "@/hooks/useAsync";

const postures = ["정자세", "측면자세", "엎드린자세"];

const UserInfo = () => {
  /* TODO
    - API 연동 후 user 데이터로 대체 
    - 입력 필드 활성화 및 수정 기능 구현
    - 수면 자세 선택 기능 구현
    - 모니터링 기록 및 수면 시간 데이터 API 연동
  */
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useAsync(() => getUserById(1), {
    immediate: true,
  });
  const [posture, setPosture] = useState(null);

  useEffect(() => {
    if (user?.sleeping_posture) {
      setPosture(user.sleeping_posture);
    }
  }, [user?.sleeping_posture]);

  useEffect(() => {
    setPosture(user?.sleeping_posture);
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const updatedData = Object.fromEntries(formData.entries());

    updatedData.sleeping_posture = posture;

    // TODO: updatedData로 API 연동
  };

  if (isLoading) return <p>로딩중...</p>;

  if (isError) return <p>{error.message}</p>;

  return (
    <form onSubmit={handleSubmit}>
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
                모니터링 기록 <strong>{user?.monitoring_count}회</strong>
              </span>
              <span>
                알람 횟수 <strong>{user?.alarm_count}회</strong>
              </span>
            </div>
          </div>
        </div>

        <ProfileInput
          type="text"
          label="닉네임"
          name="nick"
          icon={<User />}
          defaultValue={user?.nick}
        />
        <ProfileInput
          type="email"
          label="이메일"
          name="email"
          icon={<Mail />}
          defaultValue={user?.email}
        />
        <ProfileInput
          type="tel"
          label="연락처"
          name="phone"
          icon={<Phone />}
          defaultValue={user?.phone}
        />

        <div className="two-cols">
          <ProfileInput
            type="number"
            label="키"
            name="height"
            icon={<BedDouble />}
            defaultValue={user?.height}
            action="cm"
          />
          <ProfileInput
            type="number"
            label="몸무게"
            name="weight"
            icon={<Lock />}
            defaultValue={user?.weight}
            action="kg"
          />
        </div>
        <h2>평소 수면 자세</h2>
        <div className="posture-row">
          {postures.map((option) => {
            return (
              <button
                key={option}
                type="button"
                className={posture === option ? "active" : ""}
                onClick={() => setPosture(option)}
              >
                {option}
              </button>
            );
          })}
        </div>
      </section>
      <div className="footer-actions">
        {/* <button>취소</button> */}
        <button>저장하기</button>
      </div>
    </form>
  );
};

const ProfileInput = ({
  label,
  icon,
  defaultValue,
  action,
  name,
  type = "text",
}) => {
  return (
    <label className="profile-input">
      <span>{label}</span>
      <div>
        {icon}
        <input type={type} defaultValue={defaultValue} name={name} />
        {action}
      </div>
    </label>
  );
};

export default UserInfo;
