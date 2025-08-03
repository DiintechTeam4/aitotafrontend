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
      const userToken = localStorage.getItem("usertoken");
      const clientToken = sessionStorage.getItem("clienttoken");
      const userData = localStorage.getItem("userData");
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
          } else if (parsedData.role === "humanAgent") {
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
    localStorage.removeItem("usertoken");
    sessionStorage.removeItem("clienttoken");
    localStorage.removeItem("userData");
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("clientData");
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
    } else if (loginData.role === "HumanAgent") {
      console.log("Storing HumanAgent data in localStorage:", loginData);
      localStorage.setItem("usertoken", loginData.token);
      localStorage.setItem(
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
    } else {
      localStorage.setItem("usertoken", loginData.token);
      localStorage.setItem(
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
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/auth/dashboard" replace />
            ) : (
              <AuthLayout onLogin={handleAuthSuccess} />
            )
          }
        />

        {isAuthenticated ? (
          <>
            {userRole === "user" && (
              <>
                <Route
                  path="/dashboard"
                  element={<UserDashboard onLogout={handleLogout} />}
                />
                <Route
                  path="/auth/dashboard"
                  element={<UserDashboard onLogout={handleLogout} />}
                />
              </>
            )}
            {userRole === "client" && (
              <>
                <Route
                  path="/dashboard"
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
                  path="/auth/dashboard"
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
            {(userRole === "HumanAgent" || userRole === "humanAgent") && (
              <>
                <Route
                  path="/dashboard"
                  element={
                    <HumanAgentDashboard
                      onLogout={handleLogout}
                      userData={
                        JSON.parse(localStorage.getItem("userData")) ||
                        JSON.parse(sessionStorage.getItem("userData"))
                      }
                    />
                  }
                />
                <Route
                  path="/auth/dashboard"
                  element={
                    <HumanAgentDashboard
                      onLogout={handleLogout}
                      userData={(() => {
                        const localData = localStorage.getItem("userData");
                        console.log(
                          "HumanAgentDashboard - localStorage data:",
                          localData
                        );

                        if (localData) {
                          const parsedData = JSON.parse(localData);
                          console.log(
                            "HumanAgentDashboard - parsed data:",
                            parsedData
                          );
                          return parsedData;
                        } else {
                          console.error("No userData found in localStorage!");
                          return null;
                        }
                      })()}
                    />
                  }
                />
              </>
            )}
          </>
        ) : (
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </div>
  );
};

export default User;
