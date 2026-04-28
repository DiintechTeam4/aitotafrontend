import React, { useState, useEffect } from "react";
import {
  FaChartBar,
  FaUser,
  FaComments,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBell,
  FaHistory,
  FaQuestionCircle,
  FaAngleLeft,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config";

const UserDashboard = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if screen is mobile and handle resize events
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth < 992) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const userToken =
          sessionStorage.getItem("usertoken") ||
          localStorage.getItem("usertoken");
        const token = userToken;
        if (!token) {
          setError("No authentication token found.");
          setLoading(false);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/user/userprofile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        const data = await response.json();
        setUser(data.user || data.data || data); // fallback for different API shapes
      } catch (err) {
        setError(
          err.message || "An error occurred while fetching user profile."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    { name: "Overview", icon: <FaChartBar /> },
    { name: "Profile", icon: <FaUser /> },
    { name: "Store", icon: <FaComments /> },
    { name: "Models", icon: <FaBell /> },
    { name: "History", icon: <FaHistory /> },
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Log out"] },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-blue-900 text-white shadow-xl z-50 transition-all duration-300 ease-in-out ${
          isMobile
            ? isSidebarOpen
              ? "w-64 translate-x-0"
              : "-translate-x-full w-64"
            : isSidebarOpen
            ? "w-64"
            : "w-20"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-blue-800">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <img src="/AitotaLogo.png" alt="AiTota" className="h-8 w-8 rounded-lg object-cover" />
              <h4 className="m-0 font-semibold text-lg">User Portal</h4>
            </div>
          )}
          <button
            className="text-white hover:text-gray-300 focus:outline-none"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <FaAngleLeft size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        <div
          className="flex flex-col mt-3 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 60px)" }}
        >
          {navItems.map((item, index) => (
            <div key={index}>
              <button
                className={`flex items-center w-full py-3 px-5 text-left hover:bg-blue-800 ${
                  activeTab === item.name
                    ? "bg-blue-700 text-white"
                    : "text-gray-300"
                }`}
                onClick={() => handleTabClick(item.name)}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                {(isSidebarOpen || isMobile) && <span>{item.name}</span>}
              </button>

              {/* Dropdown for Settings */}
              {isSidebarOpen && item.subItems && activeTab === item.name && (
                <div className="ml-8 mt-1 mb-2">
                  {item.subItems.map((subItem, subIndex) => (
                    <button
                      key={subIndex}
                      className="flex items-center w-full py-2 text-left hover:bg-blue-800 text-gray-300"
                      onClick={() => {
                        if (subItem === "Log out") onLogout();
                      }}
                    >
                      {subItem === "Log out" && (
                        <FaSignOutAlt className="mr-2" />
                      )}
                      <span>{subItem}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">
              Welcome, {user?.name || "User"}
            </h1>
          </div>
        </header>

        <main className="container mx-auto p-4">
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {activeTab}
                  </h2>
                  <nav className="text-sm text-gray-500 mt-1">
                    <ol className="flex items-center space-x-2">
                      <li>
                        <a
                          href="#"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Dashboard
                        </a>
                      </li>
                      <li>/</li>
                      <li>{activeTab}</li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>

            {activeTab === "Overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">
                    Profile Status
                  </h5>
                  <h2 className="text-3xl my-2 text-blue-600">Complete</h2>
                  <p className="text-sm text-gray-600">
                    Your profile is up to date
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">
                    Messages
                  </h5>
                  <h2 className="text-3xl my-2 text-green-600">3</h2>
                  <p className="text-sm text-gray-600">2 unread messages</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">
                    Notifications
                  </h5>
                  <h2 className="text-3xl my-2 text-purple-600">5</h2>
                  <p className="text-sm text-gray-600">3 new notifications</p>
                </div>
              </div>
            )}

            {activeTab === "Profile" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Profile Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3 shadow-lg">
                      {(user?.name?.[0] || "U").toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold text-white">{user?.name || "User"}</h2>
                    <p className="text-indigo-200 text-sm mt-1">{user?.email || ""}</p>
                    {user?.isApproved !== undefined && (
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        user.isApproved ? "bg-green-400/20 text-green-100" : "bg-yellow-400/20 text-yellow-100"
                      }`}>
                        {user.isApproved ? "✓ Approved" : "⏳ Pending Approval"}
                      </span>
                    )}
                  </div>

                  {/* Profile Details */}
                  <div className="p-8">
                    <h3 className="text-base font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[
                        { label: "Full Name", value: user?.name },
                        { label: "Email Address", value: user?.email },
                        { label: "Mobile Number", value: user?.mobileNo },
                        { label: "Business Name", value: user?.businessName },
                        { label: "City", value: user?.city },
                        { label: "Pincode", value: user?.pincode },
                        { label: "Address", value: user?.address },
                        { label: "Website", value: user?.websiteUrl },
                        { label: "Profession", value: user?.profession },
                        { label: "Date of Birth", value: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-IN") : null },
                        { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : null },
                      ].filter(f => f.value).map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                          <p className="text-sm font-medium text-gray-800 break-all">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Store" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Recent Messages
                  </h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">No messages to display</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Models" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Recent Notifications
                  </h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">No notifications to display</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "History" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Activity History
                  </h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      No recent activity to display
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Help" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Help & Support
                  </h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Need help? Contact our support team.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Settings" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Account Settings
                  </h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Account settings will be available soon.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
