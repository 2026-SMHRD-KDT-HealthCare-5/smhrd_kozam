import "./MyPage.css";
import { useState } from "react";
import UserInfo from "./UserInfo";
import MonitoringSetting from "./MonitoringSetting";

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
        {profileTab === "user" ? <UserInfo /> : <MonitoringSetting />}
      </section>
    </main>
  );
};

export default MyPage;
