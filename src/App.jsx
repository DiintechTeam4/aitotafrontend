import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Admin from "./Admin";
import User from "./User";
import "./App.css";
import Superadmin from "./Superadmin";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MakecallLogin from "./pages/MakecallLogin";
import MakecallDashboard from "./pages/MakecallDashboard";
import AgentMobileTalk from "./component/dashboards/components/AgentMobileTalk";
import PublicBusinessDetails from "./component/dashboards/components/PublicBusinessDetails";
import Testing from "./component/dashboards/components/Testing";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import LandingPage2 from './pages/LandingComponents/LandingPage';
// import LandingPage from './pages/LandingPage';

const App = () => {
  useEffect(() => {
    // Migrate legacy human agent token from localStorage to sessionStorage
    try {
      const legacy = localStorage.getItem("usertoken");
      if (legacy && !sessionStorage.getItem("usertoken")) {
        sessionStorage.setItem("usertoken", legacy);
        localStorage.removeItem("usertoken");
      }
      const legacyData = localStorage.getItem("userData");
      if (legacyData && !sessionStorage.getItem("userData")) {
        sessionStorage.setItem("userData", legacyData);
        localStorage.removeItem("userData");
      }

      // Migrate legacy client token/data from localStorage to sessionStorage
      const legacyClientToken = localStorage.getItem("clienttoken");
      if (legacyClientToken && !sessionStorage.getItem("clienttoken")) {
        sessionStorage.setItem("clienttoken", legacyClientToken);
        localStorage.removeItem("clienttoken");
      }
      const legacyClientData = localStorage.getItem("clientData");
      if (legacyClientData && !sessionStorage.getItem("clientData")) {
        sessionStorage.setItem("clientData", legacyClientData);
        localStorage.removeItem("clientData");
      }
    } catch (_) {}

    const token =
      sessionStorage.getItem("usertoken") || localStorage.getItem("usertoken");
    const admintoken = localStorage.getItem("admintoken");
    const superadmintoken = localStorage.getItem("superadmintoken");
    console.log("User/Client token:", token);
    console.log("Admin token:", admintoken);
    console.log("Super Admin token:", superadmintoken);
  }, []);

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
      />
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/makecall/login" element={<MakecallLogin />} />
        <Route path="/makecall/dashboard" element={<MakecallDashboard />} />
        <Route path="/auth/*" element={<User />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/superadmin/*" element={<Superadmin />} />
        <Route path="/agent/:agentId/talk" element={<AgentMobileTalk />} />
        <Route path="/:slug" element={<PublicBusinessDetails />} />
        <Route path="/testing" element={<Testing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
