"use client";

import { useState, useEffect } from "react";
import {
  FiLink,
  FiSend,
  FiLogOut,
  FiTrendingUp,
  FiUsers,
  FiEye,
  FiInfo,
  FiUserX,
  FiUserCheck,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiBriefcase,
  FiPhone,
  FiSettings,
  FiKey,
  FiCopy,
  FiMenu,
  FiX,
  FiChevronDown,
  FiSearch,
} from "react-icons/fi";
import AgentForm from "./components/AgentForm";
import AgentList from "./components/AgentList";
import ApiKeyManager from "./components/ApiKeyManager";
import ClientSelector from "./components/ClientSelector";
import InBoundSection from "./components/InBoundSection";
import OutboundSection from "./components/OutboundSection";
import HumanAgents from "./components/HumanAgents";
import ApprovalForm from "./components/ApprovalForm";
import PerformanceKPIs from "./components/PerformanceKPIs";
import MyBusiness from "./components/MyBusiness";
import { API_BASE_URL } from "../../config";
import MyDials from "./components/MyDials";
import CreditsOverview from "./components/CreditsOverview";
import DistributionTool from "./components/DistributionTool";
const AiTotaLogo = "/AitotaLogo.png";
import PlansBrowse from "./components/PlansBrowse";
import Pricing from "./components/Pricing";
import { FiUser } from "react-icons/fi";
import LeadScraper from "./components/LeadScraper";

function ProfileDetails({ clientId, clientInfo }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem("clienttoken");
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/client/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) setProfile(data.data);
      } catch (e) {
        console.error("Error fetching profile:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [clientId]);

  if (loading) return <div className="py-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div></div>;

  const data = profile || clientInfo || {};
  const fields = [
    { label: "Full Name", value: data.name },
    { label: "Email Address", value: data.email },
    { label: "Mobile Number", value: data.mobileNo },
    { label: "Business Name", value: data.businessName },
    { label: "City", value: data.city },
    { label: "Pincode", value: data.pincode },
    { label: "Address", value: data.address },
    { label: "Website", value: data.websiteUrl },
    { label: "GST Number", value: data.gstNo },
    { label: "PAN Number", value: data.panNo },
    { label: "Profession", value: data.profession },
    { label: "Date of Birth", value: data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString("en-IN") : null },
    { label: "Member Since", value: data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : null },
    { label: "Account Status", value: data.isApproved ? "✓ Approved" : "⏳ Pending" },
  ].filter(f => f.value);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(({ label, value }) => (
        <div key={label} className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-sm font-medium text-gray-800 break-all">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ClientDashboard({ onLogout, clientId: propClientId, dashboardMode = "client" }) {
  const isUserDashboard = dashboardMode === "user";
  // Try to get clientId from props, sessionStorage, or clientData
  const sessionClientData = sessionStorage.getItem("clientData");
  const sessionClientId = sessionClientData
    ? JSON.parse(sessionClientData).clientId
    : null;
  const sessionWorkspaceName = sessionClientData
    ? JSON.parse(sessionClientData).workspaceName || null
    : null;
  const sessionWorkspaceBusinessName = sessionClientData
    ? JSON.parse(sessionClientData).workspaceBusinessName || null
    : null;

  // Fallback: read from pendingWorkspaceData if clientData doesn't have workspace info
  const pendingWsRaw = sessionStorage.getItem("pendingWorkspaceData");
  const pendingWs = pendingWsRaw ? (() => { try { return JSON.parse(pendingWsRaw); } catch { return {}; } })() : {};
  const resolvedWorkspaceName = (sessionClientData ? JSON.parse(sessionClientData).workspaceName : null) || pendingWs.workspaceName || null;
  const [currentClient, setCurrentClient] = useState(
    propClientId || sessionClientId || ""
  );
  const [clientInfo, setClientInfo] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [activeSection, setActiveSection] = useState(() => {
    // Check URL params first for campaign/group details
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('campaignId') || urlParams.get('groupId')) {
      // Always stay on outbound section when campaign/group params are present
      // This ensures campaign details page persists on refresh
      return "outbound";
    }
    // Get persisted section from localStorage, default to "agents"
    return localStorage.getItem("clientDashboard_activeSection") || "agents";
  });
  const [activeTab, setActiveTab] = useState(() => {
    // Get persisted tab from localStorage, default to "list"
    return localStorage.getItem("clientDashboard_activeTab") || "list";
  });
  const [apiSettingsTab, setApiSettingsTab] = useState("docs");
  const [aiCallsOpen, setAiCallsOpen] = useState(
    activeSection === "bond" || activeSection === "outbound"
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyPreview, setApiKeyPreview] = useState("");
  const [isApproved, setIsApproved] = useState(null);
  const [isProfileCompleted, setIsProfileCompleted] = useState(null);

  // Initialize currentClient from sessionStorage if not provided via props
  useEffect(() => {
    if (!currentClient || currentClient === "") {
      const sessionClientData = sessionStorage.getItem("clientData");

      if (sessionClientData) {
        try {
          const parsedData = JSON.parse(sessionClientData);

          if (parsedData.clientId) {
            setCurrentClient(parsedData.clientId);
          } else {
            console.log("No clientId found in parsedData");
          }
        } catch (error) {
          console.error("Error parsing client data:", error);
        }
      } else {
        console.log("No clientData found in sessionStorage");
      }
    }
  }, []);

  // Monitor URL changes and maintain activeSection for campaign/group views
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('campaignId');
    const groupId = urlParams.get('groupId');
    
    if (campaignId || groupId) {
      // Always set to outbound when campaign/group params are present
      // This ensures campaign details page persists on refresh
      setActiveSection("outbound");
      localStorage.setItem("clientDashboard_activeSection", "outbound");
    }
  }, [window.location.search]);

  useEffect(() => {
    const token = sessionStorage.getItem("clienttoken");
    if (token && currentClient) {
      // Get client profile with fresh business logo URL
      fetch(`${API_BASE_URL}/client/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Client profile data received:", data);
          if (data.success && data.data) {
            console.log("Fresh business logo URL:", data.data.businessLogoUrl);
            
            // Set approval status
          const isApproved = data.data?.isApproved;
          const isProfileCompleted = data.data?.isprofileCompleted;
          setIsApproved(isApproved);
          setIsProfileCompleted(isProfileCompleted);
            
            // Set client info with fresh business logo URL
            setClientInfo({
              name: data.data.name || "Unknown",
              email: data.data.email || "No email",
              businessName: data.data.businessName || "Unknown",
              businessLogoUrl: data.data.businessLogoUrl || "",
              clientId: currentClient,
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
          // Workspace login - profile may not exist in Client collection, still show dashboard
          setIsApproved(true);
          setIsProfileCompleted(true);
          setClientInfo({
            name: sessionStorage.getItem('clientData') ? JSON.parse(sessionStorage.getItem('clientData')).name || 'Workspace' : 'Workspace',
            email: sessionStorage.getItem('clientData') ? JSON.parse(sessionStorage.getItem('clientData')).email || '' : '',
            businessLogoUrl: '',
            clientId: currentClient,
          });
        });
    }
  }, [currentClient]);

  useEffect(() => {
    if (currentClient) fetchAgents();
  }, [currentClient]);

  const fetchAgents = async () => {
    try {
      setAgentsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/client/agents?clientId=${currentClient}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          },
        }
      );
      const result = await response.json();
      if (result.success && result.data) {
        setAgents(result.data);
      } else {
        setAgents([]);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  };

  const handleAgentSaved = () => {
    fetchAgents();
    setEditingAgent(null);
    persistTabChange("list");
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setActiveTab("form");
  };

  const handleDeleteAgent = async (id) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      try {
        const token = sessionStorage.getItem("clienttoken");
        const response = await fetch(
          `${API_BASE_URL}/client/agents/${id}?clientId=${currentClient}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          alert("Agent deleted successfully!");
          fetchAgents();
        } else {
          const errorData = await response.json();
          alert(`Error deleting agent: ${errorData.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error deleting agent:", error);
        alert("Failed to delete agent");
      }
    }
  };

  // Function to persist section changes
  const persistSectionChange = (section) => {
    setActiveSection(section);
    localStorage.setItem("clientDashboard_activeSection", section);

    // Reset to default tab when changing sections
    if (section === "agents") {
      setActiveTab("list");
      localStorage.setItem("clientDashboard_activeTab", "list");
    }

    // If navigating away from Outbound, clear campaign/group URL params
    if (section !== "outbound") {
      try {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        const hadParams = params.has('campaignId') || params.has('groupId');
        if (hadParams) {
          params.delete('campaignId');
          params.delete('groupId');
          url.search = params.toString();
          window.history.replaceState({}, document.title, url.toString());
        }
      } catch (_) {}
    }

    setEditingAgent(null);
  };

  // Function to persist tab changes
  const persistTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("clientDashboard_activeTab", tab);
  };

  const handleClientChange = (newClientId) => {
    setCurrentClient(newClientId);
    // Reset to default when changing clients
    setActiveSection("agents");
    setActiveTab("list");
    localStorage.setItem("clientDashboard_activeSection", "agents");
    localStorage.setItem("clientDashboard_activeTab", "list");
    setEditingAgent(null);
  };

  const handleSectionChange = (section) => {
    persistSectionChange(section);
    setIsMobileMenuOpen(false);
    if (section === "bond" || section === "outbound") {
      setAiCallsOpen(true);
    }
  };

  // API Key functions
  const generateApiKey = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        alert("You must be logged in to generate an API key.");
        return;
      }
      const resp = await fetch(`${API_BASE_URL}/client/api-key/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await resp.json();
      if (resp.ok && json?.success && json?.data?.key) {
        setApiKey(json.data.key);
        // After generating, refresh preview to reflect the latest
        setApiKeyPreview(
          json.data.key.substring(0, 8) + "..." + json.data.key.slice(-4)
        );
        try {
          const sessionClientData = sessionStorage.getItem("clientData");
          const clientId = sessionClientData
            ? JSON.parse(sessionClientData).clientId
            : null;
          if (clientId) {
            localStorage.setItem(`client_api_key_${clientId}`, json.data.key);
          }
        } catch {}
      } else {
        alert(json?.error || "Failed to generate API key");
      }
    } catch (e) {
      console.error("Failed to generate API key", e);
      alert("Failed to generate API key");
    }
  };

  // No regeneration allowed per requirements

  const copyApiKey = async (keyFromState) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (keyFromState && keyFromState.startsWith("ait_")) {
        await navigator.clipboard.writeText(keyFromState);
        alert("API key copied to clipboard!");
        return;
      }
      if (!token) {
        alert("Not authorized");
        return;
      }
      const resp = await fetch(`${API_BASE_URL}/client/api-key/copy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await resp.json();
      if (resp.ok && json?.success && json?.data?.key) {
        await navigator.clipboard.writeText(json.data.key);
        alert("API key copied to clipboard!");
      } else {
        alert(json?.error || "Failed to copy API key");
      }
    } catch (err) {
      alert("Failed to copy API key");
    }
  };

  // Fetch existing API key preview when opening the API Key tab
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const token = sessionStorage.getItem("clienttoken");
        if (!token) return;
        const resp = await fetch(`${API_BASE_URL}/client/api-key`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await resp.json();
        if (resp.ok && json?.success && json?.data?.keyPreview) {
          setApiKeyPreview(json.data.keyPreview);
        } else {
          setApiKeyPreview("");
        }
        // Do not use localStorage; rely on server for copy action
        setApiKey("");
      } catch (_) {
        setApiKeyPreview("");
      }
    };
    if (apiSettingsTab === "api-key") {
      fetchPreview();
    }
  }, [apiSettingsTab]);

  const renderMainContent = () => {
    switch (activeSection) {
      case "about":
        return (
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                About Us
              </h2>
              <p className="text-gray-600 text-lg">
                Welcome to your AiTota Dashboard
              </p>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiEye className="w-5 h-5 text-blue-600" />
                    About AiTota
                  </h3>
                  <div className="space-y-4 text-gray-700">
                    <p>
                      <strong>AiTota</strong> is a comprehensive AI-powered
                      business management platform that helps you:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>
                        Create and manage AI agents for customer interactions
                      </li>
                      <li>Handle inbound and outbound communications</li>
                      <li>Track performance metrics and KPIs</li>
                      <li>Automate customer service and lead generation</li>
                      <li>Monitor call logs and conversation analytics</li>
                    </ul>
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
                      <div className="text-2xl font-bold text-blue-600">
                        {agents.length}
                      </div>
                      <div className="text-sm text-gray-600">Active Agents</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-gray-600">Total Calls</div>
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
                        0
                      </div>
                      <div className="text-sm text-gray-600">Campaigns</div>
                    </div>
                  </div>
                </div>

                {/* Features AboutUs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiUsers className="w-5 h-5 text-indigo-600" />
                    Platform Features
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">AI Agent Management</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">
                        Inbound Call Handling
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700">Outbound Campaigns</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-700">
                        Performance Analytics
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700">Lead Management</span>
                    </div>
                  </div>
                </div>

                {/* Getting Started */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiLink className="w-5 h-5 text-emerald-600" />
                    Getting Started
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Create Your First Agent
                        </div>
                        <div className="text-sm text-gray-600">
                          Set up an AI agent to handle customer interactions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Configure Inbound Settings
                        </div>
                        <div className="text-sm text-gray-600">
                          Set up call handling and routing rules
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Launch Outbound Campaigns
                        </div>
                        <div className="text-sm text-gray-600">
                          Start automated outreach campaigns
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Monitor Performance
                        </div>
                        <div className="text-sm text-gray-600">
                          Track KPIs and optimize your campaigns
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "agents":
        return (
          <div className="h-full flex flex-col">
            {activeTab !== "form" && (
              <div className="px-8 py-6 bg-white border-b border-gray-200">
                <h2 className="text-3xl font-bold mb-4 text-gray-900">
                  AI Agents
                </h2>
                <nav className="flex gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      className={`px-5 py-3 text-sm font-medium rounded-md transition-all ${
                        activeTab === "list"
                          ? "bg-black text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      onClick={() => persistTabChange("list")}
                    >
                      Agents ({agents.length})
                    </button>
                  </div>

                  <button
                    className="px-5 py-3 text-sm font-medium rounded-md transition-all bg-black text-white hover:bg-gray-800"
                    onClick={() => {
                      persistTabChange("form");
                      setEditingAgent(null);
                    }}
                  >
                    {editingAgent ? "Update Agent" : "Create Agent"}
                  </button>
                </nav>
              </div>
            )}

            <div className="flex-1 p-8 overflow-y-auto">
              {activeTab === "list" && (
                <AgentList
                  agents={agents}
                  isLoading={agentsLoading}
                  onEdit={handleEditAgent}
                  onDelete={handleDeleteAgent}
                  clientId={currentClient}
                />
              )}

              {activeTab === "form" && (
                <AgentForm
                  agent={editingAgent}
                  onSave={handleAgentSaved}
                  onCancel={() => {
                    persistTabChange("list");
                    setEditingAgent(null);
                  }}
                  clientId={currentClient}
                />
              )}

              {activeTab === "api-keys" && (
                <ApiKeyManager clientId={currentClient} />
              )}

              {activeTab === "settings" && (
                <ClientSelector
                  currentClient={currentClient}
                  onClientChange={handleClientChange}
                />
              )}
            </div>
          </div>
        );

      case "performance":
        return <PerformanceKPIs />;

      case "bond":
        return (
          <div className="h-full p-8">
            <InBoundSection clientId={currentClient} />
          </div>
        );

      case "outbound":
        return <OutboundSection clientId={currentClient} />;

      case "human_agent":
        return <HumanAgents />;

      case "mybusiness":
        return <MyBusiness />;

      case "mydials":
        return <MyDials />;

      case "profile":
        return (
          <div className="h-full p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              {/* Profile Header Card */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl overflow-hidden mb-6 shadow-lg">
                <div className="px-8 py-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg">
                    {(clientInfo?.name?.[0] || clientInfo?.businessName?.[0] || "U").toUpperCase()}
                  </div>
                  <h2 className="text-xl font-bold text-white">{clientInfo?.name || "User"}</h2>
                  <p className="text-slate-300 text-sm mt-1">{clientInfo?.email || ""}</p>
                  {clientInfo?.businessName && (
                    <p className="text-slate-400 text-xs mt-1">{clientInfo.businessName}</p>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Account Information</h3>
                <ProfileDetails clientId={currentClient} clientInfo={clientInfo} />
              </div>
            </div>
          </div>
        );

      case "lead-scraper":
        return <LeadScraper clientId={currentClient} />;

      case "credits":
        return <CreditsOverview />;

      case "distribution":
        return <DistributionTool />;

      case "api-settings":
        return (
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                API Settings
              </h2>
              <nav className="flex gap-2">
                <button
                  className={`px-5 py-3 text-sm font-medium rounded-md transition-all ${
                    apiSettingsTab === "docs"
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  onClick={() => setApiSettingsTab("docs")}
                >
                  <FiEye className="inline w-4 h-4 mr-2" />
                  Docs
                </button>
                <button
                  className={`px-5 py-3 text-sm font-medium rounded-md transition-all ${
                    apiSettingsTab === "api-key"
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  onClick={() => setApiSettingsTab("api-key")}
                >
                  <FiKey className="inline w-4 h-4 mr-2" />
                  API Key
                </button>
              </nav>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              {apiSettingsTab === "docs" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="text-center py-12">
                    <FiEye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                      Documentation Coming Soon
                    </h3>
                    <p className="text-gray-400">
                      API documentation will be available here soon.
                    </p>
                  </div>
                </div>
              )}

              {apiSettingsTab === "api-key" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="max-w-2xl">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                      API Key Management
                    </h3>

                    {!apiKey && apiKeyPreview ? (
                      <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Active Key (preview)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={apiKeyPreview}
                              readOnly
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
                            />
                            <button
                              onClick={() => copyApiKey(apiKey)}
                              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
                              title="Copies securely via server."
                            >
                              <FiCopy className="w-4 h-4" />
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Key is already generated. For security, it cannot be
                            regenerated or revealed again.
                          </p>
                        </div>
                      </div>
                    ) : !apiKey ? (
                      <div className="text-center py-8">
                        <FiKey className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-700 mb-2">
                          No API Key Generated
                        </h4>
                        <p className="text-gray-500 mb-6">
                          Generate an API key to start using our API services.
                        </p>
                        <button
                          onClick={generateApiKey}
                          disabled={!!apiKeyPreview}
                          className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                            apiKeyPreview
                              ? "bg-gray-300 text-white cursor-not-allowed"
                              : "bg-black text-white hover:bg-gray-800"
                          }`}
                        >
                          {apiKeyPreview
                            ? "Key Already Generated"
                            : "Generate API Key"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your API Key (hidden)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={
                                apiKey.substring(0, 8) +
                                "..." +
                                apiKey.slice(-4)
                              }
                              readOnly
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
                            />
                            <button
                              onClick={() => copyApiKey(apiKey)}
                              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                              <FiCopy className="w-4 h-4" />
                              Copy
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Copy and store it securely now. You will not be able
                            to view the full key again.
                          </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 text-yellow-600 mt-0.5">
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-yellow-800">
                                Important Security Notice
                              </h4>
                              <p className="text-sm text-yellow-700 mt-1">
                                This API key provides access to your account.
                                Store it securely and never expose it in
                                client-side code or public repositories.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Regeneration disabled by requirement */}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div>Select a section from the sidebar</div>;
    }
  };

  // Check if we have a valid client ID
  if (!currentClient || currentClient === "") {
    // Check if we're still loading client data
    const sessionClientData = sessionStorage.getItem("clientData");
    if (sessionClientData) {
      try {
        const parsedData = JSON.parse(sessionClientData);
        if (parsedData.clientId) {
          // We have client data but currentClient hasn't been set yet
          return <div>Loading client dashboard...</div>;
        }
      } catch (error) {
        console.error("Error parsing client data:", error);
      }
    }
    return <div>Please log in to view your dashboard.</div>;
  }

  // Show loading while fetching data
  if (isApproved === null || isProfileCompleted === null) {
    return <div>Loading...</div>;
  }

  // If not approved and profile not completed, show approval form
  if (isApproved === false && isProfileCompleted === false) {
    return <ApprovalForm />;
  }

  // If not approved but profile is completed, show under review page
  if (isApproved === false && isProfileCompleted === true) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-black p-8 text-center">
            <h1 className="m-0 text-3xl font-bold text-white tracking-tight">
              Application Under Review
            </h1>
            <p className="mt-2 text-lg text-gray-300 opacity-90">
              Thank you for submitting your application
            </p>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <div className="text-6xl mb-6">⏳</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Your application is being reviewed
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-6">
              We have received your business approval application and our team
              is currently reviewing it. This process typically takes 2-3
              business days.
            </p>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mt-6">
              <div className="text-sm font-semibold text-gray-800 mb-2">
                What happens next?
              </div>
              <ul className="text-sm text-gray-700 text-left list-disc pl-5 m-0">
                <li>Our team will review your business information</li>
                <li>We'll verify your documents and credentials</li>
                <li>You'll receive an email notification once approved</li>
                <li>Upon approval, you'll have full access to the platform</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-gray-50">

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex min-h-[calc(100vh-0px)]">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white text-gray-700 flex flex-col shadow-lg border-r border-gray-200 transform transition-transform duration-200 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-5 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center gap-3">
              <img
                src={AiTotaLogo}
                alt="AiTota Logo"
                className="h-10 w-10 rounded-full object-cover bg-slate-700 ring-1 ring-slate-600 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white leading-tight truncate">
                  {resolvedWorkspaceName || (isUserDashboard ? "User Portal" : "Client Portal")}
                </h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "performance"
                  ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={activeSection === "performance" ? "page" : undefined}
              onClick={() => handleSectionChange("performance")}
            >
              <span className="hidden"></span>
              <FiTrendingUp className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Performance</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "agents"
                  ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={activeSection === "agents" ? "page" : undefined}
              onClick={() => handleSectionChange("agents")}
            >
              <span className="hidden"></span>
              <FiUsers className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">AI Agents</span>
            </button>

            {/* AI Calls Dropdown */}
            <div>
              <button
                className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                  activeSection === "bond" || activeSection === "outbound"
                    ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                onClick={() => setAiCallsOpen(prev => !prev)}
              >
                <FiPhone className="text-xl w-6 text-center" />
                <span className="flex-1 font-medium">AI Calls</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${aiCallsOpen ? "rotate-180" : ""}`} />
              </button>
              {aiCallsOpen && (
                <div className="bg-gray-50">
                  <button
                    className={`flex items-center w-full pl-14 pr-6 py-3 text-left transition-all duration-200 gap-2 ${
                      activeSection === "bond"
                        ? "text-gray-900 font-semibold border-r-4 border-gray-800 bg-gray-100"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSectionChange("bond")}
                  >
                    <FiArrowDownLeft className="w-4 h-4" />
                    <span className="text-sm">Inbound</span>
                  </button>
                  <button
                    className={`flex items-center w-full pl-14 pr-6 py-3 text-left transition-all duration-200 gap-2 ${
                      activeSection === "outbound"
                        ? "text-gray-900 font-semibold border-r-4 border-gray-800 bg-gray-100"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSectionChange("outbound")}
                  >
                    <FiArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">Outbound</span>
                  </button>
                </div>
              )}
            </div>

            {!isUserDashboard && (
              <button
                className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                  activeSection === "human_agent"
                    ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                aria-current={activeSection === "human_agent" ? "page" : undefined}
                onClick={() => handleSectionChange("human_agent")}
              >
                <span className="hidden"></span>
                <FiUserCheck className="text-xl w-6 text-center" />
                <span className="flex-1 font-medium">Team</span>
              </button>
            )}

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "mybusiness"
                  ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={activeSection === "mybusiness" ? "page" : undefined}
              onClick={() => handleSectionChange("mybusiness")}
            >
              <span className="hidden"></span>
              <FiBriefcase className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">My Business</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "mydials"
                  ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={activeSection === "mydials" ? "page" : undefined}
              onClick={() => handleSectionChange("mydials")}
            >
              <span className="hidden"></span>
              <FiPhone className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">My Dials</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "distribution"
                  ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={activeSection === "distribution" ? "page" : undefined}
              onClick={() => handleSectionChange("distribution")}
            >
              <span className="hidden"></span>
              <FiSend className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Distribution Tool</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "lead-scraper"
                  ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              onClick={() => handleSectionChange("lead-scraper")}
            >
              <FiSearch className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Lead Scraper</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "credits"
                  ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={activeSection === "credits" ? "page" : undefined}
              onClick={() => handleSectionChange("credits")}
            >
              <span className="hidden"></span>
              <FiTrendingUp className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Credits</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "profile"
                  ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={activeSection === "profile" ? "page" : undefined}
              onClick={() => handleSectionChange("profile")}
            >
              <FiUser className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Profile</span>
            </button>

            {!isUserDashboard && (
              <button
                className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                  activeSection === "api-settings"
                    ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                aria-current={activeSection === "api-settings" ? "page" : undefined}
                onClick={() => handleSectionChange("api-settings")}
              >
                <span className="hidden"></span>
                <FiSettings className="text-xl w-6 text-center" />
                <span className="flex-1 font-medium">API Settings</span>
              </button>
            )}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "about"
                  ? "bg-gray-100 text-gray-900 border-r-4 border-gray-800 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={activeSection === "about" ? "page" : undefined}
              onClick={() => handleSectionChange("about")}
            >
              <FiInfo className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">About Us</span>
            </button>
            <button
              className="flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded"
              onClick={onLogout}
            >
              <FiLogOut className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white lg:ml-0">
          {/* Top Header */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
            <div className="flex justify-between items-center px-6 py-3">
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden p-2 text-gray-600"
                  onClick={() => setIsMobileMenuOpen(prev => !prev)}
                >
                  <FiMenu className="w-5 h-5" />
                </button>
                <span className="font-semibold text-gray-800 text-sm capitalize">
                  {activeSection.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Client info + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowClientDropdown(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
                    {(clientInfo?.businessName?.[0] || clientInfo?.name?.[0] || 'C').toUpperCase()}
                  </div>
                  {!isMobileMenuOpen && (
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{clientInfo?.name || 'Client'}</p>
                      <p className="text-xs text-gray-500 leading-tight">{clientInfo?.email || ''}</p>
                    </div>
                  )}
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showClientDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showClientDropdown && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{clientInfo?.name || 'Client'}</p>
                      <p className="text-xs text-gray-500 truncate">{clientInfo?.email || ''}</p>
                      {clientInfo?.businessName && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{sessionWorkspaceBusinessName || clientInfo.businessName}</p>
                      )}
                    </div>
                    <button
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 gap-2"
                      onClick={() => { setShowClientDropdown(false); handleSectionChange('mybusiness'); }}
                    >
                      <FiBriefcase className="text-gray-400" /> My Business
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 gap-2 border-t border-gray-100"
                      onClick={() => { setShowClientDropdown(false); onLogout(); }}
                    >
                      <FiLogOut className="text-red-400" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

export default ClientDashboard;
