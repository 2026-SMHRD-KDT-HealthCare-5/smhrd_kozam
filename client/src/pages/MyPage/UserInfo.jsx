import sleepingPanda from "@/assets/images/sleepingPanda.png";
import { User, Mail, Phone, Ruler, Weight } from "lucide-react";
import { getUserById, updateUser } from "@/api/user";
import { useEffect, useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";

const postures = ["정자세", "측면자세", "엎드린자세"];

const UserInfo = () => {
  const { user: authUser, refreshUser } = useAuth();
  const {
    data: user,
    isLoading,
    isError,
    error,
    execute,
  } = useAsync(getUserById, {
    immediate: false,
  });

  const [posture, setPosture] = useState(null);

  useEffect(() => {
    if (authUser?.userId) {
      execute(authUser.userId);
    }
  }, [authUser?.userId, execute]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const updatedData = Object.fromEntries(formData.entries());

    updatedData.sleepingPosture = posture;

    try {
      const result = await updateUser(updatedData);
      // TODO: 모달 구현
      if (result.success) {
        alert("정보가 수정되었습니다.");
      }
      refreshUser();
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("정보 수정에 실패했습니다.");
    }
  };

  useEffect(() => {
    setPosture(user?.sleepingPosture);
  }, [user]);

  if (isLoading || !user) return <p>로딩중...</p>;

  if (isError) return <p>{error.message}</p>;

  return (
    <form onSubmit={handleSubmit}>
      <section className="profile-card">
        <div className="profile-top">
          <div className="profile-image-wrap">
            <img src={sleepingPanda} alt="프로필" />
          </div>
          <div>
            <h1>
              {user?.loginId} <b>Premium</b>
            </h1>
            <p>Member since {new Date(user?.joinedAt).getFullYear()}</p>
            <div className="mini-stats">
              <span>
                모니터링 기록 <strong>{user?.monitoringCount}회</strong>
              </span>
              <span>
                알람 횟수 <strong>{user?.alarmCount}회</strong>
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
          type="text"
          label="이메일"
          name="email"
          icon={<Mail />}
          defaultValue={user?.email}
        />
        <ProfileInput
          type="text"
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
            icon={<Ruler />}
            defaultValue={user?.height}
            action="cm"
          />
          <ProfileInput
            type="number"
            label="몸무게"
            name="weight"
            icon={<Weight />}
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
