import React, { useState, useEffect, useRef } from "react";
import { 
  FaUsers, FaUserPlus, FaSearch, FaBars, FaTimes, FaSignOutAlt, 
  FaBuilding, FaChartBar, FaAngleLeft, FaPlus, FaCheck, FaBan, FaTrash,
  FaExternalLinkAlt, FaCog, FaEdit, FaUserCog, FaUnlockAlt, FaCheckCircle, FaTimesCircle,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe, FaUser
} from "react-icons/fa";
import { API_BASE_URL } from "../../../config";

const WorkspaceDashboard = ({ workspace, onBack }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [authenticatingClientId, setAuthenticatingClientId] = useState(null);
  const [adminUser, setAdminUser] = useState({ name: workspace?.name || "", email: workspace?.email || "" });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSettingsMenu, setOpenSettingsMenu] = useState(null);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const adminDropdownRef = useRef(null);

  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobile, setIsMobile] = useState(false);
  const settingsMenuRef = useRef(null);

  // Constants
  const token = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");

  // Form State for New/Edit Client
  const initialClientState = {
    name: "", email: "", password: "", confirmPassword: "",
    businessName: "", websiteUrl: "", city: "", pincode: "",
    gstNo: "", panNo: "", mobileNo: "", address: "",
    businessLogoUrl: "", businessLogoKey: "",
    clientType: "new"
  };
  const [clientData, setClientData] = useState(initialClientState);

  const parseApiResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    const text = await response.text();
    return { success: false, message: text || `HTTP ${response.status}` };
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle click outside settings menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setOpenSettingsMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close admin dropdown when clicking outside
  useEffect(() => {
    if (!showAdminDropdown) return;
    const handler = (e) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target)) {
        setShowAdminDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAdminDropdown]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/workspaces/${workspace._id}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await response.json();
      
      let allData = [];
      if (Array.isArray(res)) allData = res;
      else if (res.data && Array.isArray(res.data)) allData = res.data;
      else if (res.clients && Array.isArray(res.clients)) allData = res.clients;

      setClients(allData);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab.toLowerCase() === "clients" || activeTab.toLowerCase() === "client") {
      fetchClients();
    }
  }, [workspace._id, activeTab]);

  // Load clients once for Overview stats as well.
  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace._id]);

  const exitWorkspace = () => {
    try {
      localStorage.removeItem("activeWorkspace");
    } catch {}
    if (typeof onBack === "function") onBack();
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (clientData.password !== clientData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...clientData,
        workspaceId: workspace._id,
        businessLogoKey: String(clientData.businessLogoKey || "").trim() || `external-logo-${Date.now()}`,
      };

      const response = await fetch(`${API_BASE_URL}/client/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await parseApiResponse(response);
      if (response.ok && data.success) {
        setShowAddModal(false);
        fetchClients();
        setClientData(initialClientState);
      } else {
        alert(data.message || "Failed to create client");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Error creating client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/update-client/${editingClient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(clientData)
      });
      const data = await parseApiResponse(response);
      if (response.ok && data.success) {
        setShowEditModal(false);
        fetchClients();
      } else {
        alert(data.message || "Failed to edit client");
      }
    } catch (error) {
      console.error("Error editing client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm("Are you sure you want to delete this client? This cannot be undone.")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/deleteclient/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await parseApiResponse(response);
      if (response.ok && data.success) fetchClients();
      else alert(data.message || "Failed to delete client");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Error deleting client");
    }
  };

  const toggleApproval = async (client) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/approve-client/${client._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved: !client.isApproved })
      });
      const data = await parseApiResponse(response);
      if (response.ok && data.success) fetchClients();
      else alert(data.message || "Failed to update approval");
    } catch (error) {
      console.error("Error toggling approval:", error);
      alert("Error updating approval");
    }
  };

  const openClientLogin = async (clientId, email, name) => {
    try {
      if (!token) throw new Error("Admin session missing. Please login again.");
      setAuthenticatingClientId(clientId);

      // Get real client JWT from backend (admin impersonation).
      const resp = await fetch(`${API_BASE_URL}/admin/get-client-token/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (!resp.ok || !data?.token) {
        throw new Error(data?.message || "Failed to authenticate client");
      }

      const clientData = JSON.stringify({
        role: "client",
        userType: "client",
        name: name || "",
        email: email || "",
        clientId: clientId,
      });

      const newWindow = window.open("about:blank", "_blank");
      if (!newWindow) {
        alert("Popup blocked! Please allow popups.");
        return;
      }

      newWindow.document.open();
      newWindow.document.write(`<html><head><title>Loading...</title><script>
        sessionStorage.clear();
        sessionStorage.setItem('clienttoken', ${JSON.stringify(data.token)});
        sessionStorage.setItem('clientData', ${JSON.stringify(clientData)});
        window.location.replace('/client/dashboard');
      <\/script></head><body><p>Loading...</p></body></html>`);
      newWindow.document.close();
    } catch (e) {
      alert(e?.message || "Failed to open client portal");
    } finally {
      setAuthenticatingClientId(null);
    }
  };

  const handleAssignToWorkspace = async (clientId, alreadyAssigned) => {
    const newWsId = alreadyAssigned ? null : workspace._id;
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ workspaceId: newWsId, clientId })
      });
      const data = await response.json();
      if (data.success) fetchClients();
    } catch (error) {
      console.error("Error updating assignment:", error);
    }
  };

  const workspaceClients = clients;

  const filteredClients = workspaceClients.filter(c => {
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (clientTypeFilter === "all") return matchesSearch;
    return matchesSearch && c.clientType?.toLowerCase() === clientTypeFilter;
  });

  const getClientLogoUrl = (client) => {
    if (client.businessLogoUrl) return client.businessLogoUrl;
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const sidebarTabs = [
    { name: "Overview", icon: <FaChartBar /> },
    ...(workspace.tabs || []).filter(t => t.isActive).map(t => ({
      name: t.name,
      icon: <FaChartBar />, 
      path: t.path
    }))
  ];

  const clientTypeCounts = workspaceClients.reduce((acc, c) => {
    const type = (c.clientType || "new").toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, { all: 0, new: 0, prime: 0, demo: 0, testing: 0, owned: 0, rejected: 0 });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full opacity-50 z-40 bg-black"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - AdminDashboard style */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300 ease-in-out flex flex-col ${
          isMobile
            ? isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full w-64"
            : isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-slate-800 to-slate-900">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 font-bold">
                {(workspace?.name?.[0] || "W").toUpperCase()}
              </div>
              <h4 className="m-0 font-semibold text-lg text-white truncate">
                {workspace?.name || "Workspace"}
              </h4>
            </div>
          )}
          <button
            className="text-white hover:text-gray-200 focus:outline-none"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <FaAngleLeft size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Nav Items */}
        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 py-4 overflow-y-auto">
            {sidebarTabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => { setActiveTab(tab.name); if (isMobile) setIsSidebarOpen(false); }}
                className={`flex items-center w-full py-3 px-4 text-left transition-colors duration-200 ${
                  activeTab === tab.name
                    ? "bg-indigo-50 text-indigo-700 border-r-4 border-indigo-500"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl flex-shrink-0">{tab.icon}</span>
                {(isSidebarOpen || isMobile) && (
                  <span className="ml-3 font-medium">{tab.name}</span>
                )}
              </button>
            ))}
          </div>

          {/* Bottom exit button */}
          <div className="border-t-2 border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={exitWorkspace}
              className="flex items-center w-full py-3 px-4 text-left text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
            >
              <span className="text-xl flex-shrink-0"><FaSignOutAlt /></span>
              {(isSidebarOpen || isMobile) && (
                <span className="ml-3 font-medium">Exit Dashboard</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`${
          isMobile ? "ml-0" : isSidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center px-6 py-3">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button className="p-2 text-gray-600 hover:text-gray-800" onClick={() => setIsSidebarOpen(true)}>
                  <FaBars size={20} />
                </button>
              )}
              <h4 className="font-semibold text-gray-800 text-base">{activeTab}</h4>
            </div>
            <div className="relative" ref={adminDropdownRef}>
              <button
                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(adminUser?.name?.[0] || "A").toUpperCase()}
                </div>
                {!isMobile && (
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{adminUser?.name || "Admin"}</p>
                    <p className="text-xs text-gray-500 leading-tight">{adminUser?.email || ""}</p>
                  </div>
                )}
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showAdminDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAdminDropdown && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{adminUser?.name || "Admin"}</p>
                    <p className="text-xs text-gray-500 truncate">{adminUser?.email || ""}</p>
                  </div>
                  <button
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 gap-2"
                    onClick={() => { setShowAdminDropdown(false); exitWorkspace(); }}
                  >
                    <FaSignOutAlt className="text-red-500" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#f8fafc]">
          {activeTab === "Overview" ? (
             <div className="max-w-7xl mx-auto space-y-8">
               <div className="p-3 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(workspace?.name?.[0] || "W").toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold text-white">Welcome, {workspace.name}</h1>
                    <p className="text-xs text-slate-400">Your workspace is active and currently managing {workspaceClients.length} clients.</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Clients", val: clients.length },
                  { label: "Pending Approval", val: clients.filter(c => !c.isApproved).length },
                  { label: "Approved", val: clients.filter(c => c.isApproved).length },
                  { label: "Workspace Health", val: "Optimal" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h5 className="text-sm font-medium text-gray-600">{stat.label}</h5>
                    <h2 className="text-3xl my-2 text-red-600">{stat.val}</h2>
                  </div>
                ))}
              </div>
             </div>
          ) : (activeTab.toLowerCase() === "clients" || activeTab.toLowerCase() === "client") ? (
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Client Management</h3>
                <button
                  onClick={() => { setClientData(initialClientState); setShowAddModal(true); }}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                >
                  <FaPlus className="mr-2" /> Add Client
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
                  {[
                      { key: "all", label: "All" },
                      { key: "new", label: "New" },
                      { key: "prime", label: "Prime" },
                      { key: "demo", label: "Demo" },
                      { key: "owned", label: "In-house" },
                      { key: "testing", label: "Testing" },
                      { key: "rejected", label: "Rejected" },
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setClientTypeFilter(btn.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          clientTypeFilter === btn.key
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {btn.label} <span className={`ml-1 text-xs ${
                          clientTypeFilter === btn.key ? "text-red-100" : "text-gray-400"
                        }`}>{clientTypeCounts[btn.key] || 0}</span>
                      </button>
                    ))}
                  <div className="ml-auto relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-b-lg">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500 text-sm">Loading clients...</p>
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="p-8 text-center">
                      <FaUsers className="mx-auto text-4xl text-gray-200 mb-3" />
                      <p className="text-gray-500 text-sm font-medium">No clients assigned to this workspace</p>
                      <p className="text-gray-400 text-xs mt-1">Click "Add Client" to register a new client</p>
                    </div>
                  ) : (
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Settings</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.map((client, index) => {
                          const isThisWs = client.workspaceId?.toString() === workspace._id.toString();
                          return (
                            <tr key={client._id} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                              <td className="px-3 py-3 text-center text-xs text-gray-500">{index + 1}</td>
                              <td className="px-3 py-4">
                                <div className="flex items-center gap-2">
                                  {getClientLogoUrl(client) ? (
                                    <img src={getClientLogoUrl(client)} alt="logo" className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm flex-shrink-0">
                                      {(client?.businessName?.[0] || client?.name?.[0] || "C").toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{client.businessName || "—"}</div>
                                    <div className="text-xs text-gray-400">{formatDate(client.createdAt)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-4">
                                <div className="text-xs text-gray-900 truncate">{client.email || "—"}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{client.mobileNo || "—"}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{client.city || "—"}</div>
                              </td>
                              <td className="px-3 py-4">
                                <button
                                  onClick={() => toggleApproval(client)}
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    client.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {client.isApproved ? <><FaCheckCircle className="mr-1" /> Approved</> : <><FaTimesCircle className="mr-1" /> Pending</>}
                                </button>
                              </td>
                              <td className="px-3 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => openClientLogin(client._id, client.email, client.name)}
                                    disabled={authenticatingClientId === client._id}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-colors ${
                                      authenticatingClientId === client._id ? "bg-gray-400 cursor-wait" : "bg-red-600 hover:bg-red-700"
                                    }`}
                                  >
                                    {authenticatingClientId === client._id ? "Loading..." : "Authenticate"}
                                  </button>
                                  <button
                                    onClick={() => handleAssignToWorkspace(client._id, isThisWs)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                      isThisWs ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    {isThisWs ? "Member" : "+ Add"}
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-4 text-center">
                                <div className="relative inline-block" ref={openSettingsMenu === client._id ? settingsMenuRef : null}>
                                  <button
                                    onClick={() => setOpenSettingsMenu(openSettingsMenu === client._id ? null : client._id)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
                                  >
                                    <FaCog className="text-gray-500 text-sm" />
                                  </button>
                                  {openSettingsMenu === client._id && (
                                    <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                      <button
                                        onClick={() => { setClientData({ ...client, confirmPassword: "" }); setEditingClient(client); setShowEditModal(true); setOpenSettingsMenu(null); }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                                      >
                                        <FaEdit className="mr-2 text-blue-500" /> Edit
                                      </button>
                                      <button
                                        onClick={() => { setOpenSettingsMenu(null); handleDeleteClient(client._id); }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                      >
                                        <FaTrash className="mr-2 text-red-500" /> Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-32 space-y-4">
              <div className="h-20 w-20 bg-gray-50 rounded-[30px] flex items-center justify-center border border-gray-100">
                <FaChartBar className="text-3xl opacity-20" />
              </div>
              <h2 className="text-xl font-black text-slate-800">{activeTab} Section</h2>
              <p className="font-medium text-slate-400">Module integration is part of the custom menu configuration.</p>
            </div>
          )}
        </main>
      </div>

      {/* Registration & Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/35 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 font-bold">
                  <FaPlus className="text-sm" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {showEditModal ? "Edit Client" : "Add New Client"}
                </h2>
              </div>
              <button
                className="text-white hover:text-red-200 transition-colors p-1"
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingClient(null); }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={showEditModal ? handleEditClient : handleCreateClient} className="overflow-y-auto flex-1 p-6">
              {/* Business Information */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                    <input type="text" required value={clientData.businessName} onChange={(e) => setClientData({...clientData, businessName: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter business name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                    <input type="url" value={clientData.websiteUrl} onChange={(e) => setClientData({...clientData, websiteUrl: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="https://example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input type="text" value={clientData.gstNo} onChange={(e) => setClientData({...clientData, gstNo: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter GST number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input type="text" value={clientData.panNo} onChange={(e) => setClientData({...clientData, panNo: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter PAN number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Logo</label>
                    <div className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            const res = await fetch(`${API_BASE_URL}/client/upload-url?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
                            const data = await res.json();
                            if (data.success && data.url && data.key) {
                              await fetch(data.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
                              setClientData(prev => ({ ...prev, businessLogoUrl: data.url.split("?")[0], businessLogoKey: data.key }));
                            } else {
                              alert("Failed to get upload URL");
                            }
                          } catch {
                            alert("Error uploading logo");
                          }
                        }}
                      />
                      {clientData.businessLogoUrl ? (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={clientData.businessLogoUrl} alt="logo preview" className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                          <span className="text-xs text-green-600 font-medium">Logo uploaded</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                    <select value={clientData.clientType} onChange={(e) => setClientData({...clientData, clientType: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm">
                      <option value="new">New</option>
                      <option value="prime">Prime</option>
                      <option value="demo">Demo</option>
                      <option value="testing">Testing</option>
                      <option value="owned">In-house</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" required value={clientData.name} onChange={(e) => setClientData({...clientData, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input type="email" required value={clientData.email} onChange={(e) => setClientData({...clientData, email: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                    <input type="tel" required value={clientData.mobileNo} onChange={(e) => setClientData({...clientData, mobileNo: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter mobile number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input type="text" required value={clientData.city} onChange={(e) => setClientData({...clientData, city: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter city" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input type="text" required value={clientData.pincode} onChange={(e) => setClientData({...clientData, pincode: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter pincode" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" value={clientData.address} onChange={(e) => setClientData({...clientData, address: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter address" />
                  </div>
                </div>
              </div>

              {/* Password - only on Add */}
              {!showEditModal && (
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Account Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input type="password" required value={clientData.password} onChange={(e) => setClientData({...clientData, password: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Enter password" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <input type="password" required value={clientData.confirmPassword} onChange={(e) => setClientData({...clientData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm" placeholder="Confirm password" />
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <p className="text-sm text-gray-500">* Required fields</p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingClient(null); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="clientForm"
                  disabled={isSubmitting}
                  onClick={(e) => { showEditModal ? handleEditClient(e) : handleCreateClient(e); }}
                  className={`px-6 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm ${
                    isSubmitting ? "bg-gray-400 text-white cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {isSubmitting ? "Saving..." : showEditModal ? "Save Changes" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .scale-in { animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes scaleIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23cbd5e1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-position: right 1.5rem center; background-repeat: no-repeat; background-size: 1.2rem; }
      `}} />
    </div>
  );
};

export default WorkspaceDashboard;
