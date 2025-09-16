import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../config";
import {
  FaSearch,
  FaUserTie,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaCheckCircle,
  FaTimesCircle,
  FaCopy,
  FaEllipsisV,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AllAgents = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [clients, setClients] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedAgentForCopy, setSelectedAgentForCopy] = useState(null);
  const [targetClientId, setTargetClientId] = useState("");
  const [copyingAgent, setCopyingAgent] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState(null);
  const [editingAgent, setEditingAgent] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgentForAssign, setSelectedAgentForAssign] = useState(null);
  const [assignProvider, setAssignProvider] = useState("snapbx");
  const [sanpbxDids, setSanpbxDids] = useState(["01246745649", "01246745655"]);
  const [newSanpbxDid, setNewSanpbxDid] = useState("");
  const [assignFormData, setAssignFormData] = useState({
    serviceProvider: "snapbx",
    didNumber: "",
    accessToken: "",
    accessKey: "",
    callerId: "",
    xApiKey: "",
    accountSid: "",
  });
  const [editFormData, setEditFormData] = useState({
    agentName: "",
    description: "",
    category: "",
    personality: "formal",
    language: "en",
    firstMessage: "",
    systemPrompt: "",
    sttSelection: "deepgram",
    ttsSelection: "sarvam",
    llmSelection: "openai",
    voiceSelection: "meera",
    contextMemory: "",
    brandInfo: "",
    whatsappEnabled: false,
    telegramEnabled: false,
    emailEnabled: false,
    smsEnabled: false,
    whatsapplink: "",
    whatsapp: [],
    telegram: [],
    email: [],
    sms: [],
  });

  useEffect(() => {
    fetchAllAgents();
    fetchClients();
  }, []);

  // Fetch SANPBX DIDs from backend
  const fetchDidNumbers = async () => {
    try {
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");
      const resp = await fetch(`${API_BASE_URL}/admin/did-numbers?provider=snapbx`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data?.success && Array.isArray(data.data)) {
        const list = data.data.map((d) => String(d.did)).filter(Boolean);
        if (list.length) setSanpbxDids(Array.from(new Set(list)));
      }
    } catch (e) {
      // silent
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest(".dropdown-container")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  const fetchAllAgents = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");

      const response = await fetch(`${API_BASE_URL}/admin/all-agents`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }

      const data = await response.json();
      setAgents(data.success ? data.data : []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");

      const response = await fetch(`${API_BASE_URL}/admin/getclients`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.success ? data.data : []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    return client ? client.name : "Admin";
  };

  const getClientBusinessName = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    return client ? client.businessName : "";
  };

  const getClientWebsiteUrl = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    return client ? client.websiteUrl : null;
  };

  const getClientBusinessLogoUrl = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    return client ? client.businessLogoUrl : null;
  };

  const filteredAgents = agents
    .filter((agent) => {
      const matchesSearch =
        agent.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(agent.clientId)
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        getClientBusinessName(agent.clientId)
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && agent.isActive) ||
        (statusFilter === "pending" && !agent.isActive);

      const matchesClient =
        clientFilter === "all" || agent.clientId === clientFilter;

      // Only show agents from approved clients
      const isFromApprovedClient = clients.find(
        (client) => client._id === agent.clientId && client.isApproved
      );

      return (
        matchesSearch && matchesStatus && matchesClient && isFromApprovedClient
      );
    })
    .sort((a, b) => {
      // Sort active agents first
      if (a.isActive !== b.isActive) {
        return b.isActive ? 1 : -1; // Active agents come first
      }
      return 0; // Keep original order for agents with same status
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const copyAgent = async () => {
    if (!targetClientId || !selectedAgentForCopy) return;

    setCopyingAgent(true);
    try {
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");

      const response = await fetch(`${API_BASE_URL}/admin/copy-agent`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: selectedAgentForCopy._id,
          targetClientId: targetClientId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert("Agent copied successfully!");
          setShowCopyModal(false);
          setSelectedAgentForCopy(null);
          setTargetClientId("");
          fetchAllAgents(); // Refresh the agents list
        } else {
          alert("Failed to copy agent: " + data.message);
        }
      } else {
        throw new Error("Failed to copy agent");
      }
    } catch (error) {
      console.error("Error copying agent:", error);
      alert("Error copying agent. Please try again.");
    } finally {
      setCopyingAgent(false);
    }
  };

  const openCopyModal = (agent) => {
    setSelectedAgentForCopy(agent);
    setTargetClientId("");
    setShowCopyModal(true);
  };

  const closeCopyModal = () => {
    setShowCopyModal(false);
    setSelectedAgentForCopy(null);
    setTargetClientId("");
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedAgentForEdit(null);
    setEditFormData({
      agentName: "",
      description: "",
      category: "",
      personality: "formal",
      language: "en",
      firstMessage: "",
      systemPrompt: "",
      sttSelection: "deepgram",
      ttsSelection: "sarvam",
      llmSelection: "openai",
      voiceSelection: "meera",
      contextMemory: "",
      brandInfo: "",
      whatsappEnabled: false,
      telegramEnabled: false,
      emailEnabled: false,
      smsEnabled: false,
      whatsapplink: "",
      whatsapp: [],
      telegram: [],
      email: [],
      sms: [],
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgentForEdit) return;

    setEditingAgent(true);
    try {
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");

      const response = await fetch(
        `${API_BASE_URL}/admin/update-agent/${selectedAgentForEdit._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editFormData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert("Agent updated successfully!");
          closeEditModal();
          fetchAllAgents(); // Refresh the agents list
        } else {
          alert("Failed to update agent: " + data.message);
        }
      } else {
        throw new Error("Failed to update agent");
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      alert("Error updating agent. Please try again.");
    } finally {
      setEditingAgent(false);
    }
  };

  const handleEdit = (agent) => {
    setSelectedAgentForEdit(agent);
    setEditFormData({
      agentName: agent.agentName || "",
      description: agent.description || "",
      category: agent.category || "",
      personality: agent.personality || "formal",
      language: agent.language || "en",
      firstMessage: agent.firstMessage || "",
      systemPrompt: agent.systemPrompt || "",
      sttSelection: agent.sttSelection || "deepgram",
      ttsSelection: agent.ttsSelection || "sarvam",
      llmSelection: agent.llmSelection || "openai",
      voiceSelection: agent.voiceSelection || "meera",
      contextMemory: agent.contextMemory || "",
      brandInfo: agent.brandInfo || "",
      whatsappEnabled: agent.whatsappEnabled || false,
      telegramEnabled: agent.telegramEnabled || false,
      emailEnabled: agent.emailEnabled || false,
      smsEnabled: agent.smsEnabled || false,
      whatsapplink: agent.whatsapplink || "",
      whatsapp: agent.whatsapp || [],
      telegram: agent.telegram || [],
      email: agent.email || [],
      sms: agent.sms || [],
    });
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const openAssign = (agent) => {
    setSelectedAgentForAssign(agent);
    const prov = (agent.serviceProvider || "snapbx").toLowerCase();
    setAssignProvider(prov);
    const temp = getTempCredentials(prov);
    // Initialize SANPBX DIDs list and select agent's current DID if available
    if (prov === "snapbx" || prov === "sanpbx") {
      fetchDidNumbers();
      const seed = sanpbxDids.length ? sanpbxDids : ["01246745649", "01246745655"]; // existing DIDs
      const currentDid = agent.didNumber ? String(agent.didNumber) : "";
      const merged = Array.from(new Set([...
        seed,
        currentDid ? [currentDid] : []
      ].flat().filter(Boolean)));
      setSanpbxDids(merged);
      setNewSanpbxDid("");
    }
    // Determine safe default selection: only preselect if unassigned or assigned to this agent
    const candidateDid = String(agent.didNumber || temp?.didNumber || "");
    let safePreselect = "";
    if (candidateDid) {
      const assignedAgent = (agents || []).find(
        (a) =>
          String(a?.serviceProvider || '').toLowerCase().includes('snapbx') &&
          String(a?.didNumber || '') === candidateDid
      );
      if (!assignedAgent || String(assignedAgent._id) === String(agent._id)) {
        safePreselect = candidateDid;
      }
    }
    setAssignFormData({
      serviceProvider: prov,
      didNumber: safePreselect,
      accessToken: temp?.accessToken || agent.accessToken || "",
      accessKey: temp?.accessKey || agent.accessKey || "",
      callerId: temp?.callerId || agent.callerId || "",
      xApiKey: (temp && (temp.X_API_KEY || temp.xApiKey)) || agent.X_API_KEY || "",
      accountSid: temp?.accountSid || agent.accountSid || "",
    });
    setShowAssignModal(true);
    setOpenDropdown(null);

    // No summary prefill required
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedAgentForAssign(null);
    setAssignProvider("snapbx");
    setAssignFormData({
      serviceProvider: "snapbx",
      didNumber: "",
      accessToken: "",
      accessKey: "",
      callerId: "",
      xApiKey: "",
      accountSid: "",
    });
  };

  const handleAssignChange = (field, value) => {
    setAssignFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgentForAssign) return;
    try {
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");

      let payload = {};
      if (assignProvider === "snapbx") {
        // Auto-derive callerId from DID (last 7 digits), keep access creds in code
        const did = String(assignFormData.didNumber || "").replace(/\D/g, "");
        const callerId = did ? did.slice(-7) : "";
        payload = {
          serviceProvider: "snapbx",
          didNumber: assignFormData.didNumber,
          accessToken: assignFormData.accessToken,
          accessKey: assignFormData.accessKey,
          callerId: callerId,
        };

        // Also persist in DID registry and assign
        try {
          const token =
            localStorage.getItem("admintoken") ||
            sessionStorage.getItem("admintoken");
          // Ensure DID exists
          await fetch(`${API_BASE_URL}/admin/did-numbers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ did: assignFormData.didNumber, provider: 'snapbx' }),
          });
          // Assign DID to agent
          await fetch(`${API_BASE_URL}/admin/did-numbers/${encodeURIComponent(assignFormData.didNumber)}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ agentId: selectedAgentForAssign?._id }),
          });
        } catch (_) {}
      } else if (
        assignProvider === "c-zentrix" ||
        assignProvider === "c-zentrax"
      ) {
        payload = {
          serviceProvider: "c-zentrix",
          didNumber: assignFormData.didNumber,
          callerId: assignFormData.callerId,
          accountSid: assignFormData.accountSid,
          X_API_KEY: assignFormData.xApiKey,
        };
      } else {
        payload = {
          serviceProvider: assignProvider,
          didNumber: assignFormData.didNumber,
          callerId: assignFormData.callerId,
        };
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/update-agent/${selectedAgentForAssign._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to assign provider");
      }
      alert("Assigned successfully");
      closeAssignModal();
      fetchAllAgents();
    } catch (err) {
      alert(err.message || "Failed to assign");
    }
  };

  // Temporary credentials helper
  const getTempCredentials = (providerKey) => {
    const key = (providerKey || "").toLowerCase();
    if (key === "c-zentrix" || key === "c-zentrax") {
      return {
        serviceProvider: "c-zentrix",
        didNumber: "01244793997",
        callerId: "168353225",
        accountSid: "5104",
        X_API_KEY: "629lXqsiDk85lfMub7RsN73u4741MlOl4Dv8kJE9",
      };
    }
    if (key === "snapbx" || key === "sanpbx") {
      return {
        serviceProvider: "snapbx",
        didNumber: "01246745649",
        accessToken: "265b2d7e5d1a5d9c33fc22b01e5d0f19",
        accessKey: "mob",
        callerId: "6745649",
      };
    }
    return null;
  };

  const assignWithTempCredentials = async () => {
    if (!selectedAgentForAssign) return;
    const temp = getTempCredentials(assignProvider);
    if (!temp) {
      alert("No temporary credentials available for selected provider.");
      return;
    }
    const confirmed = window.confirm(
      "Use temporary credentials and save to database?"
    );
    if (!confirmed) return;
    try {
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");
      const response = await fetch(
        `${API_BASE_URL}/admin/update-agent/${selectedAgentForAssign._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(temp),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to assign temp credentials");
      }
      alert("Assigned temporary credentials successfully");
      closeAssignModal();
      fetchAllAgents();
    } catch (err) {
      alert(err.message || "Failed to assign temp credentials");
    }
  };

  const handleDelete = async (agent) => {
    if (
      window.confirm(
        `Are you sure you want to delete agent "${agent.agentName}"?`
      )
    ) {
      try {
        const token =
          localStorage.getItem("admintoken") ||
          sessionStorage.getItem("admintoken");

        const response = await fetch(
          `${API_BASE_URL}/admin/delete-agent/${agent._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            alert("Agent deleted successfully!");
            fetchAllAgents(); // Refresh the agents list
          } else {
            alert("Failed to delete agent: " + data.message);
          }
        } else {
          throw new Error("Failed to delete agent");
        }
      } catch (error) {
        console.error("Error deleting agent:", error);
        alert("Error deleting agent. Please try again.");
      }
    }
    setOpenDropdown(null);
  };

  const toggleDropdown = (agentId) => {
    setOpenDropdown(openDropdown === agentId ? null : agentId);
  };

  const toggleAgentStatus = async (agentId, currentStatus) => {
    setUpdatingStatus((prev) => ({ ...prev, [agentId]: true }));
    try {
      const token =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");

      const response = await fetch(
        `${API_BASE_URL}/admin/toggle-agent-status/${agentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update agent status");
      }

      const data = await response.json();
      if (data.success) {
        setAgents((prevAgents) =>
          prevAgents.map((agent) =>
            agent._id === agentId
              ? { ...agent, isActive: !currentStatus }
              : agent
          )
        );
      }
    } catch (error) {
      console.error("Error updating agent status:", error);
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
          <button
            onClick={() => navigate('/admin/dashboard?tab=System%20Prompts')}
            className="group relative inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            title="Manage System Prompts"
          >
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-400 opacity-70 group-hover:opacity-100"></span>
            <FiSettings className="h-4 w-4 transition-transform duration-200 group-hover:rotate-45 text-red-600" />
          </button>
        </div>
      </div>

        {/* Stats Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaUserTie className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">
                  Total Agents
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {agents.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">
                  Active Agents
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {agents.filter((agent) => agent.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaTimesCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">
                  Inactive Agents
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {agents.filter((agent) => !agent.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaBuilding className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">
                  Total Clients
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {clients.length}
                </p>
              </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <div className="p-6 border-b border-white-100 bg-white-50">
        <div className="flex justify-end gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Clients</option>
            {clients
              .filter((client) => client.isApproved)
              .map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                  {client.businessName ? ` (${client.businessName})` : ""}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Agents Table */}
      <div className="overflow-x-auto pb-30">
        {filteredAgents.length === 0 ? (
          <div className="p-8 text-center">
            <FaUserTie className="mx-auto h-12 w-12 text-white-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No agents found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== "all" || clientFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No agents have been created yet."}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-white-200">
            <thead className="bg-white-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sno.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.map((agent, index) => (
                <tr
                  key={agent._id}
                  className={`${agent.isActive ? "bg-white" : "bg-gray-100"} ${
                    !agent.isActive ? "shadow-md" : ""
                  }`}
                >
                  {/* Serial Number */}
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>

                  {/* Agent Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`ml-4 ${!agent.isActive ? "opacity-75" : ""}`}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {agent.agentName || "Unnamed Agent"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Category: {agent.category || "General"}
                      </div>
                      <div className="text-xs text-gray-400">
                        Service: {agent.serviceProvider || "-"}
                      </div>
                      <div className="text-xs text-gray-400">
                        Personality: {agent.personality || "Formal"}
                      </div>
                    </div>
                  </td>

                  {/* Client Information */}
                  <td className="px-6 py-4">
                    <div
                      className={`flex items-center ${
                        !agent.isActive ? "opacity-75" : ""
                      }`}
                    >
                      {getClientBusinessLogoUrl(agent.clientId) ? (
                        <img
                          src={getClientBusinessLogoUrl(agent.clientId)}
                          alt="Business Logo"
                          className="h-8 w-8 rounded-full object-cover mr-2"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "block";
                          }}
                        />
                      ) : null}
                      <FaBuilding
                        className="text-gray-400 mr-2"
                        style={{
                          display: getClientBusinessLogoUrl(agent.clientId)
                            ? "none"
                            : "block",
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getClientName(agent.clientId)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getClientBusinessName(agent.clientId)}
                        </div>
                        {getClientWebsiteUrl(agent.clientId) && (
                          <div className="text-xs text-blue-600">
                            <a
                              href={getClientWebsiteUrl(agent.clientId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {getClientWebsiteUrl(agent.clientId)}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() =>
                          toggleAgentStatus(agent._id, agent.isActive)
                        }
                        disabled={updatingStatus[agent._id]}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                          agent.isActive ? "bg-green-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            agent.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="ml-2 text-sm text-gray-600">
                        {updatingStatus[agent._id] ? (
                          <span className="text-gray-400">Updating...</span>
                        ) : agent.isActive ? (
                          "Active"
                        ) : (
                          "Inactive"
                        )}
                      </span>
                      <button
                        onClick={() => openAssign(agent)}
                        className="px-2 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        title="Assign provider"
                      >
                        Assign
                      </button>
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div
                      className={`flex items-center ${
                        !agent.isActive ? "opacity-75" : ""
                      }`}
                    >
                      <FaCalendar className="text-gray-400 mr-2" />
                      {formatDate(agent.createdAt)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="relative dropdown-container">
                      <button
                        onClick={() => toggleDropdown(agent._id)}
                        className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full hover:bg-gray-100"
                        title="Actions"
                      >
                        <FaEllipsisV className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdown === agent._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleEdit(agent)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
                            >
                              <FaEdit className="h-4 w-4 mr-2 text-blue-600" />
                              Edit
                            </button>
                            <button
                              onClick={() => openCopyModal(agent)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
                            >
                              <FaCopy className="h-4 w-4 mr-2 text-green-600" />
                              Copy
                            </button>
                            <button
                              onClick={() => handleDelete(agent)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none"
                            >
                              <FaTrash className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Copy Agent Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border-0 w-11/12 max-w-2xl shadow-2xl rounded-xl bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FaCopy className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Copy Agent
                    </h3>
                    <p className="text-red-100 text-sm">
                      Duplicate agent to another client
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCopyModal}
                  className="text-white hover:text-red-100 transition-colors duration-200"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Agent Information Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaUserTie className="h-5 w-5 text-red-600 mr-2" />
                  Agent Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Agent Name
                      </label>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedAgentForCopy?.agentName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Category
                      </label>
                      <p className="text-sm text-gray-700">
                        {selectedAgentForCopy?.category || "General"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Personality
                      </label>
                      <p className="text-sm text-gray-700 capitalize">
                        {selectedAgentForCopy?.personality || "Formal"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Language
                      </label>
                      <p className="text-sm text-gray-700 uppercase">
                        {selectedAgentForCopy?.language || "EN"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Source Client
                      </label>
                      <p className="text-sm font-semibold text-gray-900">
                        {getClientName(selectedAgentForCopy?.clientId)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getClientBusinessName(selectedAgentForCopy?.clientId)}
                      </p>
                    </div>
                    <div></div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Created
                      </label>
                      <p className="text-sm text-gray-700">
                        {selectedAgentForCopy?.createdAt
                          ? formatDate(selectedAgentForCopy.createdAt)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Client Selection */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaBuilding className="h-5 w-5 text-red-600 mr-2" />
                  Select Target Client
                </h4>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose the client to copy this agent to:
                  </label>
                  <select
                    value={targetClientId}
                    onChange={(e) => setTargetClientId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    required
                  >
                    <option value="">Select a target client...</option>
                    {clients
                      .filter(
                        (client) =>
                          client.isApproved &&
                          client._id !== selectedAgentForCopy?.clientId
                      )
                      .map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.name}
                          {client.businessName
                            ? ` (${client.businessName})`
                            : ""}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={closeCopyModal}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={copyAgent}
                  disabled={!targetClientId || copyingAgent}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 border border-transparent rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  {copyingAgent ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Copying...</span>
                    </>
                  ) : (
                    <>
                      <FaCopy className="h-4 w-4" />
                      <span>Copy Agent</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="relative top-10 mx-auto p-0 border-0 w-11/12 max-w-2xl shadow-2xl rounded-xl bg-white overflow-hidden">
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FaEdit className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Edit Agent
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Update agent configuration and settings
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:text-blue-100 transition-colors duration-200"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditFormSubmit} className="p-4">
              {/* Basic Information */}
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <FaUserTie className="h-4 w-4 text-blue-600 mr-2" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Agent Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.agentName}
                      onChange={(e) =>
                        handleEditFormChange("agentName", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editFormData.category}
                      onChange={(e) =>
                        handleEditFormChange("category", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Customer Service, Sales"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Personality
                    </label>
                    <select
                      value={editFormData.personality}
                      onChange={(e) =>
                        handleEditFormChange("personality", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="formal">Formal</option>
                      <option value="informal">Informal</option>
                      <option value="friendly">Friendly</option>
                      <option value="flirty">Flirty</option>
                      <option value="disciplined">Disciplined</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={editFormData.language}
                      onChange={(e) =>
                        handleEditFormChange("language", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) =>
                      handleEditFormChange("description", e.target.value)
                    }
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Describe the agent's purpose and behavior"
                  />
                </div>
              </div>

              {/* AI Configuration */}
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <FaUserTie className="h-4 w-4 text-blue-600 mr-2" />
                  AI Configuration
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      STT
                    </label>
                    <select
                      value={editFormData.sttSelection}
                      onChange={(e) =>
                        handleEditFormChange("sttSelection", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="deepgram">Deepgram</option>
                      <option value="whisper">Whisper</option>
                      <option value="google">Google</option>
                      <option value="azure">Azure</option>
                      <option value="aws">AWS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      TTS
                    </label>
                    <select
                      value={editFormData.ttsSelection}
                      onChange={(e) =>
                        handleEditFormChange("ttsSelection", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="sarvam">Sarvam</option>
                      <option value="elevenlabs">ElevenLabs</option>
                      <option value="openai">OpenAI</option>
                      <option value="google">Google</option>
                      <option value="azure">Azure</option>
                      <option value="aws">AWS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      LLM
                    </label>
                    <select
                      value={editFormData.llmSelection}
                      onChange={(e) =>
                        handleEditFormChange("llmSelection", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="azure">Azure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Voice
                    </label>
                    <select
                      value={editFormData.voiceSelection}
                      onChange={(e) =>
                        handleEditFormChange("voiceSelection", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="male-professional">Male Pro</option>
                      <option value="female-professional">Female Pro</option>
                      <option value="male-friendly">Male Friendly</option>
                      <option value="female-friendly">Female Friendly</option>
                      <option value="neutral">Neutral</option>
                      <option value="anushka">Anushka</option>
                      <option value="meera">Meera</option>
                      <option value="pavithra">Pavithra</option>
                      <option value="maitreyi">Maitreyi</option>
                      <option value="arvind">Arvind</option>
                      <option value="amol">Amol</option>
                      <option value="amartya">Amartya</option>
                      <option value="diya">Diya</option>
                      <option value="neel">Neel</option>
                      <option value="misha">Misha</option>
                      <option value="vian">Vian</option>
                      <option value="arjun">Arjun</option>
                      <option value="maya">Maya</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <FaUserTie className="h-4 w-4 text-blue-600 mr-2" />
                  Messages
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      First Message *
                    </label>
                    <textarea
                      value={editFormData.firstMessage}
                      onChange={(e) =>
                        handleEditFormChange("firstMessage", e.target.value)
                      }
                      rows={2}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="The first message the agent will send"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      System Prompt *
                    </label>
                    <textarea
                      value={editFormData.systemPrompt}
                      onChange={(e) =>
                        handleEditFormChange("systemPrompt", e.target.value)
                      }
                      rows={3}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="Instructions for how the agent should behave"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Context Memory
                    </label>
                    <textarea
                      value={editFormData.contextMemory}
                      onChange={(e) =>
                        handleEditFormChange("contextMemory", e.target.value)
                      }
                      rows={2}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional context for the agent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Brand Information
                    </label>
                    <textarea
                      value={editFormData.brandInfo}
                      onChange={(e) =>
                        handleEditFormChange("brandInfo", e.target.value)
                      }
                      rows={2}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brand guidelines and information"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <FaUserTie className="h-4 w-4 text-blue-600 mr-2" />
                  Social Media
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="whatsappEnabled"
                      checked={editFormData.whatsappEnabled}
                      onChange={(e) =>
                        handleEditFormChange(
                          "whatsappEnabled",
                          e.target.checked
                        )
                      }
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="whatsappEnabled"
                      className="text-xs font-medium text-gray-700"
                    >
                      WhatsApp
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="telegramEnabled"
                      checked={editFormData.telegramEnabled}
                      onChange={(e) =>
                        handleEditFormChange(
                          "telegramEnabled",
                          e.target.checked
                        )
                      }
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="telegramEnabled"
                      className="text-xs font-medium text-gray-700"
                    >
                      Telegram
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="emailEnabled"
                      checked={editFormData.emailEnabled}
                      onChange={(e) =>
                        handleEditFormChange("emailEnabled", e.target.checked)
                      }
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="emailEnabled"
                      className="text-xs font-medium text-gray-700"
                    >
                      Email
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="smsEnabled"
                      checked={editFormData.smsEnabled}
                      onChange={(e) =>
                        handleEditFormChange("smsEnabled", e.target.checked)
                      }
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="smsEnabled"
                      className="text-xs font-medium text-gray-700"
                    >
                      SMS
                    </label>
                  </div>
                </div>
                {editFormData.whatsappEnabled && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      WhatsApp Link
                    </label>
                    <input
                      type="text"
                      value={editFormData.whatsapplink}
                      onChange={(e) =>
                        handleEditFormChange("whatsapplink", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://wa.me/..."
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingAgent}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-md hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  {editingAgent ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <FaEdit className="h-3 w-3" />
                      <span>Update Agent</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Provider Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 border-0 w-11/12 max-w-2xl shadow-2xl rounded-xl bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FaUserTie className="h-6 w-6 text-purple-200" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Assign Provider
                    </h3>
                    <p className="text-purple-100 text-sm">
                      Link agent to telephony provider
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAssignModal}
                  className="text-white hover:text-purple-100 transition-colors duration-200"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <div className="flex space-x-2">
                  {[
                    { key: "c-zentrax", label: "C-Zentrax" },
                    { key: "tata", label: "Tata" },
                    { key: "snapbx", label: "SnapBX" },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() => {
                        setAssignProvider(p.key);
                        const temp = getTempCredentials(p.key);
                        setAssignFormData((prev) => ({
                          ...prev,
                          serviceProvider: p.key,
                          didNumber: temp?.didNumber || "",
                          accessToken: temp?.accessToken || "",
                          accessKey: temp?.accessKey || "",
                          callerId: temp?.callerId || "",
                          xApiKey: (temp && (temp.X_API_KEY || temp.xApiKey)) || "",
                          accountSid: temp?.accountSid || "",
                        }));
                      }}
                      className={`${
                        assignProvider === p.key
                          ? "bg-purple-600 text-white"
                          : "bg-white text-gray-700"
                      } px-3 py-1.5 border rounded-md text-sm`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {assignProvider === "snapbx" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      SANPBX DIDs
                    </label>
                    <div className="overflow-x-auto border border-gray-200 rounded-md">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">Select</th>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">DID</th>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">Status</th>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">Agent</th>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">Client</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {([...sanpbxDids]
                            .map((did) => {
                              const assignedAgent = (agents || []).find(
                                (a) =>
                                  String(a?.serviceProvider || '').toLowerCase().includes('snapbx') &&
                                  String(a?.didNumber || '') === String(did)
                              );
                              let status = assignedAgent ? 'Assigned' : 'Available';
                              const isAssignedToThisAgent = assignedAgent && String(assignedAgent._id) === String(selectedAgentForAssign?._id);
                              let statusLabel = isAssignedToThisAgent ? 'Already Assigned' : status;
                              let agentName = assignedAgent?.agentName || '-';
                              let clientName = assignedAgent ? getClientName(assignedAgent.clientId) : '-';

                              // Temporary frontend override: if current agent switches selection,
                              // show the agent's previous DID as available with no agent/client
                              const selectedDid = String(assignFormData.didNumber || '');
                              const previousDid = String(selectedAgentForAssign?.didNumber || '');
                              if (selectedDid && previousDid && did === previousDid && selectedDid !== previousDid) {
                                status = 'Available';
                                statusLabel = 'Available';
                                agentName = '-';
                                clientName = '-';
                              }

                              return { did, assignedAgent, status, statusLabel, agentName, clientName };
                            })
                            // Unassigned first only (do not shift based on current selection)
                            .sort((a, b) => {
                              const av = a.assignedAgent ? 1 : 0;
                              const bv = b.assignedAgent ? 1 : 0;
                              if (av !== bv) return av - bv;
                              return 0;
                            })
                          ).map(({ did, assignedAgent, status, statusLabel, agentName, clientName }) => {
                            const isSelected = assignFormData.didNumber === did;
                            return (
                              <tr key={did} className={`${isSelected ? 'bg-indigo-50' : 'bg-white'}`}>
                                <td className="px-3 py-2">
                                  <input
                                    type="radio"
                                    name="sanpbxDid"
                                    checked={isSelected}
                                    onChange={() => {
                                      handleAssignChange('didNumber', did);
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2 text-gray-800">{did}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status === 'Assigned' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-gray-700">{isSelected ? (selectedAgentForAssign?.agentName || '-') : agentName}</td>
                                <td className="px-3 py-2 text-gray-700">{isSelected ? (getClientName(selectedAgentForAssign?.clientId) || '-') : clientName}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>


                  {/* Hidden fields (kept in code, not displayed) */}
                  <input type="hidden" value={assignFormData.accessToken} readOnly />
                  <input type="hidden" value={assignFormData.accessKey} readOnly />
                </div>
              )}

              {assignProvider === "c-zentrax" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      X API Key
                    </label>
                    <input
                      type="text"
                      value={assignFormData.xApiKey}
                      onChange={(e) =>
                        handleAssignChange("xApiKey", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Account SID
                    </label>
                    <input
                      type="text"
                      value={assignFormData.accountSid}
                      onChange={(e) =>
                        handleAssignChange("accountSid", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Caller ID
                    </label>
                    <input
                      type="text"
                      value={assignFormData.callerId}
                      onChange={(e) =>
                        handleAssignChange("callerId", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., 01123456789"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      DID Number
                    </label>
                    <input
                      type="text"
                      value={assignFormData.didNumber}
                      onChange={(e) =>
                        handleAssignChange("didNumber", e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., 9123456789"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 border border-transparent rounded-md hover:from-purple-700 hover:to-purple-800"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAgents;
