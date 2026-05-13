import { Outlet } from "react-router-dom";
import "./AppWrapper.css";

const AppWrapper = () => {
  return (
    <div className="app-wrapper">
      <div className="app-inner">
        <Outlet />
      </div>
    </div>
  );
};

export default AppWrapper;
