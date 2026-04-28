import { useEffect, useState } from "react";
import UserLoginForm from "./UserLoginForm";
const AiTotaLogo = "/AitotaLogo.png";

const UserAuthLayout = ({ onLogin }) => {
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    // Check if workspace info is in sessionStorage (set by WorkspaceDashboard before redirect)
    try {
      const cd = sessionStorage.getItem("pendingWorkspaceData");
      if (cd) {
        const parsed = JSON.parse(cd);
        if (parsed.workspaceName) setWorkspaceName(parsed.workspaceName);
      }
    } catch (_) {}
  }, []);

  const appName = workspaceName || "AiTota";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8 text-center">
            <div className="flex justify-center mb-4">
              <img src={AiTotaLogo} alt={appName} className="h-14 w-14 rounded-2xl object-cover shadow-lg" />
            </div>
            <h1 className="text-2xl font-bold text-white">{appName}</h1>
            <p className="text-indigo-200 text-sm mt-1">Sign in to your account</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <UserLoginForm onLogin={onLogin} />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default UserAuthLayout;
