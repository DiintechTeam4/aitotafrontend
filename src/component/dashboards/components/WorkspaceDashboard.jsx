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
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSettingsMenu, setOpenSettingsMenu] = useState(null);

  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobile, setIsMobile] = useState(false);
  const settingsMenuRef = useRef(null);

  // Constants
  const token = localStorage.getItem("admintoken") || sessionStorage.getItem("admintoken");
  const loggedInClients = new Set(); // This would normally be handled by a global state or parent

  // Form State for New/Edit Client
  const initialClientState = {
    name: "", email: "", password: "", confirmPassword: "",
    businessName: "", websiteUrl: "", city: "", pincode: "",
    gstNo: "", panNo: "", mobileNo: "", address: "",
    clientType: "new"
  };
  const [clientData, setClientData] = useState(initialClientState);

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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/getclients`, {
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

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (clientData.password !== clientData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/createclient`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...clientData, workspaceId: workspace._id })
      });
      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        fetchClients();
        setClientData(initialClientState);
      } else {
        alert(data.message || "Failed to create client");
      }
    } catch (error) {
      console.error("Error creating client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/editclient/${editingClient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(clientData)
      });
      const data = await response.json();
      if (data.success) {
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
      const data = await response.json();
      if (data.success) fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const toggleApproval = async (client) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/approveclient/${client._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved: !client.isApproved })
      });
      const data = await response.json();
      if (data.success) fetchClients();
    } catch (error) {
      console.error("Error toggling approval:", error);
    }
  };

  const openClientLogin = (clientId, email, name) => {
    const loginData = {
        token: token,
        client: {
            _id: clientId,
            email: email,
            name: name
        }
    };
    localStorage.setItem('clientToken', token);
    localStorage.setItem('clientData', JSON.stringify(loginData.client));
    window.open('/client/dashboard', '_blank');
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

  const filteredClients = clients.filter(c => {
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

  const clientTypeCounts = clients.reduce((acc, c) => {
    const type = (c.clientType || "new").toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, { all: 0, new: 0, prime: 0, demo: 0, testing: 0, owned: 0, rejected: 0 });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar - Consistent with Workspace style */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/5 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center space-x-3 border-b border-white/5">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
              <FaBuilding className="text-white text-xl" />
            </div>
            <span className="font-black text-xl text-white tracking-tighter">AiTota</span>
          </div>
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            <p className="px-2 text-[10px] font-black text-white/30 uppercase tracking-[2px] mb-4">Workspace Menu</p>
            {sidebarTabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => { setActiveTab(tab.name); if (isMobile) setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === tab.name ? "bg-purple-600 shadow-xl shadow-purple-600/30 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"}`}
              >
                <span className={`text-lg transition-transform duration-300 group-hover:scale-110 ${activeTab === tab.name ? "text-white" : "text-purple-500"}`}>{tab.icon}</span>
                <span className="font-bold text-sm tracking-tight">{tab.name}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-white/5 bg-black/20">
            <button onClick={onBack} className="w-full flex items-center space-x-3 px-4 py-4 rounded-2xl text-white/40 hover:bg-red-500 transition-all font-bold text-sm hover:text-white">
              <FaSignOutAlt />
              <span>Exit Dashboard</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-40 sticky top-0 shadow-sm">
          <div className="flex items-center space-x-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-slate-400 hover:text-purple-600 transition-colors">
              <FaBars className="text-lg" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-black text-slate-800 tracking-tight lowercase">/ {activeTab.toLowerCase()}</h2>
                <span className="bg-purple-50 text-purple-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">{workspace.name}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#f8fafc]">
          {activeTab === "Overview" ? (
             <div className="max-w-7xl mx-auto space-y-8">
               <div className="p-10 bg-slate-900 rounded-[40px] text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <h1 className="text-4xl font-black tracking-tight">Welcome, {workspace.name}</h1>
                    <p className="text-white/60 font-medium mt-2 max-w-md">Your workspace is active and currently managing {clients.filter(c => c.workspaceId?.toString() === workspace._id.toString()).length} clients.</p>
                  </div>
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <FaBuilding className="text-9xl" />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total System Clients", val: clients.length, color: "from-blue-500 to-indigo-600" },
                  { label: "Workspace Clients", val: clients.filter(c => c.workspaceId?.toString() === workspace._id.toString()).length, color: "from-purple-500 to-pink-600" },
                  { label: "Pending Approvals", val: clients.filter(c => !c.isApproved).length, color: "from-amber-500 to-orange-600" },
                  { label: "Workspace Health", val: "Optimal", color: "from-emerald-500 to-teal-600" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.val}</h3>
                  </div>
                ))}
              </div>
             </div>
          ) : (activeTab.toLowerCase() === "clients" || activeTab.toLowerCase() === "client") ? (
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">Client Hub</h1>
                  <p className="text-slate-500 font-medium mt-1">Manage, authenticate and configure system-wide clients</p>
                </div>
                <button
                  onClick={() => { setClientData(initialClientState); setShowAddModal(true); }}
                  className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-[22px] flex items-center transition-all shadow-xl shadow-slate-200 active:scale-95 font-black text-sm tracking-tight"
                >
                  <FaPlus className="mr-3" /> REGISTER CLIENT
                </button>
              </div>

              {/* Status Filters - Admin Style but Premium UI */}
              <div className="flex flex-wrap gap-3 items-center bg-white/50 p-2 rounded-[28px] border border-white">
                  {[
                    { key: "all", label: "All Clients" },
                    { key: "new", label: "New" },
                    { key: "prime", label: "Prime" },
                    { key: "demo", label: "Demo" },
                    { key: "owned", label: "In-house" },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setClientTypeFilter(btn.key)}
                      className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        clientTypeFilter === btn.key
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "bg-white text-slate-500 border border-gray-100 hover:border-purple-200"
                      }`}
                    >
                      {btn.label} <span className="ml-2 font-mono opacity-50">{clientTypeCounts[btn.key] || 0}</span>
                    </button>
                  ))}
                  <div className="flex-1"></div>
                  <div className="relative max-w-xs">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search hub..."
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-50 rounded-2xl focus:ring-4 focus:ring-purple-500/10 transition-all font-bold text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
              </div>

              <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/40 border border-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                        <th className="px-8 py-6">Business Node</th>
                        <th className="px-8 py-6">Control Panel</th>
                        <th className="px-8 py-6">Verification</th>
                        <th className="px-8 py-6">Workspace</th>
                        <th className="px-8 py-6 text-center">Settings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr><td colSpan="5" className="px-8 py-24 text-center"><div className="animate-spin h-12 w-12 border-b-2 border-purple-600 mx-auto rounded-full"></div></td></tr>
                      ) : filteredClients.length === 0 ? (
                        <tr><td colSpan="5" className="px-8 py-24 text-center font-bold text-slate-400">No active nodes found matching criteria</td></tr>
                      ) : (
                        filteredClients.map((client) => {
                          const isThisWs = client.workspaceId?.toString() === workspace._id.toString();
                          return (
                            <tr key={client._id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-6">
                                <div className="flex items-center space-x-4">
                                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-2.5 border border-purple-100/50 group-hover:scale-105 transition-transform">
                                    {getClientLogoUrl(client) ? (
                                      <img src={getClientLogoUrl(client)} alt="logo" className="h-full w-full object-contain rounded-lg" />
                                    ) : (
                                      <span className="text-xl font-black text-purple-600">{(client.businessName?.[0] || client.name?.[0] || "C").toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-black text-slate-800 text-sm truncate">{client.businessName}</div>
                                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{client.name}</div>
                                    <div className="flex items-center mt-1 text-[10px] text-slate-400 font-medium">
                                       <FaMapMarkerAlt className="mr-1" /> {client.city || "Remote"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <button
                                  onClick={() => openClientLogin(client._id, client.email, client.name)}
                                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    loggedInClients.has(client._id)
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-slate-100 text-slate-600 hover:bg-purple-600 hover:text-white hover:shadow-lg hover:shadow-purple-200"
                                  }`}
                                >
                                  {loggedInClients.has(client._id) ? "Ghost Login" : "Authenticate"}
                                </button>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center space-x-4">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                                      <button 
                                        onClick={() => toggleApproval(client)}
                                        className={`mt-1 flex items-center text-xs font-bold ${client.isApproved ? "text-emerald-600" : "text-amber-500"}`}
                                      >
                                        {client.isApproved ? <><FaCheckCircle className="mr-1.5" /> Verified</> : <><FaTimesCircle className="mr-1.5" /> Pending</>}
                                      </button>
                                   </div>
                                   <div className="h-8 w-px bg-gray-100 mx-2"></div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KYC</span>
                                      <span className="text-[11px] font-mono text-slate-600 mt-1">{client.gstNo ? "GST-Done" : "Empty"}</span>
                                   </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                  <button
                                    onClick={() => handleAssignToWorkspace(client._id, isThisWs)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center ${
                                      isThisWs ? "bg-purple-100 text-purple-600" : "bg-slate-50 text-slate-400 hover:bg-slate-200"
                                    }`}
                                  >
                                    {isThisWs ? <><FaCheck className="mr-2" /> Members</> : <><FaPlus className="mr-2" /> Add</>}
                                  </button>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div className="relative inline-block text-left" ref={openSettingsMenu === client._id ? settingsMenuRef : null}>
                                   <button 
                                      onClick={() => setOpenSettingsMenu(openSettingsMenu === client._id ? null : client._id)}
                                      className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                                   >
                                      <FaCog />
                                   </button>
                                   {openSettingsMenu === client._id && (
                                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden scale-in py-2">
                                        <button onClick={() => { setClientData({ ...client, confirmPassword: client.password }); setEditingClient(client); setShowEditModal(true); setOpenSettingsMenu(null); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center"><FaEdit className="mr-3 text-slate-400" /> Edit Node</button>
                                        <button onClick={() => { setOpenSettingsMenu(null); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center"><FaUserCog className="mr-3 text-slate-400" /> End-user Profile</button>
                                        <div className="h-px bg-gray-50 my-1"></div>
                                        <button onClick={() => { setOpenSettingsMenu(null); handleDeleteClient(client._id); }} className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center"><FaTrash className="mr-3" /> Decommission</button>
                                     </div>
                                   )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col scale-in border-[10px] border-white">
            <div className="px-10 py-8 flex justify-between items-center bg-gray-50/80">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{showEditModal ? "Edit Client Node" : "Node Registration"}</h3>
                <p className="text-[11px] font-black text-purple-600 uppercase tracking-[3px] mt-1">{showEditModal ? "Modify existing system parameters" : "Initial system deployment configuration"}</p>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingClient(null); }} 
                className="h-12 w-12 flex items-center justify-center rounded-[20px] bg-white text-slate-400 hover:text-red-500 transition-all shadow-sm border border-gray-100 hover:rotate-90"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={showEditModal ? handleEditClient : handleCreateClient} className="overflow-y-auto p-10 space-y-10">
              <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Identity & Security</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Primary Representative *</label>
                    <input required value={clientData.name} onChange={(e) => setClientData({...clientData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Transmission Email *</label>
                    <input type="email" required value={clientData.email} onChange={(e) => setClientData({...clientData, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" />
                  </div>
                  {!showEditModal && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Gateway Password *</label>
                        <input type="password" required value={clientData.password} onChange={(e) => setClientData({...clientData, password: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Confirm Access *</label>
                        <input type="password" required value={clientData.confirmPassword} onChange={(e) => setClientData({...clientData, confirmPassword: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Mobile Uplink *</label>
                    <input type="tel" required value={clientData.mobileNo} onChange={(e) => setClientData({...clientData, mobileNo: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Business & Compliance</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Legal Entity Name *</label>
                    <input required value={clientData.businessName} onChange={(e) => setClientData({...clientData, businessName: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">GST/TAX ID</label>
                    <input value={clientData.gstNo} onChange={(e) => setClientData({...clientData, gstNo: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">PAN Card No</label>
                    <input value={clientData.panNo} onChange={(e) => setClientData({...clientData, panNo: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Operating City *</label>
                    <input required value={clientData.city} onChange={(e) => setClientData({...clientData, city: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Pincode *</label>
                    <input required value={clientData.pincode} onChange={(e) => setClientData({...clientData, pincode: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Node Type</label>
                    <select value={clientData.clientType} onChange={(e) => setClientData({...clientData, clientType: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[24px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold appearance-none">
                       <option value="new">New</option>
                       <option value="prime">Prime</option>
                       <option value="demo">Demo</option>
                       <option value="testing">Testing</option>
                       <option value="owned">In-house</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Base of Operations *</label>
                  <textarea required value={clientData.address} onChange={(e) => setClientData({...clientData, address: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-[32px] focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-bold min-h-[120px]" />
                </div>
              </div>

              <div className="pt-6">
                 <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black py-6 rounded-[32px] hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3 text-sm tracking-widest uppercase">
                   {isSubmitting ? <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <><FaCheck /> <span>Commit Configuration</span></>}
                 </button>
              </div>
            </form>
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
