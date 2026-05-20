import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { User, Lock } from "lucide-react";
import InputField from "@components/InputField/InputField";
import mainLogo from "@/assets/images/mainLogo.png";
// import bgVideo from "@/assets/images/loginBack.mp4";
import "./Login.css";

const Login = () => {
  // TODO: 비제어 컴포넌트로 변경
  const [inputId, setInputId] = useState("");
  const [inputPw, setInputPw] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // TODO: preventDefault 제거 후 submit 이벤트로 로그인 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ loginId: inputId, password: inputPw });
      navigate("/");
    } catch (error) {
      // TODO: 로그인 실패 시 사용자에게 피드백 제공 (예: ID 또는 비밀번호 오류)
      console.error("Login failed:", error);
    }
  };

  return (
    <main className="login-page">
      {/* <video autoPlay muted loop playsInline className="background-video">
        <source src={bgVideo} type="video/mp4" />
      </video> */}
      <section className="login-hero">
        <img className="main-logo" src={mainLogo} alt="Kozam" />
        <p>
          Understand your sleep.
          <br />
          Analyze your snore.
        </p>
      </section>
      <form className="login-form" onSubmit={handleSubmit}>
        <InputField
          label="ID"
          icon={<User />}
          value={inputId}
          onChange={(id) => setInputId(id)}
          placeholder="Enter your ID"
          helper="Use the ID associated with your account."
        />
        <InputField
          label="Password"
          icon={<Lock />}
          value={inputPw}
          onChange={(password) => setInputPw(password)}
          placeholder="Enter your password"
          type="password"
          helper="Minimum 8 characters"
          sideHelper="Forgot password?"
        />
        <br />
        <br />
        <button className="primary-btn">Sign in</button>
      </form>
    </main>
  );
};

export default Login;
