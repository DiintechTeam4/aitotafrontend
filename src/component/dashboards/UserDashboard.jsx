import React, { useState, useEffect } from 'react';
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
  FaAngleLeft
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

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
        const userToken = localStorage.getItem('usertoken');
        // const clientToken = sessionStorage.getItem('clienttoken');
        const token = userToken;
        if (!token) {
          setError('No authentication token found.');
          setLoading(false);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/user/userprofile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        setUser(data.user || data.data || data); // fallback for different API shapes
      } catch (err) {
        setError(err.message || 'An error occurred while fetching user profile.');
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onLogout}>Log out</button>
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
            <h4 className="m-0 font-semibold text-lg">User Panel</h4>
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
            <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.name || 'User'}</h1>
          </div>
        </header>

        <main className="container mx-auto p-4">
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{activeTab}</h2>
                  <nav className="text-sm text-gray-500 mt-1">
                    <ol className="flex items-center space-x-2">
                      <li>
                        <a href="#" className="text-blue-600 hover:text-blue-700">
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
                  <h5 className="text-lg font-semibold text-gray-800">Profile Status</h5>
                  <h2 className="text-3xl my-2 text-blue-600">Complete</h2>
                  <p className="text-sm text-gray-600">Your profile is up to date</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">Messages</h5>
                  <h2 className="text-3xl my-2 text-green-600">3</h2>
                  <p className="text-sm text-gray-600">2 unread messages</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">Notifications</h5>
                  <h2 className="text-3xl my-2 text-purple-600">5</h2>
                  <p className="text-sm text-gray-600">3 new notifications</p>
                </div>
              </div>
            )}

            {activeTab === "Profile" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user && Object.entries(user).map(([key, value]) => (
                      <div key={key} className="mb-2">
                        <label className="block text-sm font-medium text-gray-700">{key}</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                          value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          readOnly
                        />
                      </div>
                    ))}
                  </div>
                  {/* Prompts for incomplete profiles */}
                  <div className="mt-6 space-y-2">
                    {user && user.isBasicProfileCompleted === false && (
                      <button className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600">
                        Complete Basic Profile
                      </button>
                    )}
                    {user && user.isStylePreferenceCompleted === false && (
                      <button className="bg-pink-500 text-white px-4 py-2 rounded shadow hover:bg-pink-600">
                        Complete Style Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Store" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Messages</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">No messages to display</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Models" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Notifications</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">No notifications to display</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "History" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Activity History</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">No recent activity to display</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Help" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Help & Support</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">Need help? Contact our support team.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Settings" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">Account settings will be available soon.</p>
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