import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "./component/auth/AuthLayout";
import UserDashboard from "./component/dashboards/UserDashboard";
import ClientDashboard from "./component/dashboards/ClientDashboard";
import HumanAgentDashboard from "./component/dashboards/HumanAgentDashboard";

const User = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      // Migrate any legacy localStorage values to sessionStorage
      try {
        const legacyUserToken = localStorage.getItem("usertoken");
        const legacyUserData = localStorage.getItem("userData");
        if (legacyUserToken && !sessionStorage.getItem("usertoken")) {
          sessionStorage.setItem("usertoken", legacyUserToken);
          localStorage.removeItem("usertoken");
        }
        if (legacyUserData && !sessionStorage.getItem("userData")) {
          sessionStorage.setItem("userData", legacyUserData);
          localStorage.removeItem("userData");
        }
      } catch (_) {
        // ignore migration errors
      }

      const userToken = sessionStorage.getItem("usertoken");
      const clientToken = sessionStorage.getItem("clienttoken");
      const userData = sessionStorage.getItem("userData");
      const clientData = sessionStorage.getItem("clientData");

      console.log("Auth Check:", {
        hasUserToken: !!userToken,
        hasClientToken: !!clientToken,
        hasUserData: !!userData,
        hasClientData: !!clientData,
      });

      // Check for either user or client token
      const token = userToken || clientToken;
      const data = userData || clientData;

      if (token && data) {
        try {
          const parsedData = JSON.parse(data);
          console.log("Parsed auth data:", parsedData);

          setIsAuthenticated(true);
          setUserRole(parsedData.role);

          // Navigate based on role
          console.log("Initializing auth with role:", parsedData.role);
          if (parsedData.role === "client") {
            navigate("/auth/dashboard");
          } else if (parsedData.role === "user") {
            navigate("/auth/dashboard");
          } else if (
            parsedData.role === "humanAgent" ||
            parsedData.role === "HumanAgent" ||
            parsedData.role === "executive"
          ) {
            console.log("HumanAgent detected, navigating to dashboard");
            navigate("/auth/dashboard");
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          clearAuth();
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [navigate]);

  const clearAuth = () => {
    // Clear all possible tokens and data
    sessionStorage.removeItem("usertoken");
    sessionStorage.removeItem("clienttoken");
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("clientData");
    // Cleanup legacy keys just in case
    localStorage.removeItem("usertoken");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
    setUserRole(null);
    setIsLoading(false);
  };

  const handleAuthSuccess = (loginData) => {
    console.log("Login data received:", loginData);

    // Store credentials based on role
    if (loginData.role === "client") {
      sessionStorage.setItem("clienttoken", loginData.token);
      sessionStorage.setItem(
        "clientData",
        JSON.stringify({
          role: loginData.role,
          name: loginData.name,
          email: loginData.email,
          clientId: loginData.clientId || loginData.id || loginData._id, // Add fallbacks for clientId
        })
      );
    } else if (
      loginData.role === "HumanAgent" ||
      loginData.role === "humanAgent" ||
      loginData.role === "executive"
    ) {
      console.log("Storing HumanAgent data in sessionStorage:", loginData);
      sessionStorage.setItem("usertoken", loginData.token);
      sessionStorage.setItem(
        "userData",
        JSON.stringify({
          role: loginData.role,
          name: loginData.name,
          email: loginData.email,
          clientId: loginData.clientId,
          clientEmail: loginData.clientEmail,
          mobileNo: loginData.mobileNo,
          id: loginData.id,
        })
      );
      // Also expose a clienttoken for agent to use client services
      // Prefer a dedicated client token if backend provides it, otherwise reuse the agent token
      try {
        const clientToken = loginData.clientToken || loginData.token;
        if (clientToken) {
          sessionStorage.setItem("clienttoken", clientToken);
        }
      } catch (_) {
        // ignore
      }
    } else {
      sessionStorage.setItem("usertoken", loginData.token);
      sessionStorage.setItem(
        "userData",
        JSON.stringify({
          role: loginData.role,
          name: loginData.name,
          email: loginData.email,
        })
      );
    }

    // Update state and navigate
    setIsAuthenticated(true);
    setUserRole(loginData.role);
    navigate("/auth/dashboard");
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/home");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
              <Navigate to="/auth/dashboard" replace />
            ) : (
              <AuthLayout onLogin={handleAuthSuccess} />
            )
          }
        />

        <Route
          path="login"
          element={<AuthLayout onLogin={handleAuthSuccess} />}
        />

        {isAuthenticated && (
          <>
            {userRole === "user" && (
              <>
                <Route
                  path="dashboard"
                  element={<UserDashboard onLogout={handleLogout} />}
                />
                <Route
                  path="auth/dashboard"
                  element={<UserDashboard onLogout={handleLogout} />}
                />
              </>
            )}
            {userRole === "client" && (
              <>
                <Route
                  path="dashboard"
                  element={
                    <ClientDashboard
                      onLogout={handleLogout}
                      clientId={
                        JSON.parse(sessionStorage.getItem("clientData"))
                          ?.clientId
                      }
                    />
                  }
                />
                <Route
                  path="auth/dashboard"
                  element={
                    <ClientDashboard
                      onLogout={handleLogout}
                      clientId={
                        JSON.parse(sessionStorage.getItem("clientData"))
                          ?.clientId
                      }
                    />
                  }
                />
              </>
            )}
            {(userRole === "HumanAgent" ||
              userRole === "humanAgent" ||
              userRole === "executive") && (
              <>
                <Route
                  path="dashboard"
                  element={
                    <HumanAgentDashboard
                      onLogout={handleLogout}
                      userData={
                        JSON.parse(sessionStorage.getItem("userData")) ||
                        JSON.parse(localStorage.getItem("userData"))
                      }
                    />
                  }
                />
                <Route
                  path="auth/dashboard"
                  element={
                    <HumanAgentDashboard
                      onLogout={handleLogout}
                      userData={
                        JSON.parse(sessionStorage.getItem("userData")) ||
                        JSON.parse(localStorage.getItem("userData"))
                      }
                    />
                  }
                />
              </>
            )}
          </>
        )}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/auth/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default User;
