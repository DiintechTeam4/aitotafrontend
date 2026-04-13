import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
const AiTotaLogo = "/AitotaLogo.png";

const AuthLayout = ({ onLogin, defaultStep = "login" }) => {
  const [step, setStep] = useState(defaultStep);
  const userType = "client";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-4">
          <img src={AiTotaLogo} alt="AiTota" className="h-12 w-12 rounded-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-black">
          {step === "register" ? "Register Your Business" : "Login as Client"}
        </h1>

        {step === "register" ? (
          <RegisterForm
            userType={userType}
            onSuccess={() => setStep("login")}
            switchToLogin={() => setStep("login")}
          />
        ) : (
          <LoginForm
            userType={userType}
            onLogin={onLogin}
            switchToRegister={() => setStep("register")}
          />
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
