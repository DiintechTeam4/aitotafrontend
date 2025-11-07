import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiLogOut,
  FiPhone,
  FiMail,
  FiCalendar,
  FiTrendingUp,
  FiUsers,
  FiLink,
  FiSend,
  FiDollarSign,
  FiBookOpen,
  FiHelpCircle,
  FiSettings,
  FiBarChart2,
  FiMessageSquare,
  FiHeadphones,
  FiShoppingCart,
} from "react-icons/fi";
import { API_BASE_URL } from "../../config";
import PerformanceKPIs from "./components/PerformanceKPIs";
import InBoundSection from "./components/InBoundSection";
import OutboundSection from "./components/OutboundSection";
import StaffAgents from "./components/StaffAgents";
import HumanAgentMyDials from "./components/HumanAgentMyDials";

const HumanAgentDashboard = ({ userData, onLogout }) => {
  const [humanAgent, setHumanAgent] = useState(null);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("kpi");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (userData) {
      setHumanAgent(userData);
    }
  }, [userData]);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    onLogout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // If no userData, show error
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            No user data found. Please log in again.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: "kpi",
      label: "KPI (Performance)",
      icon: <FiTrendingUp className="text-xl w-6 text-center" />,
    },
    {
      name: "agents",
      label: "Agents",
      icon: <FiUsers className="text-xl w-6 text-center" />,
    },
    {
      name: "inbound",
      label: "Inbound",
      icon: <FiLink className="text-xl w-6 text-center" />,
    },
    {
      name: "outbound",
      label: "Outbound",
      icon: <FiSend className="text-xl w-6 text-center" />,
    },
    {
      name: "my-dials",
      label: "My Dials",
      icon: <FiPhone className="text-xl w-6 text-center" />,
    },
    {
      name: "my-sales",
      label: "My Sales",
      icon: <FiDollarSign className="text-xl w-6 text-center" />,
    },
    {
      name: "training",
      label: "Training",
      icon: <FiBookOpen className="text-xl w-6 text-center" />,
    },
  ];

  const bottomNavItems = [
    {
      name: "help",
      label: "Help",
      icon: <FiHelpCircle className="text-xl w-6 text-center" />,
    },
    {
      name: "settings",
      label: "Settings",
      icon: <FiSettings className="text-xl w-6 text-center" />,
    },
  ];

  const renderMainContent = () => {
    switch (activeSection) {
      case "kpi":
        return <div className="flex-1 p-8 overflow-y-auto">
              <PerformanceKPIs />
            </div>

      case "agents":
        return (
              <StaffAgents />
        );

      case "inbound":
        return (
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Inbound
              </h2>
              <p className="text-gray-600 text-lg">
                Handle incoming calls and leads
              </p>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <InBoundSection />
            </div>
          </div>
        );

      case "outbound":
        return (
              <OutboundSection />
        );

      case "my-dials":
        return (<HumanAgentMyDials />
        );

      case "my-sales":
        return (
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                My Sales
              </h2>
              <p className="text-gray-600 text-lg">
                Monitor your sales performance and achievements
              </p>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Sales Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <FiDollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">$0</div>
                    <div className="text-sm text-gray-600">Total Sales</div>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <FiShoppingCart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Deals Closed</div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <FiTrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">0%</div>
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "training":
        return (
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Training
              </h2>
              <p className="text-gray-600 text-lg">
                Access training materials and resources
              </p>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Training Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <FiBookOpen className="w-8 h-8 text-blue-600 mb-3" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Product Training
                    </h4>
                    <p className="text-gray-600 mb-3">
                      Learn about our products and services
                    </p>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Start Training →
                    </button>
                  </div>
                  <div className="p-6 bg-green-50 rounded-lg">
                    <FiBookOpen className="w-8 h-8 text-green-600 mb-3" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Sales Techniques
                    </h4>
                    <p className="text-gray-600 mb-3">
                      Master effective sales strategies
                    </p>
                    <button className="text-green-600 hover:text-green-700 font-medium">
                      Start Training →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Help & Support
              </h2>
              <p className="text-gray-600 text-lg">
                Get help and support for your questions
              </p>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Need Help?
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Contact Support
                    </h4>
                    <p className="text-gray-600 mb-2">
                      Get in touch with our support team
                    </p>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Contact Support →
                    </button>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">FAQ</h4>
                    <p className="text-gray-600 mb-2">
                      Find answers to common questions
                    </p>
                    <button className="text-green-600 hover:text-green-700 font-medium">
                      View FAQ →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Settings
              </h2>
              <p className="text-gray-600 text-lg">
                Manage your account settings and preferences
              </p>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Account Settings
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Profile Information
                    </h4>
                    <p className="text-gray-600 mb-2">
                      Update your personal information
                    </p>
                    <button className="text-gray-600 hover:text-gray-700 font-medium">
                      Edit Profile →
                    </button>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Logout</h4>
                    <p className="text-gray-600 mb-2">
                      Sign out of your account
                    </p>
                    <button
                      onClick={handleLogout}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Logout →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome, {humanAgent?.name || "Agent"}
              </h2>
              <p className="text-gray-600 text-lg">Team Dashboard</p>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Agent Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiUser className="w-5 h-5 text-blue-600" />
                    Agent Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <FiMail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Email
                        </p>
                        <p className="text-sm text-gray-900">
                          {humanAgent?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FiPhone className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Mobile
                        </p>
                        <p className="text-sm text-gray-900">
                          {humanAgent?.mobileNo || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FiCalendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Status
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            humanAgent?.isApproved
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {humanAgent?.isApproved
                            ? "Approved"
                            : "Pending Approval"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiTrendingUp className="w-5 h-5 text-green-600" />
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-gray-600">Calls Today</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-gray-600">Sales Today</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        0
                      </div>
                      <div className="text-sm text-gray-600">
                        Leads Generated
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        0%
                      </div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen font-sans bg-gray-50">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-gradient-to-b from-gray-900 to-black text-white flex flex-col shadow-lg transition-all duration-300 ${
            isMobile
              ? isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
              : ""
          } ${isMobile ? "fixed z-50 h-full" : ""}`}
        >
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white mb-3">Team</h1>
            <div className="flex flex-row gap-2">
              <span className="text-sm text-gray-300 font-semibold">
                {humanAgent?.name || "Agent"}
              </span>
              <span className="text-sm text-gray-300 font-semibold">
                ({humanAgent?.role || "Executive"})
              </span>
            </div>
          </div>

          <nav className="flex-1 py-4">
            {navItems.map((item) => (
              <button
                key={item.name}
                className={`flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                  activeSection === item.name
                    ? "bg-black text-white border-r-4 border-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
                onClick={() => handleSectionChange(item.name)}
              >
                {item.icon}
                <span className="flex-1 font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-gray-700">
            {bottomNavItems.map((item) => (
              <button
                key={item.name}
                className={`flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                  activeSection === item.name
                    ? "bg-black text-white border-r-4 border-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
                onClick={() => handleSectionChange(item.name)}
              >
                {item.icon}
                <span className="flex-1 font-medium">{item.label}</span>
              </button>
            ))}
            <button
              className="flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={handleLogout}
            >
              <FiLogOut className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default HumanAgentDashboard;
