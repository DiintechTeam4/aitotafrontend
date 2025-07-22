import React, { useState, useEffect } from "react";
import {
  FaChartBar,
  FaBuilding,
  FaFileInvoiceDollar,
  FaChartLine,
  FaHeadset,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHistory,
  FaQuestionCircle,
  FaFileAlt,
  FaUserCircle,
  FaPhotoVideo,
  FaVideo,
  FaAngleLeft,
  FaImage,
  FaTrash,
  FaDownload,
  FaFolderPlus,
  FaHome,
  FaChartPie,
  FaFileInvoice,
  FaClipboardList,
  FaEdit,
  FaClipboardCheck,
  FaUsers,
  FaDatabase,
  FaComments,
  FaEllipsisV,
  FaCloudsmith,
  FaTshirt,
  FaCube,
} from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ClientDashboard = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobile, setIsMobile] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [clientId, setclientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setusers] = useState(null);
  const [newModel, setNewModel] = useState({
    name: '',
    category: 'men',
    imageUrl: '',
    description: ''
  });
  const [addModelLoading, setAddModelLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  // Fetch client profile data
  const fetchClientProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem("clienttoken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching client profile with token:", token);
      const response = await axios.get(`${API_BASE_URL}/client/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Client profile response:", response.data);
      if (response.data.success) {
        setClientData(response.data.data);
        console.log("Client data set to:", response.data.data);
        setclientId(response.data.data.userId);
        console.log(response.data.data.userId);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch client profile"
        );
      }
    } catch (error) {
      console.error("Error fetching client profile:", error);
      console.error("Error details:", error.response?.data);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };





  useEffect(() => {
    fetchClientProfile();
  }, []);
  // Fetch profile data when Business Profile tab is selected
  useEffect(() => {
    if (activeTab === "Business Profile" || activeTab === "Tax Information  ") {
      fetchClientProfile();
    }
   
    
  }, [activeTab]);

  // Check if screen is mobile and handle resize events
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
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

  // Main navigation items
  const mainNavItems = [
    { name: "Overview", icon: <FaHome /> },
    { name: "Business Profile", icon: <FaBuilding /> },
    { name: "Chats", icon: <FaUsers /> },
    { name: "Enquiry", icon: <FaUsers /> },
    { name: "History", icon: <FaUsers /> },
    { name: "Datastore", icon: <FaUsers /> },

  ];

  // Bottom navigation items
  const bottomNavItems = [
    { name: "Support", icon: <FaHeadset /> },
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Log out"] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {/* Error State */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <p>{error}</p>
        </div>
      )}

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-b  from-purple-800 to-purple-600 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          isMobile
            ? isSidebarOpen
              ? "w-64 translate-x-0"
              : "-translate-x-full w-64"
            : isSidebarOpen
            ? "w-64"
            : "w-20"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex justify-between items-center px-6 p-2 border-b border-white/20 bg-white/10">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-15 h-15 flex items-center justify-center">
              <img src={clientData?.businessLogoUrl}></img>
              </div>
              <h4 className="font-semibold text-lg truncate text-white">
                {clientData?.businessName || "Business"}
              </h4>
            </div>
          )}
          <button
            className="text-white hover:text-blue-200 focus:outline-none transition-colors"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <FaAngleLeft size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex flex-col h-[calc(100vh-180px)]">
          <div className="flex-1 overflow-y-auto py-4">
            {mainNavItems.map((item, index) => (
              <button
                key={index}
                className={`flex items-center w-full py-3 px-4 text-left transition-all duration-200 ${
                  activeTab === item.name
                    ? "bg-white/20 text-white border-r-4 border-pink-300 shadow-lg backdrop-blur-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => handleTabClick(item.name)}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {(isSidebarOpen || isMobile) && (
                  <span className="ml-3 font-medium">{item.name}</span>
                )}
              </button>
            ))}
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/20 py-4 bg-gradient-to-t from-black/20 to-transparent">
            {bottomNavItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-4 text-left transition-all duration-200 ${
                    activeTab === item.name
                      ? "bg-white/20 text-white border-r-4 border-pink-300 shadow-lg backdrop-blur-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => handleTabClick(item.name)}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {(isSidebarOpen || isMobile) && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                </button>

                {/* Settings Submenu */}
                {isSidebarOpen && item.subItems && activeTab === item.name && (
                  <div className="ml-12 mt-1">
                    {item.subItems.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        className="flex items-center w-full py-2 text-left text-white/80 hover:text-pink-300 transition-colors duration-200"
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
      </div>

      {/* Main Content */}
      <div
        className={`${
          isMobile ? "ml-0" : isSidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300 ease-in-out`}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm shadow-sm border-b border-purple-200">
            <div className="flex justify-between items-center p-4">
              <button
                className="p-2 text-purple-600 hover:text-purple-800 transition-colors"
                onClick={toggleSidebar}
              >
                <FaBars size={20} />
              </button>
              <h4 className="font-bold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Client Dashboard</h4>
              <div className="w-8"></div> {/* Spacer for alignment */}
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl">
          
            {/* Welcome Message */}
            {activeTab === "Overview" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                    Welcome back, {clientData?.businessName || "Client"}!
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {new Date().getHours() < 12
                      ? "Good morning"
                      : new Date().getHours() < 18
                      ? "Good afternoon"
                      : "Good evening"}
                    , here's your business overview.
                  </p>
                </div>
                <div className="mt-3 md:mt-0 flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-3 shadow-lg">
                    <FaBuilding className="text-white text-lg" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{clientData?.email}</p>
                    <p className="text-xs text-gray-500">Business Status</p>
                    <p className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Active</p>
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200 p-6">
              {activeTab === "Overview" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl border border-blue-300 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-white">
                        Business Profile
                      </h3>
                      <FaBuilding className="text-blue-200 text-xl" />
                    </div>
                    <p className="text-blue-100">
                      View and update your business information
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl border border-purple-300 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-white">
                        Transactions
                      </h3>
                      <FaChartLine className="text-purple-200 text-xl" />
                    </div>
                    <p className="text-purple-100">
                      Manage and view transaction history
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-xl border border-pink-300 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-white">
                        Reports
                      </h3>
                      <FaChartPie className="text-pink-200 text-xl" />
                    </div>
                    <p className="text-pink-100">
                      Generate and download business reports
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl border border-indigo-300 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-white">
                        Tax Information
                      </h3>
                      <FaFileInvoice className="text-indigo-200 text-xl" />
                    </div>
                    <p className="text-indigo-100">
                      Manage GST, PAN, and other tax details
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-6 rounded-xl border border-violet-300 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-white">
                        Support
                      </h3>
                      <FaHeadset className="text-violet-200 text-xl" />
                    </div>
                    <p className="text-violet-100">
                      Contact support and view help resources
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 rounded-xl border border-cyan-300 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-white">
                        Analytics
                      </h3>
                      <FaChartBar className="text-cyan-200 text-xl" />
                    </div>
                    <p className="text-cyan-100">
                      View detailed business analytics
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "Business Profile" && (
                <div className="space-y-6">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                  ) : clientData ? (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Business Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-500 mb-1">
                              Business Name
                            </p>
                            <p className="font-semibold text-gray-800">
                              {clientData.businessName}
                            </p>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                            <p className="text-sm text-gray-500 mb-1">
                              GST Number
                            </p>
                            <p className="font-semibold text-gray-800">
                              {clientData.gstNo}
                            </p>
                          </div>
                          <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 rounded-lg border border-pink-200">
                            <p className="text-sm text-gray-500 mb-1">
                              PAN Number
                            </p>
                            <p className="font-semibold text-gray-800">
                              {clientData.panNo}
                            </p>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-500 mb-1">
                              Mobile Number
                            </p>
                            <p className="font-semibold text-gray-800">
                              {clientData.mobileNo}
                            </p>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                            <p className="text-sm text-gray-500 mb-1">
                              Address
                            </p>
                            <p className="font-semibold text-gray-800">
                              {clientData.address}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 rounded-lg border border-pink-200">
                            <p className="text-sm text-gray-500 mb-1">City</p>
                            <p className="font-semibold text-gray-800">
                              {clientData.city}
                            </p>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-500 mb-1">
                              Pincode
                            </p>
                            <p className="font-semibold text-gray-800">
                              {clientData.pincode}
                            </p>
                          </div>
                          {clientData.websiteUrl && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                              <p className="text-sm text-gray-500 mb-1">
                                Website
                              </p>
                              <a
                                href={clientData.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-700 hover:underline"
                              >
                                {clientData.websiteUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        No business profile data available
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Enquiry" && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200 p-6 shadow-lg">
                    <p className="text-gray-600">
                      Business reports and analytics will go here
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "History" && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200 p-6 shadow-lg">
                    <p className="text-gray-600">
                      Activity history will go here
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "Datastore" && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200 p-6 shadow-lg">
                    <p className="text-gray-600">
                      Activity history will go here
                    </p>
                  </div>
                </div>
              )}

             

              {activeTab === "Chats" && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200 p-6 shadow-lg">
                    <p className="text-gray-600">
                      Support and help resources will go here
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "Help" && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200 p-6 shadow-lg">
                    <p className="text-gray-600">
                      Help documentation and guides will go here
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "Settings" && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200 p-6 shadow-lg">
                    <p className="text-gray-600">
                      Account settings and preferences will go here
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "Users" && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200 p-6 shadow-lg">
                    {Array.isArray(users) && users.length === 0 ? (
                      <p className="text-gray-500">No users found for this client.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-purple-200">
                          <thead>
                            <tr className="bg-gradient-to-r from-blue-50 to-purple-50">
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white/50 divide-y divide-purple-100">
                            {users.map(user => (
                              <tr key={user._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user._id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
