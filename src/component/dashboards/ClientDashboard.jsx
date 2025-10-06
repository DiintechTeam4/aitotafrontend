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
import AiTotaLogo from "../../../public/AitotaLogo.png";
import PlansBrowse from "./components/PlansBrowse";
import Pricing from "./components/Pricing";

function ClientDashboard({ onLogout, clientId: propClientId }) {
  // Try to get clientId from props, sessionStorage, or clientData
  const sessionClientData = sessionStorage.getItem("clientData");
  const sessionClientId = sessionClientData
    ? JSON.parse(sessionClientData).clientId
    : null;
  const [currentClient, setCurrentClient] = useState(
    propClientId || sessionClientId || ""
  );
  const [clientInfo, setClientInfo] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [activeSection, setActiveSection] = useState(() => {
    // Get persisted section from localStorage, default to "agents"
    return localStorage.getItem("clientDashboard_activeSection") || "agents";
  });
  const [activeTab, setActiveTab] = useState(() => {
    // Get persisted tab from localStorage, default to "list"
    return localStorage.getItem("clientDashboard_activeTab") || "list";
  });
  const [apiSettingsTab, setApiSettingsTab] = useState("docs");
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
          setIsApproved(false);
          // Set fallback info
          setClientInfo({
            name: "Unknown",
            email: "No email",
            businessLogoUrl: "",
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

      case "credits":
        return <CreditsOverview />;

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
    return <div>Please log in as a client to view your dashboard.</div>;
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
    <div className="h-screen font-sans bg-gray-50">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-gray-900 to-black text-white flex flex-col shadow-lg">
          <div className="p-5 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={AiTotaLogo}
                alt="AiTota Logo"
                className="h-10 w-10 rounded-full object-cover bg-gray-800 ring-1 ring-gray-700 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white leading-tight truncate">
                  AItota
                </h1>
              </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-3" />
            <div className="flex flex-col gap-3">
              {clientInfo ? (
                <div className="rounded-xl bg-gradient-to-br from-gray-800/40 to-gray-900/30 border border-gray-700/60 p-3 shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    {clientInfo.businessLogoUrl ? (
                      <img
                        src={clientInfo.businessLogoUrl}
                        alt={clientInfo.businessName}
                        className="h-10 w-10 rounded-full object-cover bg-gray-800 ring-1 ring-gray-700 shadow-md"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          console.log("Business logo failed to load:", e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={() => {
                          console.log("Business logo loaded successfully:", clientInfo.businessLogoUrl);
                        }}
                      />
                    ) : null}
                    <div 
                      className={`h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-md ${clientInfo.businessLogoUrl ? 'hidden' : 'flex'}`}
                    >
                        {(clientInfo.businessName || "C")[0]?.toUpperCase()}
                      </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="text-sm font-semibold text-gray-100 truncate max-w-[9rem]"
                          title={clientInfo.businessName}
                        >
                          {clientInfo.businessName}
                        </div>
                      </div>
                      <div
                        className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5 truncate max-w-[11rem]"
                        title={clientInfo.name}
                      >
                        {clientInfo.name}
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2 text-xs text-gray-300 truncate"
                    title={clientInfo.email}
                  >
                    <svg
                      className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 12H8m0 0l3 3m-3-3l3-3m9 3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="truncate">{clientInfo.email}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-gradient-to-br from-gray-800/40 to-gray-900/30 border border-gray-700/60 p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-gray-700 border-t-transparent animate-spin" />
                  <div className="text-sm text-gray-400">
                    Loading client info...
                  </div>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "performance"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "performance" ? "page" : undefined}
              onClick={() => handleSectionChange("performance")}
            >
              <span className={`${activeSection === "performance" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiTrendingUp className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Performance</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "agents"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "agents" ? "page" : undefined}
              onClick={() => handleSectionChange("agents")}
            >
              <span className={`${activeSection === "agents" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiUsers className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">AI Agents</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "bond"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "bond" ? "page" : undefined}
              onClick={() => handleSectionChange("bond")}
            >
              <span className={`${activeSection === "bond" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiArrowDownLeft className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">InBound</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "outbound"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "outbound" ? "page" : undefined}
              onClick={() => handleSectionChange("outbound")}
            >
              <span className={`${activeSection === "outbound" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiArrowUpRight className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Outbound</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "human_agent"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "human_agent" ? "page" : undefined}
              onClick={() => handleSectionChange("human_agent")}
            >
              <span className={`${activeSection === "human_agent" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiUserCheck className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Sales Staff</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "mybusiness"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "mybusiness" ? "page" : undefined}
              onClick={() => handleSectionChange("mybusiness")}
            >
              <span className={`${activeSection === "mybusiness" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiBriefcase className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">My Business</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "mydials"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "mydials" ? "page" : undefined}
              onClick={() => handleSectionChange("mydials")}
            >
              <span className={`${activeSection === "mydials" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiPhone className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">My Dials</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "credits"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "credits" ? "page" : undefined}
              onClick={() => handleSectionChange("credits")}
            >
              <span className={`${activeSection === "credits" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiTrendingUp className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Credits</span>
            </button>

            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "api-settings"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "api-settings" ? "page" : undefined}
              onClick={() => handleSectionChange("api-settings")}
            >
              <span className={`${activeSection === "api-settings" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiSettings className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">API Settings</span>
            </button>
          </nav>

          <div className="p-4">
            <button
              className={`relative flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "about"
                  ? "bg-white/10 text-white border-r-4 border-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              aria-current={activeSection === "about" ? "page" : undefined}
              onClick={() => handleSectionChange("about")}
            >
              <span className={`${activeSection === "about" ? "absolute left-0 top-0 h-full w-1 bg-white" : "hidden"}`}></span>
              <FiInfo className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">About Us</span>
            </button>
            <button
              className="flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded"
              onClick={onLogout}
            >
              <FiLogOut className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

export default ClientDashboard;
