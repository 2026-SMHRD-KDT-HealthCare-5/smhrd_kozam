import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { User, Lock } from "lucide-react";
import InputField from "@components/InputField/InputField";
import mainLogo from "@/assets/images/mainLogo.png";
// import bgVideo from "@/assets/images/loginBack.mp4";
import "./Login.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const loginId = formData.get("loginId");
    const password = formData.get("password");

    try {
      await login({ loginId, password });
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <main className="login-page">
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
          name="loginId"
          label="ID"
          icon={<User />}
          placeholder="Enter your ID"
          helper="Use the ID associated with your account."
          required
        />
        <InputField
          name="password"
          label="Password"
          icon={<Lock />}
          placeholder="Enter your password"
          type="password"
          helper="Minimum 8 characters"
          sideHelper="Forgot password?"
          required
        />
        {error && <p className="error-message">{error}</p>}
        <br />
        <button className="primary-btn">Sign in</button>
      </form>
    </main>
  );
};

export default Login;
