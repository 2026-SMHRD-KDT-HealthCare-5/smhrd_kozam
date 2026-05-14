import { useContext } from "react";
import AuthContext from "../../contexts/AuthContext";

const Login = () => {
  const { setIsLoggedIn } = useContext(AuthContext);
  return <div>Login</div>;
};

export default Login;
