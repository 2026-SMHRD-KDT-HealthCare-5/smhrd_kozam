import Footer from "client/src/components/Footer";
import Header from "client/src/components/Header";
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
