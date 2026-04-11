/**
 * ============================================================
 *  AITOTA — Central Route Configuration
 * ============================================================
 *
 *  URL Structure:
 *  ─────────────────────────────────────────────────────────
 *  LANDING
 *    /                          → Landing Home
 *    /landing                   → Redirect → /
 *    /landing/page              → Redirect → /
 *    /about                     → About
 *    /features                  → Features
 *    /services                  → Services
 *    /contact                   → Contact
 *    /privacy                   → Privacy
 *
 *  AUTH — LOGIN PAGES
 *    /admin/login               → Admin Login
 *    /client/login              → Client Login
 *    /human-agents/login        → Human Agent Login
 *    /superadmin/login          → Superadmin Login
 *
 *  DASHBOARDS (protected)
 *    /admin/dashboard           → Admin Dashboard
 *    /client/dashboard          → Client Dashboard
 *    /human-agents/dashboard    → Human Agent Dashboard
 *    /superadmin/dashboard      → Superadmin Dashboard
 *
 *  OTHER
 *    /makecall/login            → Makecall Login
 *    /makecall/dashboard        → Makecall Dashboard
 *    /agent/:agentId/talk       → Agent Mobile Talk
 *    /testing                   → Testing Page
 *    /:slug                     → Public Business Details
 *    *                          → Redirect → /
 * ============================================================
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── Landing Pages ──────────────────────────────────────────
import LandingHome      from "../pages/Home";
import AitotaAbout      from "../aitota-pages/About";
import AitotaFeatures   from "../aitota-pages/Features";
import AitotaServices   from "../aitota-pages/Services";
import AitotaContact    from "../aitota-pages/Contact";
import AitotaPrivacy    from "../aitota-pages/Privacy";

// ── Landing Layout Components ──────────────────────────────
import AitotaNavbar     from "../aitota-components/Navbar";
import AitotaFooter     from "../aitota-components/Footer";
import AitotaCustomCursor from "../aitota-components/CustomCursor";
import AitotaBottomNav  from "../aitota-components/BottomNav";

// ── Auth Layouts ───────────────────────────────────────────
import AdminAuthLayout      from "../component/auth/AdminAuthLayout";
import AuthLayout           from "../component/auth/AuthLayout";
import SuperAdminAuthLayout from "../component/auth/SuperAdminAuthLayout";

// ── Dashboards ─────────────────────────────────────────────
import AdminDashboard      from "../component/dashboards/AdminDashboard";
import ClientDashboard     from "../component/dashboards/ClientDashboard";
import HumanAgentDashboard from "../component/dashboards/HumanAgentDashboard";
import SuperAdminDashboard from "../component/dashboards/SuperAdminDashboard";

// ── Other Pages ────────────────────────────────────────────
import MakecallLogin        from "../pages/MakecallLogin";
import MakecallDashboard    from "../pages/MakecallDashboard";
import AgentMobileTalk      from "../component/dashboards/components/AgentMobileTalk";
import PublicBusinessDetails from "../component/dashboards/components/PublicBusinessDetails";
import Testing              from "../component/dashboards/components/Testing";

// ── Preloader ──────────────────────────────────────────────
import Preloader from "./Preloader";

// ── Auth Helpers ───────────────────────────────────────────
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(
      decodeURIComponent(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );
    return !payload?.exp || payload.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
};

// ── Landing pages list ─────────────────────────────────────
const LANDING_PATHS = ["/", "/about", "/features", "/services", "/contact", "/privacy"];

// ── Protected Route wrapper ────────────────────────────────
function ProtectedRoute({ isAuth, redirectTo, children }) {
  return isAuth ? children : <Navigate to={redirectTo} replace />;
}

// ── Loading Spinner ────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050510" }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#00e5ff", borderRightColor: "#8b5cf6" }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════════════
function AdminRoutes() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admintoken");
    const data  = localStorage.getItem("adminData");
    if (token && data && !isTokenExpired(token)) {
      try {
        if (JSON.parse(data).role === "admin") setIsAuth(true);
        else clearAuth();
      } catch { clearAuth(); }
    }
    setLoading(false);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem("admintoken");
    localStorage.removeItem("adminData");
    setIsAuth(false);
  };

  const handleLogin = (data) => {
    // Clear any stale tokens before saving new ones
    localStorage.removeItem("admintoken");
    localStorage.removeItem("adminData");
    localStorage.setItem("admintoken", data.token);
    localStorage.setItem("adminData", JSON.stringify({ role: data.role, name: data.name, email: data.email }));
    setIsAuth(true);
    navigate("/admin/dashboard");
  };

  const handleLogout = () => { clearAuth(); navigate("/admin/login"); };

  if (loading) return <Spinner />;

  return (
    <Routes>
      {/* /admin  →  redirect to login */}
      <Route path=""         element={<Navigate to="/admin/login" replace />} />
      <Route path="login"    element={isAuth ? <Navigate to="/admin/dashboard" replace /> : <AdminAuthLayout onLogin={handleLogin} />} />
      <Route path="register" element={isAuth ? <Navigate to="/admin/dashboard" replace /> : <AdminAuthLayout onLogin={handleLogin} />} />
      <Route path="dashboard" element={
        <ProtectedRoute isAuth={isAuth} redirectTo="/admin/login">
          <AdminDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={isAuth ? "/admin/dashboard" : "/admin/login"} replace />} />
    </Routes>
  );
}

// ══════════════════════════════════════════════════════════
//  SUPERADMIN ROUTES
// ══════════════════════════════════════════════════════════
function SuperadminRoutes() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("superadmintoken");
    const data  = localStorage.getItem("superAdminData");
    if (token && data && !isTokenExpired(token)) {
      try {
        if (JSON.parse(data).role === "superadmin") setIsAuth(true);
        else clearAuth();
      } catch { clearAuth(); }
    }
    setLoading(false);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem("superadmintoken");
    localStorage.removeItem("superAdminData");
    setIsAuth(false);
  };

  const handleLogin = (data) => {
    localStorage.setItem("superadmintoken", data.token);
    localStorage.setItem("superAdminData", JSON.stringify({ role: data.role, name: data.name, email: data.email }));
    setIsAuth(true);
    navigate("/superadmin/dashboard");
  };

  const handleLogout = () => { clearAuth(); navigate("/superadmin/login"); };

  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path=""          element={<Navigate to="/superadmin/login" replace />} />
      <Route path="login"     element={isAuth ? <Navigate to="/superadmin/dashboard" replace /> : <SuperAdminAuthLayout onLogin={handleLogin} />} />
      <Route path="dashboard" element={
        <ProtectedRoute isAuth={isAuth} redirectTo="/superadmin/login">
          <SuperAdminDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={isAuth ? "/superadmin/dashboard" : "/superadmin/login"} replace />} />
    </Routes>
  );
}

// ══════════════════════════════════════════════════════════
//  CLIENT + HUMAN AGENT ROUTES  (/client  &  /human-agents)
// ══════════════════════════════════════════════════════════
function UserRoutes({ loginPath, dashboardPath }) {
  const navigate = useNavigate();
  const [isAuth, setIsAuth]   = useState(false);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate session from URL ?token= param (human-agent switch)
    try {
      const params  = new URLSearchParams(window.location.search);
      const encoded = params.get("token");
      if (encoded) {
        const decoded = JSON.parse(decodeURIComponent(encoded));
        if (decoded?.token) {
          sessionStorage.setItem("usertoken", decoded.token);
          if (decoded.userData) sessionStorage.setItem("userData", JSON.stringify(decoded.userData));
          if (decoded.clientToken) sessionStorage.setItem("clienttoken", decoded.clientToken);
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("token");
          window.history.replaceState({}, "", cleanUrl.toString());
        }
      }
    } catch { /* ignore */ }

    const clientToken = sessionStorage.getItem("clienttoken");
    const userToken   = sessionStorage.getItem("usertoken");
    const clientData  = sessionStorage.getItem("clientData");
    const userData    = sessionStorage.getItem("userData");

    const token = clientToken || userToken;
    const data  = clientData  || userData;

    if (token && data && !isTokenExpired(token)) {
      try {
        const parsed = JSON.parse(data);
        setIsAuth(true);
        setRole(parsed.role);
      } catch { clearAuth(); }
    }
    setLoading(false);
  }, []);

  const clearAuth = () => {
    ["clienttoken","usertoken","clientData","userData"].forEach(k => sessionStorage.removeItem(k));
    setIsAuth(false);
    setRole(null);
  };

  const handleLogin = (data) => {
    const isAgent = ["humanAgent","HumanAgent","executive"].includes(data.role);
    if (data.role === "client") {
      sessionStorage.setItem("clienttoken", data.token);
      sessionStorage.setItem("clientData", JSON.stringify({ role: data.role, name: data.name, email: data.email, clientId: data.clientId || data.id || data._id }));
    } else if (isAgent) {
      sessionStorage.setItem("usertoken", data.token);
      sessionStorage.setItem("userData", JSON.stringify({ role: data.role, name: data.name, email: data.email, clientId: data.clientId, id: data.id }));
      if (data.clientToken || data.token) sessionStorage.setItem("clienttoken", data.clientToken || data.token);
    } else {
      sessionStorage.setItem("usertoken", data.token);
      sessionStorage.setItem("userData", JSON.stringify({ role: data.role, name: data.name, email: data.email }));
    }
    setIsAuth(true);
    setRole(data.role);
    navigate(dashboardPath);
  };

  const handleLogout = () => { clearAuth(); navigate(loginPath); };

  const getDashboard = () => {
    const clientData = JSON.parse(sessionStorage.getItem("clientData") || "{}");
    const userData   = JSON.parse(sessionStorage.getItem("userData")   || "{}");
    if (role === "client")
      return <ClientDashboard onLogout={handleLogout} clientId={clientData?.clientId} />;
    if (["humanAgent","HumanAgent","executive"].includes(role))
      return <HumanAgentDashboard onLogout={handleLogout} userData={userData} />;
    return <Navigate to={loginPath} replace />;
  };

  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path=""          element={<Navigate to={loginPath} replace />} />
      <Route path="login"     element={isAuth ? <Navigate to={dashboardPath} replace /> : <AuthLayout onLogin={handleLogin} />} />
      <Route path="dashboard" element={
        <ProtectedRoute isAuth={isAuth} redirectTo={loginPath}>
          {getDashboard()}
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={isAuth ? dashboardPath : loginPath} replace />} />
    </Routes>
  );
}

// ══════════════════════════════════════════════════════════
//  LANDING LAYOUT WRAPPER  (Navbar + Footer + Preloader)
// ══════════════════════════════════════════════════════════
function LandingLayout({ children }) {
  const [loaded, setLoaded] = useState(false);
  const handleComplete = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    if (!loaded) return;
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.lenis = lenis;
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => { lenis.destroy(); window.lenis = null; };
  }, [loaded]);

  return (
    <>
      <AnimatePresence mode="wait">
        {!loaded && <Preloader key="preloader" onComplete={handleComplete} />}
      </AnimatePresence>
      {loaded && (
        <>
          <AitotaCustomCursor />
          <AitotaNavbar />
          <AitotaBottomNav />
          {children}
          <AitotaFooter />
        </>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════
//  APP ROUTES  — main export
// ══════════════════════════════════════════════════════════
export default function AppRoutes() {
  const location = useLocation();
  const isLanding = LANDING_PATHS.includes(location.pathname) ||
                    location.pathname.startsWith("/landing");

  // Migrate legacy localStorage tokens to sessionStorage once
  useEffect(() => {
    const pairs = [["usertoken","usertoken"],["userData","userData"],["clienttoken","clienttoken"],["clientData","clientData"]];
    pairs.forEach(([lk, sk]) => {
      const v = localStorage.getItem(lk);
      if (v && !sessionStorage.getItem(sk)) { sessionStorage.setItem(sk, v); localStorage.removeItem(lk); }
    });
  }, []);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />

      <Routes>
        {/* ── LANDING ─────────────────────────────────── */}
        <Route path="/" element={<LandingLayout><LandingHome /></LandingLayout>} />
        <Route path="/landing"      element={<Navigate to="/" replace />} />
        <Route path="/landing/page" element={<Navigate to="/" replace />} />
        <Route path="/about"    element={<LandingLayout><AitotaAbout /></LandingLayout>} />
        <Route path="/features" element={<LandingLayout><AitotaFeatures /></LandingLayout>} />
        <Route path="/services" element={<LandingLayout><AitotaServices /></LandingLayout>} />
        <Route path="/contact"  element={<LandingLayout><AitotaContact /></LandingLayout>} />
        <Route path="/privacy"  element={<LandingLayout><AitotaPrivacy /></LandingLayout>} />

        {/* ── ADMIN ───────────────────────────────────── */}
        {/* /admin/login  →  admin login page             */}
        {/* /admin/dashboard  →  admin dashboard          */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* ── SUPERADMIN ──────────────────────────────── */}
        <Route path="/superadmin/*" element={<SuperadminRoutes />} />

        {/* ── CLIENT ──────────────────────────────────── */}
        {/* /client/login  →  client login                */}
        {/* /client/dashboard  →  client dashboard        */}
        <Route path="/client/*" element={
          <UserRoutes loginPath="/client/login" dashboardPath="/client/dashboard" />
        } />

        {/* ── HUMAN AGENTS ────────────────────────────── */}
        {/* /human-agents/login  →  human agent login     */}
        {/* /human-agents/dashboard  →  HA dashboard      */}
        <Route path="/human-agents/*" element={
          <UserRoutes loginPath="/human-agents/login" dashboardPath="/human-agents/dashboard" />
        } />

        {/* ── LEGACY /auth/* redirect ──────────────────── */}
        <Route path="/auth/login"     element={<Navigate to="/client/login" replace />} />
        <Route path="/auth/dashboard" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="/auth/*"         element={<Navigate to="/client/login" replace />} />

        {/* ── MAKECALL ────────────────────────────────── */}
        <Route path="/makecall/login"     element={<MakecallLogin />} />
        <Route path="/makecall/dashboard" element={<MakecallDashboard />} />

        {/* ── MISC ────────────────────────────────────── */}
        <Route path="/agent/:agentId/talk" element={<AgentMobileTalk />} />
        <Route path="/testing"             element={<Testing />} />

        {/* ── PUBLIC BUSINESS ─────────────────────────── */}
        <Route path="/:slug" element={<PublicBusinessDetails />} />

        {/* ── 404 → Landing ───────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
