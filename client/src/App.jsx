import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import ProtectedRoute from "./router/ProtectedRoute";
import WebContent from "./layouts/WebContent/WebContent";
import AppWrapper from "./layouts/AppWrapper/AppWrapper";
import SnoreMonitoring from "./pages/SnoreMonitoring/SnoreMonitoring";
import Login from "./pages/Login/Login";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="app">
      <div className="app-content">
        <WebContent />
        <BrowserRouter>
          <Routes>
            <Route element={<AppWrapper />}>
              <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
                <Route path="/" element={<SnoreMonitoring></SnoreMonitoring>} />
              </Route>
              <Route
                path="/login"
                element={<Login setIsLoggedIn={setIsLoggedIn} />}
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
