import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";import AdminLoginForm from "./AdminLoginForm";
import AdminRegisterForm from "./AdminRegisterForm";

const AdminAuthLayout = ({ onLogin }) => {
  const location = useLocation();  const navigate = useNavigate();

  // Determine mode from current URL path
  const isRegister = location.pathname.includes("register");
  const [mode, setMode] = useState(isRegister ? "register" : "login");

  const switchToRegister = () => {
    setMode("register");    navigate("/admin/register");
  };

  const switchToLogin = () => {
    setMode("login");    navigate("/admin/login");
  };

  const handleRegisterSuccess = () => {
    setMode("login");    navigate("/admin/login");
  };

  const handleLoginSuccess = (loginData) => {
    onLogin(loginData);
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">Admin Portal</h1>
          <p className="text-gray-600 mt-2">
            Secured access for administrators
          </p>
        </div>

        {mode === "login" ? (
          <AdminLoginForm
            onLogin={handleLoginSuccess}
            switchToRegister={switchToRegister}
          />
        ) : (
          <AdminRegisterForm
            onSuccess={handleRegisterSuccess}
            switchToLogin={switchToLogin}
          />
        )}

        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="text-center">
            {mode === "login" ? (
              <div className="mt-4">
                <p className="text-gray-600">Need to create an account?</p>
                <button
                  onClick={switchToRegister}
                  className="mt-2 inline-block text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                >
                  Register as Admin
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-gray-600">Already have an account?</p>
                <button
                  onClick={switchToLogin}
                  className="mt-2 inline-block text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
                >
                  Log in as Admin
                </button>
              </div>
            )}
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => window.open('/client/login', '_blank', 'noopener,noreferrer')}
              className="text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer text-sm"
            >
              Return to main login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthLayout;
