import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import ProtectedRoute from "./router/ProtectedRoute";
import WebContent from "./layouts/WebContent/WebContent";
import AppWrapper from "./layouts/AppWrapper/AppWrapper";
import SnoreMonitoring from "./pages/SnoreMonitoring/SnoreMonitoring";
import Login from "./pages/Login/Login";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <div className="app">
      <div className="app-content">
        <WebContent />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<AppWrapper />}>
                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/"
                    element={<SnoreMonitoring></SnoreMonitoring>}
                  />
                </Route>
                <Route path="/login" element={<Login />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
