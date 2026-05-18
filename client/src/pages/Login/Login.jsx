import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@components/Logo";
import styles from "./Login.module.css";

const Login = () => {
  // TODO: 비제어 컴포넌트로 변경
  const [inputId, setInputId] = useState("");
  const [inputPw, setInputPw] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // TODO: preventDefault 제거 후 submit 이벤트로 로그인 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    await login({ loginId: inputId, password: inputPw });
    navigate("/");
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.logoBlock}>
          <div className={styles.moonWrap}>
            <Logo width="240px" height="180px" />
          </div>
        </header>

        <form className={styles.formArea} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="login-id">
              ID
            </label>
            <div className={styles.inputWrap}>
              <input
                type="text"
                placeholder="Enter your ID"
                id="loginId"
                name="loginId"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                className={styles.input}
                autoComplete="username"
              />
            </div>
            <p className={styles.hint}>
              Use the ID associated with your account.
            </p>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="login-password">
              Password
            </label>
            <div className={styles.inputWrap}>
              <input
                type="password"
                placeholder="Enter your password"
                id="password"
                name="password"
                value={inputPw}
                onChange={(e) => setInputPw(e.target.value)}
                className={styles.input}
                autoComplete="current-password"
              />
            </div>
            <p className={styles.hint}>Minimum 8 characters</p>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.signInBtn}>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
