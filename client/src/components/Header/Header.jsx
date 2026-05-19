import { BarChart3, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import headerLogo from "@/assets/images/headerLogo.png";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <button
        className="center-brand"
        onClick={() => navigate("/")}
        aria-label="모니터링으로 이동"
      >
        <img src={headerLogo} alt="Kozam" />
      </button>

      <div className="header-actions">
        <button
          className="icon-btn"
          // onClick={() => navigate("/history")}
          onClick={() => {}}
          aria-label="히스토리로 이동"
        >
          <BarChart3 />
        </button>
        <button
          className="icon-btn"
          // onClick={() => navigate("/mypage")}
          onClick={() => {}}
          aria-label="마이페이지로 이동"
        >
          <Settings />
        </button>
      </div>
    </header>
  );
};

export default Header;
