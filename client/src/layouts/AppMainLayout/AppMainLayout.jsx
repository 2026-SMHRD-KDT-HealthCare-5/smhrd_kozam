import Footer from "@components/Footer";
import Header from "@components/Header/Header";
import { Outlet } from "react-router-dom";

const AppMainLayout = () => {
  return (
    <div className="app-main-layout">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppMainLayout;
