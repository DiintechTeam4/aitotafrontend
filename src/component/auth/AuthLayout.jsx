import { useState } from "react";
import { Link } from "react-router-dom";
import LoginForm from "./LoginForm";
import AiTotaLogo from "../../../public/AitotaLogo.png";

const AuthLayout = ({ onLogin }) => {
  // Open directly to client login
  const [authState] = useState({
    step: "login",
    userType: "client",
  });

  const handleLoginSuccess = (loginData) => {
    // Delegate navigation to parent (User.jsx) which already handles role-based redirect
    onLogin(loginData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-4">
          <img
            src={AiTotaLogo}
            alt="AiTota"
            className="h-12 w-12 rounded-full object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-black">
          {`Login as ${authState.userType}`}
        </h1>

        <LoginForm
          userType={authState.userType}
          onLogin={handleLoginSuccess}
        />

        <div className="mt-6 border-t border-gray-200 pt-4 flex justify-between text-sm">
          {/* <Link to="/admin" className="text-blue-500 hover:text-blue-700">
            Admin Portal
          </Link>
          <Link
            to="/superadmin"
            className="text-purple-500 hover:text-purple-700"
          >
            Super Admin Portal
          </Link> */}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
