"use client";

import { useState, useEffect } from "react";
import AgentForm from "./components/AgentForm";
import AgentList from "./components/AgentList";
import ApiKeyManager from "./components/ApiKeyManager";
import ClientSelector from "./components/ClientSelector";
import InBoundSection from "./components/InBoundSection";
import OutboundSection from "./components/OutboundSection";
import ApprovalForm from "./components/ApprovalForm";
import "./ClientDashboard.css";
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
    console.log("ClientDashboard: Initializing currentClient");
    console.log("propClientId:", propClientId);
    console.log("currentClient:", currentClient);

    if (!currentClient || currentClient === "") {
      const sessionClientData = sessionStorage.getItem("clientData");
      console.log("sessionClientData:", sessionClientData);

      if (sessionClientData) {
        try {
          const parsedData = JSON.parse(sessionClientData);
          console.log("parsedData:", parsedData);

          if (parsedData.clientId) {
            console.log("Setting currentClient to:", parsedData.clientId);
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
    console.log("Checking approval status for client:", currentClient);
    console.log("Token exists:", !!token);

    if (token && currentClient) {
      fetch(`${API_BASE_URL}/client/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Profile API response:", data);
          // The backend returns data wrapped in a 'data' property
          const isApproved = data.data?.isApproved;
          const isProfileCompleted = data.data?.isprofileCompleted;
          console.log("isApproved value:", isApproved);
          console.log("isProfileCompleted value:", isProfileCompleted);
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
        `${API_BASE_URL}/client/agents?clientId=${currentClient}`
      );
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error);
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
      case "agents":
        return (
          <div className="agents-content">
            <div className="agents-header">
              <h2>AI Agents</h2>
              <nav className="sub-nav-tabs">
                <button
                  className={activeTab === "list" ? "active" : ""}
                  onClick={() => setActiveTab("list")}
                >
                  Agent List ({agents.length})
                </button>
                <button
                  className={activeTab === "form" ? "active" : ""}
                  onClick={() => {
                    setActiveTab("form");
                    setEditingAgent(null);
                  }}
                >
                  Create Agent
                </button>
                <button
                  className={activeTab === "api-keys" ? "active" : ""}
                  onClick={() => setActiveTab("api-keys")}
                >
                  API Keys
                </button>
                <button
                  className={activeTab === "settings" ? "active" : ""}
                  onClick={() => setActiveTab("settings")}
                >
                  Settings
                </button>
              </nav>
            </div>

            <div className="agents-body">
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

      case "bond":
        return <InBoundSection clientId={currentClient} />;

      case "outbound":
        return <OutboundSection clientId={currentClient} />;

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

  console.log("Current isApproved state:", isApproved);
  console.log("Current isProfileCompleted state:", isProfileCompleted);
  console.log("isApproved === false:", isApproved === false);
  console.log("isApproved === null:", isApproved === null);

  // Show loading while fetching data
  if (isApproved === null || isProfileCompleted === null) {
    console.log("Showing Loading...");
    return <div>Loading...</div>;
  }

  // If not approved and profile not completed, show approval form
  if (isApproved === false && isProfileCompleted === false) {
    console.log("Showing ApprovalForm");
    return <ApprovalForm />;
  }

  // If not approved but profile is completed, show under review page
  if (isApproved === false && isProfileCompleted === true) {
    console.log("Showing Under Review page");
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-8 text-center">
            <h1 className="m-0 text-3xl font-bold text-white tracking-tight">
              Application Under Review
            </h1>
            <p className="mt-2 text-lg text-yellow-100 opacity-90">
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
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mt-6">
              <div className="text-sm font-semibold text-yellow-800 mb-2">
                What happens next?
              </div>
              <ul className="text-sm text-yellow-800 text-left list-disc pl-5 m-0">
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
    <div className="App">
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>AI Manager</h1>
            <div className="client-info">
              <span className="client-label">Client:</span>
              <span className="client-name">{currentClient}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${
                activeSection === "agents" ? "active" : ""
              }`}
              onClick={() => handleSectionChange("agents")}
            >
              <span className="sidebar-icon">🤖</span>
              <span className="sidebar-label">Agents</span>
              <span className="sidebar-count">{agents.length}</span>
            </button>

            <button
              className={`sidebar-item ${
                activeSection === "bond" ? "active" : ""
              }`}
              onClick={() => handleSectionChange("bond")}
            >
              <span className="sidebar-icon">🔗</span>
              <span className="sidebar-label">InBuond</span>
            </button>

            <button
              className={`sidebar-item ${
                activeSection === "outbound" ? "active" : ""
              }`}
              onClick={() => handleSectionChange("outbound")}
            >
              <span className="sidebar-icon">📤</span>
              <span className="sidebar-label">Outbound</span>
            </button>
          </nav>
          <div style={{ marginTop: "auto", padding: "1rem" }}>
            <button className="sidebar-item logout-btn" onClick={onLogout}>
              <span className="sidebar-icon">🚪</span> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">{renderMainContent()}</main>
      </div>
    </div>
  );
}

export default ClientDashboard;
