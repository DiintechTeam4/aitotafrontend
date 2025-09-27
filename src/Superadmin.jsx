import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import SuperAdminAuthLayout from "./component/auth/SuperAdminAuthLayout";
import SuperAdminDashboard from "./component/dashboards/SuperAdminDashboard";

const Superadmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const superAdminToken = localStorage.getItem("superadmintoken");
      const superAdminData = localStorage.getItem("superAdminData");

      if (superAdminToken && superAdminData) {
        try {
          // Check if token is expired
          const isTokenExpired = (token) => {
            if (!token) return true;
            try {
              const base64Url = token.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map(
                    (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                  )
                  .join("")
              );
              const payload = JSON.parse(jsonPayload);
              if (!payload || !payload.exp) return true;
              const nowInSeconds = Math.floor(Date.now() / 1000);
              return payload.exp <= nowInSeconds;
            } catch (e) {
              return true;
            }
          };

          if (isTokenExpired(superAdminToken)) {
            console.log("Super admin token expired, clearing auth");
            clearAuth();
            return;
          }

          const parsedSuperAdminData = JSON.parse(superAdminData);
          if (parsedSuperAdminData.role === "superadmin") {
            setIsAuthenticated(true);
            // Update super admin user data if needed
            localStorage.setItem(
              "superAdminData",
              JSON.stringify({
                ...parsedSuperAdminData,
                name: parsedSuperAdminData.name,
              })
            );
          } else {
            throw new Error("Invalid role");
          }
        } catch (error) {
          console.error("Error validating super admin token:", error);
          clearAuth();
        }
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem("superadmintoken");
    localStorage.removeItem("superAdminData");
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const handleAuthSuccess = (superAdminData) => {
    // Store super admin token and user data
    localStorage.setItem("superadmintoken", superAdminData.token);
    localStorage.setItem(
      "superAdminData",
      JSON.stringify({
        role: superAdminData.role,
        name: superAdminData.name,
        email: superAdminData.email,
      })
    );

    setIsAuthenticated(true);
    console.log("Super Admin authentication successful");
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/superadmin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Routes>
        <Route
          path=""
          element={
            isAuthenticated ? (
              <Navigate to="/superadmin/dashboard" replace />
            ) : (
              <SuperAdminAuthLayout onLogin={handleAuthSuccess} />
            )
          }
        />
        {isAuthenticated && (
          <Route
            path="dashboard"
            element={<SuperAdminDashboard onLogout={handleLogout} />}
          />
        )}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/superadmin/dashboard" replace />
            ) : (
              <SuperAdminAuthLayout onLogin={handleAuthSuccess} />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default Superadmin;
