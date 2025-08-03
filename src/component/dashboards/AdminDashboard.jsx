import React, { useState, useEffect } from "react";
import { useAsyncError, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import {
  FaChartBar,
  FaDatabase,
  FaRobot,
  FaComments,
  FaHeadset,
  FaCog,
  FaShieldAlt,
  FaQuestionCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSearch,
  FaExternalLinkAlt,
  FaAngleLeft,
  FaPlus,
  FaUsers,
  FaFileInvoiceDollar,
  FaClipboardList,
} from "react-icons/fa";
import ApprovalFormDetails from "./components/ApprovalFormDetails";
import HumanAgentManagement from "./components/HumanAgentManagement";

const AdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobile, setIsMobile] = useState(false);
  const [clients, setclients] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [clientcount, setclientcount] = useState(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [loggedInClients, setLoggedInClients] = useState(new Set());
  const [Auth, setAuth] = useState("Authenticate");
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    websiteUrl: "",
    city: "",
    pincode: "",
    gstNo: "",
    panNo: "",
    mobileNo: "",
    address: "",
  });
  const [loadingClientId, setLoadingClientId] = useState(null);
  const [businessLogoFile, setBusinessLogoFile] = useState(null);
  const [businessLogoKey, setBusinessLogoKey] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [reviewClientId, setReviewClientId] = useState(null);
  const [showHumanAgentModal, setShowHumanAgentModal] = useState(false);
  const [selectedClientForHumanAgent, setSelectedClientForHumanAgent] =
    useState(null);
  const [clientTokenForHumanAgent, setClientTokenForHumanAgent] =
    useState(null);

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

    // Check on initial load
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Close sidebar automatically on mobile after clicking a tab
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };
  const getclients = async (req, res) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/getclients`);
      const data = await response.json();
      console.log(data.data);
      setclients(data.data);
      setclientcount(data.count);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(activeTab);
    if (activeTab == "Client" || activeTab == "Overview") {
      getclients();
    }
  }, [activeTab]);

  // Open login modal for a specific client
  const openClientLogin = async (clientId, clientEmail, clientName) => {
    try {
      setLoadingClientId(clientId);
      console.log("Starting client login process for:", clientId);

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("admintoken");
      console.log("Admin token:", adminToken);

      if (!adminToken) {
        console.error("No admin token found");
        alert("Admin session expired. Please login again.");
        return;
      }

      // Make API call to get client token
      const response = await fetch(
        `${API_BASE_URL}/admin/get-client-token/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to get client access token"
        );
      }

      const data = await response.json();
      console.log("Client token response:", data);

      if (data.token) {
        // First open a blank window
        setAuth("Login");
        const clientWindow = window.open("about:blank", "_blank");

        if (!clientWindow) {
          throw new Error(
            "Failed to open new window. Please allow popups for this site."
          );
        }

        // Add client to logged in set
        setLoggedInClients((prev) => new Set([...prev, clientId]));

        // Write the HTML content that will set sessionStorage and redirect
        const html = `
          <html>
            <head>
              <title>Loading...</title>
              <script>
                // Clear any existing session data
                sessionStorage.clear();
                
                // Set the credentials in sessionStorage
                sessionStorage.setItem('clienttoken', '${data.token}');
                sessionStorage.setItem('clientData', JSON.stringify({
                  role: 'client',
                  userType: 'client',
                  name: '${clientName}',
                  email: '${clientEmail}',
                  clientId: '${clientId}'
                }));
                
                // Redirect to client dashboard
                window.location.href = '/auth/dashboard';
              </script>
            </head>
            <body>
              <p>Loading client dashboard...</p>
            </body>
          </html>
        `;

        // Write the HTML to the new window
        clientWindow.document.open();
        clientWindow.document.write(html);
        clientWindow.document.close();

        // Add event listener for window close
        clientWindow.onbeforeunload = () => {
          setLoggedInClients((prev) => {
            const newSet = new Set(prev);
            newSet.delete(clientId);
            return newSet;
          });
        };
      } else {
        throw new Error("No token received from server");
      }
    } catch (error) {
      console.error("Error in openClientLogin:", error);
      alert(error.message || "Failed to access client dashboard");
    } finally {
      setLoadingClientId(null);
    }
  };

  // Filter clients based on search term
  const filteredClients = clients
    ? clients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.businessName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const navItems = [
    { name: "Overview", icon: <FaChartBar /> },
    { name: "Client", icon: <FaUsers /> },
    { name: "Tools", icon: <FaCog /> },
    { name: "Datastore", icon: <FaDatabase /> },
    { name: "AI Agent", icon: <FaRobot /> },
    { name: "Chats", icon: <FaComments /> },
    { name: "Payments", icon: <FaFileInvoiceDollar /> },
    { name: "Tickets", icon: <FaClipboardList /> },
    { name: "Users", icon: <FaUsers /> },
  ];

  const bottomNavItems = [
    { name: "Support", icon: <FaHeadset /> },
    { name: "Help", icon: <FaQuestionCircle /> },
    { name: "Settings", icon: <FaCog />, subItems: ["Log out"] },
  ];

  const sidebarWidth = isSidebarOpen ? "16rem" : "5rem";

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleBusinessLogoChange = async (e) => {
    const file = e.target.files[0];
    setBusinessLogoFile(file);

    if (file) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/client/upload-url?fileName=${encodeURIComponent(
            file.name
          )}&fileType=${encodeURIComponent(file.type)}`
        );
        const data = await res.json();
        if (data.success && data.url && data.key) {
          await fetch(data.url, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          });
          setBusinessLogoKey(data.key);
        } else {
          alert("Failed to get upload URL");
        }
      } catch (err) {
        alert("Error uploading logo");
      }
    }
  };

  const handleAddClient = async () => {
    try {
      if (newClient.password !== newClient.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/client/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admintoken")}`,
        },
        body: JSON.stringify({
          ...newClient,
          businessLogoKey: businessLogoKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create client");
      }

      setShowAddClientModal(false);
      setNewClient({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        websiteUrl: "",
        city: "",
        pincode: "",
        gstNo: "",
        panNo: "",
        mobileNo: "",
        address: "",
      });
      setBusinessLogoFile(null);
      setBusinessLogoKey("");
      alert("Client created successfully");
      await getclients();
    } catch (error) {
      console.error("Error creating client:", error);
      alert(error.message || "Failed to create client. Please try again.");
    }
  };

  const handleDeleteClient = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/deleteclient/${clientToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete client");
      }

      setShowDeleteModal(false);
      setClientToDelete(null);
      await getclients();
      alert("Client deleted successfully");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert(error.message || "Failed to delete client. Please try again.");
    }
  };

  const confirmDelete = (clientId) => {
    setClientToDelete(clientId);
    setShowDeleteModal(true);
  };

  const handleApproveClient = async (clientId) => {
    try {
      // You can add an approval API call here if needed
      // const response = await fetch(`${API_BASE_URL}/admin/approve-client/${clientId}`, {
      //   method: "POST",
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem("admintoken")}`,
      //     "Content-Type": "application/json",
      //   },
      // });

      alert("Client approved successfully!");
      setShowApprovalModal(false);
      setReviewClientId(null);
    } catch (err) {
      console.error("Error approving client:", err);
      alert(err.message || "Failed to approve client");
    }
  };

  // Open Human Agent Management
  const openHumanAgentManagement = async (clientId, clientName) => {
    try {
      setLoadingClientId(clientId);
      console.log("Opening Human Agent Management for:", clientId);

      // Get admin token from localStorage
      const adminToken = localStorage.getItem("admintoken");
      if (!adminToken) {
        alert("Admin token not found. Please login again.");
        return;
      }

      // Get client token first
      const response = await fetch(
        `${API_BASE_URL}/admin/get-client-token/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get client token");
      }

      const data = await response.json();
      const clientToken = data.token;

      // Set the client info and token for HumanAgent management
      setSelectedClientForHumanAgent({ id: clientId, name: clientName });
      setClientTokenForHumanAgent(clientToken);
      setShowHumanAgentModal(true);
      setLoadingClientId(null);
    } catch (error) {
      console.error("Error opening Human Agent Management:", error);
      alert("Failed to open Human Agent Management. Please try again.");
      setLoadingClientId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowAddClientModal(false)}
            >
              <FaTimes size={20} />
            </button>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Add New Client
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient({ ...newClient, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.password}
                    onChange={(e) =>
                      setNewClient({ ...newClient, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.confirmPassword}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.businessName}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        businessName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website URL
                  </label>
                  <input
                    type="url"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.websiteUrl}
                    onChange={(e) =>
                      setNewClient({ ...newClient, websiteUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.city}
                    onChange={(e) =>
                      setNewClient({ ...newClient, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pincode
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.pincode}
                    onChange={(e) =>
                      setNewClient({ ...newClient, pincode: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    GST Number
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.gstNo}
                    onChange={(e) =>
                      setNewClient({ ...newClient, gstNo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.panNo}
                    onChange={(e) =>
                      setNewClient({ ...newClient, panNo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.mobileNo}
                    onChange={(e) =>
                      setNewClient({ ...newClient, mobileNo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full"
                    onChange={handleBusinessLogoChange}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  onClick={handleAddClient}
                >
                  Add Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Confirm Delete
              </h2>
              <p className="text-center text-gray-600 mb-4">
                Are you sure you want to delete this client? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  onClick={handleDeleteClient}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && reviewClientId && (
        <ApprovalFormDetails
          clientId={reviewClientId}
          onClose={() => {
            setShowApprovalModal(false);
            setReviewClientId(null);
          }}
          onApprove={handleApproveClient}
        />
      )}

      {/* Human Agent Management Modal */}
      {showHumanAgentModal &&
        selectedClientForHumanAgent &&
        clientTokenForHumanAgent && (
          <HumanAgentManagement
            clientId={selectedClientForHumanAgent.id}
            clientToken={clientTokenForHumanAgent}
            onClose={() => {
              setShowHumanAgentModal(false);
              setSelectedClientForHumanAgent(null);
              setClientTokenForHumanAgent(null);
            }}
          />
        )}

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full opacity-50 z-40 bg-black"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300 ease-in-out ${
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
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 font-bold">
                A
              </div>
              <h4 className="m-0 font-semibold text-lg text-white">
                Admin Portal
              </h4>
            </div>
          )}
          <button
            className="text-white hover:text-gray-200 focus:outline-none"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <FaAngleLeft size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex flex-col h-full">
          <div className="flex-1 py-4">
            {navItems.map((item, index) => (
              <button
                key={index}
                className={`flex items-center w-full py-3 px-4 text-left transition-colors duration-200 ${
                  activeTab === item.name
                    ? "bg-red-50 text-red-600 border-r-4 border-red-500"
                    : "text-gray-600 hover:bg-gray-50"
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

          {/* Bottom Navigation - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
            {bottomNavItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`flex items-center w-full py-3 px-4 text-left transition-colors duration-200 ${
                    activeTab === item.name
                      ? "bg-red-50 text-red-600 border-r-4 border-red-500"
                      : "text-gray-600 hover:bg-gray-50"
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
                        className="flex items-center w-full py-2 text-left text-gray-600 hover:text-red-600 transition-colors duration-200"
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
          <div className="sticky top-0 z-30 bg-white shadow-sm">
            <div className="flex justify-between items-center p-4">
              <button
                className="p-2 text-gray-600 hover:text-gray-800"
                onClick={toggleSidebar}
              >
                <FaBars size={20} />
              </button>
              <h4 className="font-bold text-lg">Admin Dashboard</h4>
              <div className="w-8"></div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Message */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-xl font-semibold text-gray-800 mb-1">
                    Welcome back, Admin!
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {new Date().getHours() < 12
                      ? "Good morning"
                      : new Date().getHours() < 18
                      ? "Good afternoon"
                      : "Good evening"}
                    , here's your system overview.
                  </p>
                </div>
                <div className="mt-3 md:mt-0 flex items-center space-x-3">
                  <div className="bg-red-50 rounded-lg p-2">
                    <FaShieldAlt className="text-red-600 text-lg" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">System Status</p>
                    <p className="text-sm font-medium text-red-600">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Content based on active tab */}
            {activeTab === "Overview" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">
                    Total Clients
                  </h5>
                  <h2 className="text-3xl my-2 text-red-600">{clientcount}</h2>
                  <p className="text-sm text-gray-600">
                    12% increase from last month
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">
                    Active Sessions
                  </h5>
                  <h2 className="text-3xl my-2 text-red-600">423</h2>
                  <p className="text-sm text-gray-600">
                    5% increase from yesterday
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <h5 className="text-lg font-semibold text-gray-800">
                    AI Interactions
                  </h5>
                  <h2 className="text-3xl my-2 text-red-600">8,732</h2>
                  <p className="text-sm text-gray-600">
                    18% increase from last week
                  </p>
                </div>
              </div>
            )}

            {/* Client Table */}
            {activeTab === "Client" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Search and filters */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Client List
                    </h3>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowAddClientModal(true)}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        <FaPlus className="mr-2" />
                        Add Client
                      </button>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search clients..."
                          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <FaSearch className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading clients...</p>
                    </div>
                  ) : !clients || clients.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">No clients found.</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Business Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.map((client, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                                  {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {client.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Client since {formatDate(client.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {client.businessName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.websiteUrl ? (
                                  <a
                                    href={client.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-red-600 hover:underline"
                                  >
                                    Website{" "}
                                    <FaExternalLinkAlt className="ml-1 text-xs" />
                                  </a>
                                ) : (
                                  "No website"
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {client.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.mobileNo}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.address}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.city}, {client.pincode}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                <p>GST: {client.gstNo}</p>
                                <p>PAN: {client.panNo}</p>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-sm font-medium flex flex-col space-y-2 align-middle">
                              <button
                                onClick={() =>
                                  openClientLogin(
                                    client._id,
                                    client.email,
                                    client.name
                                  )
                                }
                                className={`${
                                  loggedInClients.has(client._id)
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                                } text-white px-4 py-2 rounded-md transition-colors`}
                                title={
                                  loggedInClients.has(client._id)
                                    ? "Client Logged In"
                                    : "Client Login"
                                }
                              >
                                {loggedInClients.has(client._id)
                                  ? "Logged In"
                                  : "Authenticate"}
                              </button>
                              <button
                                onClick={() =>
                                  openHumanAgentManagement(
                                    client._id,
                                    client.name
                                  )
                                }
                                disabled={loadingClientId === client._id}
                                className="text-white px-4 py-2 rounded-md transition-colors align-middle bg-red-600 capitalize disabled:opacity-50"
                              >
                                {loadingClientId === client._id
                                  ? "Loading..."
                                  : "setting"}
                              </button>
                            </td>
                            <td className="px-6 py-6 text-sm font-medium align-middle text-center ">
                              <button
                                className="w-28 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                onClick={() => {
                                  setReviewClientId(client._id);
                                  setShowApprovalModal(true);
                                }}
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
