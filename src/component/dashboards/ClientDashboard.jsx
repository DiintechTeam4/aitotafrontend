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
} from "react-icons/fi";
import AgentForm from "./components/AgentForm";
import AgentList from "./components/AgentList";
import ApiKeyManager from "./components/ApiKeyManager";
import ClientSelector from "./components/ClientSelector";
import InBoundSection from "./components/InBoundSection";
import OutboundSection from "./components/OutboundSection";
import HumanAgents from './components/HumanAgents';
import ApprovalForm from "./components/ApprovalForm";
import PerformanceKPIs from "./components/PerformanceKPIs";
import { API_BASE_URL } from "../../config";

function ClientDashboard({ onLogout, clientId: propClientId }) {
  // Try to get clientId from props, sessionStorage, or clientData
  const sessionClientData = sessionStorage.getItem("clientData");
  const sessionClientId = sessionClientData
    ? JSON.parse(sessionClientData).clientId
    : null;
  const [currentClient, setCurrentClient] = useState(
    propClientId || sessionClientId || ""
  );
  const [agents, setAgents] = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);
  const [activeSection, setActiveSection] = useState("agents");
  const [activeTab, setActiveTab] = useState("list"); // For agents subsections
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
      fetch(`${API_BASE_URL}/client/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          // The backend returns data wrapped in a 'data' property
          const isApproved = data.data?.isApproved;
          const isProfileCompleted = data.data?.isprofileCompleted;
          setIsApproved(isApproved);
          setIsProfileCompleted(isProfileCompleted);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
          setIsApproved(false);
        });
    }
  }, [currentClient]);

  useEffect(() => {
    if (currentClient) fetchAgents();
  }, [currentClient]);

  const fetchAgents = async () => {
    try {
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
    }
  };

  const handleAgentSaved = () => {
    fetchAgents();
    setEditingAgent(null);
    setActiveTab("list");
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setActiveTab("form");
  };

  const handleDeleteAgent = async (id) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      try {
        await fetch(
          `${API_BASE_URL}/client/agents/${id}?clientId=${currentClient}`,
          {
            method: "DELETE",
          }
        );
        fetchAgents();
      } catch (error) {
        console.error("Error deleting agent:", error);
      }
    }
  };

  const handleClientChange = (newClientId) => {
    setCurrentClient(newClientId);
    setActiveSection("agents");
    setActiveTab("list");
    setEditingAgent(null);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section === "agents") {
      setActiveTab("list");
    }
    setEditingAgent(null);
  };

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
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
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
                    onClick={() => setActiveTab("list")}
                  >
                    Agents ({agents.length})
                  </button>

                  <button
                    className={`px-5 py-3 text-sm font-medium rounded-md transition-all ${
                      activeTab === "api-keys"
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("api-keys")}
                  >
                    API Keys
                  </button>
                  <button
                    className={`px-5 py-3 text-sm font-medium rounded-md transition-all ${
                      activeTab === "settings"
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("settings")}
                  >
                    Settings
                  </button>
                </div>

                <button
                  className="px-5 py-3 text-sm font-medium rounded-md transition-all bg-black text-white hover:bg-gray-800"
                  onClick={() => {
                    setActiveTab("form");
                    setEditingAgent(null);
                  }}
                >
                  Create Agent
                </button>
              </nav>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              {activeTab === "list" && (
                <AgentList
                  agents={agents}
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
                    setActiveTab("list");
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
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white mb-3">AI Manager</h1>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                Client:
              </span>
              <span className="text-sm text-gray-300 font-semibold">
                {currentClient}
              </span>
            </div>
          </div>

          <nav className="flex-1 py-4">
            <button
              className={`flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "performance"
                  ? "bg-black text-white border-r-4 border-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              onClick={() => handleSectionChange("performance")}
            >
              <FiTrendingUp className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Performance</span>
            </button>

            <button
              className={`flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "agents"
                  ? "bg-black text-white border-r-4 border-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              onClick={() => handleSectionChange("agents")}
            >
              <FiUsers className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">AI Agents</span>
            </button>

            <button
              className={`flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "bond"
                  ? "bg-black text-white border-r-4 border-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              onClick={() => handleSectionChange("bond")}
            >
              <FiLink className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">InBound</span>
            </button>

            <button
              className={`flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "outbound"
                  ? "bg-black text-white border-r-4 border-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              onClick={() => handleSectionChange("outbound")}
            >
              <FiSend className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Outbound</span>
            </button>

            <button
              className={`flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "human_agent"
                  ? "bg-black text-white border-r-4 border-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              onClick={() => handleSectionChange("human_agent")}
            >
              <FiUserCheck className="text-xl w-6 text-center" />
              <span className="flex-1 font-medium">Human Agent</span>
            </button>
          </nav>

          <div className="p-4">
            <button
              className={`flex items-center w-full px-6 py-4 text-left transition-all duration-200 gap-3 ${
                activeSection === "about"
                  ? "bg-black text-white border-r-4 border-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              onClick={() => handleSectionChange("about")}
            >
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
