import "./MyPage.css";
import { useState } from "react";
import UserInfo from "./UserInfo";

const MyPage = () => {
  const [profileTab, setProfileTab] = useState("user");

  return (
    <main className="screen">
      <section className="content-stack">
        <div className="tabs">
          <button
            className={profileTab === "user" ? "active" : ""}
            onClick={() => setProfileTab("user")}
          >
            사용자 정보
          </button>
          <button
            className={profileTab === "alarm" ? "active" : ""}
            onClick={() => setProfileTab("alarm")}
          >
            모니터링 설정
          </button>
        </div>
        <UserInfo />
        {/* {profileTab === "user" ? <UserInfo /> : <AlarmSettings />} */}
      </section>
    </main>
  );
};

export default MyPage;
