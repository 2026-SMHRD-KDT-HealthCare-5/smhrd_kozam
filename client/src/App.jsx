import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/router/ProtectedRoute";
import WebContent from "@/layouts/WebContent/WebContent";
import AppWrapper from "@/layouts/AppWrapper/AppWrapper";
import AppMainLayout from "@/layouts/AppMainLayout/AppMainLayout";
import SnoreMonitoring from "@/pages/SnoreMonitoring/SnoreMonitoring";
import Login from "@/pages/Login/Login";
import MyPage from "@/pages/MyPage/MyPage";

function App() {
  return (
    <div className="app">
      <div className="app-content">
        <WebContent />
        <BrowserRouter>
          <Routes>
            <Route element={<AppWrapper />}>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppMainLayout />}>
                  <Route path="/" element={<SnoreMonitoring />} />
                  {/* History */}
                  <Route path="/mypage" element={<MyPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
