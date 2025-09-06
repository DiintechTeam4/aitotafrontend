import React, { useState, useEffect } from "react";
import { FiPlus, FiUser, FiArrowLeft } from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const HumanAgentManagement = ({
  clientId,
  clientToken,
  onClose,
  onUpdated,
}) => {
  const [humanAgents, setHumanAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    selectedAgents: [], // Array to store multiple selected agents
    role: "executive",
  });
  const [availableAgents, setAvailableAgents] = useState([]);
  const [clientInfo, setClientInfo] = useState({
    clientName: "",
    name: "",
    businessName: "",
    businessLogoUrl: "",
    email: "",
    settings: {},
    clientType: "new",
    createdAt: "",
  });
  const [clientTypeSaving, setClientTypeSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const formatDate = (dt) => {
    if (!dt) return "—";
    try {
      return new Date(dt).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  // Fetch human agents
  const fetchHumanAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/client/human-agents`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch human agents");
      }

      const data = await response.json();
      console.log("Human agents data:", data.data);
      setHumanAgents(data.data || []);
    } catch (error) {
      console.error("Error fetching human agents:", error);
      alert("Failed to fetch human agents");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available agents for dropdown
  const fetchAvailableAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/client/agents`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Available agents data:", data.data);
        setAvailableAgents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching available agents:", error);
    }
  };

  // Fetch client info to manage clientType
  const fetchClientInfo = async () => {
    try {
      // Use admin endpoint that returns fresh S3 logo URL
      const adminToken =
        localStorage.getItem("admintoken") ||
        sessionStorage.getItem("admintoken");
      const response = await fetch(
        `${API_BASE_URL}/admin/getclient/${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      const c = data?.data || {};
      setClientInfo({
        clientName: c.name || "",
        name: c.name || "",
        businessName: c.businessName || "",
        businessLogoUrl: c.businessLogoUrl || "",
        email: c.email || "",
        settings: c.settings || {},
        clientType: c.clientType || "new",
        createdAt: c.createdAt || "",
      });
      setLogoError(false);
    } catch (e) {
      // no-op
    }
  };

  const handleSaveClientType = async () => {
    try {
      setClientTypeSaving(true);
      const body = { clientType: clientInfo.clientType };
      const response = await fetch(`${API_BASE_URL}/client/client-type`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err?.error || err?.message || "Failed to update client type"
        );
      }
      await fetchClientInfo();
      if (onUpdated) {
        onUpdated();
      }
      alert("Client type updated");
    } catch (e) {
      alert(e.message || "Failed to update client type");
    } finally {
      setClientTypeSaving(false);
    }
  };

  // Create or update human agent with minimal profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (editingAgent) {
        // Update existing human agent
        const humanAgentData = {
          humanAgentName: formData.name,
          email: formData.email,
          mobileNumber: formData.contactNumber,
          agentIds: formData.selectedAgents, // Use selectedAgents array
          role: formData.role,
        };

        const response = await fetch(
          `${API_BASE_URL}/client/human-agents/${editingAgent._id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${clientToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(humanAgentData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update human agent");
        }

        alert("Human agent updated successfully");
      } else {
        // Create new human agent
        const humanAgentData = {
          humanAgentName: formData.name,
          email: formData.email,
          mobileNumber: formData.contactNumber,
          agentIds: formData.selectedAgents, // Use selectedAgents array
          role: formData.role,
          isprofileCompleted: false,
          isApproved: true,
        };

        const humanAgentResponse = await fetch(
          `${API_BASE_URL}/client/human-agents`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${clientToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(humanAgentData),
          }
        );

        if (!humanAgentResponse.ok) {
          const errorData = await humanAgentResponse.json();
          throw new Error(errorData.message || "Failed to create human agent");
        }

        const humanAgentResult = await humanAgentResponse.json();
        const humanAgentId = humanAgentResult.data._id;
        const humangAgentRole = humanAgentResult.data.role;

        // Create minimal profile with required fields only
        const profileData = {
          businessName: formData.name,
          contactNumber: formData.contactNumber,
          role: humangAgentRole,
          contactName: formData.name, // Use same name as contact name
          humanAgentId: humanAgentId, // Use human agent ID instead of client ID
        };

        const profileResponse = await fetch(
          `${API_BASE_URL}/auth/client/profile`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${clientToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(profileData),
          }
        );

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.message || "Failed to create profile");
        }

        alert("Sales staff profile created successfully");
      }

      // Reset form and refresh list
      setFormData({
        name: "",
        email: "",
        contactNumber: "",
        selectedAgents: [], // Reset to empty array
        role: "executive",
      });
      setEditingAgent(null);
      setShowForm(false);
      await fetchHumanAgents();
    } catch (error) {
      console.error("Error saving human agent:", error);
      alert(error.message || "Failed to save human agent");
    } finally {
      setLoading(false);
    }
  };

  // Delete human agent
  const handleDelete = async (agentId) => {
    if (!window.confirm("Are you sure you want to delete this sales staff?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/client/human-agents/${agentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${clientToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete sales staff");
      }

      alert("Sales staff and associated profile deleted successfully");
      await fetchHumanAgents();
    } catch (error) {
      console.error("Error deleting human agent:", error);
      alert("Failed to delete sales staff");
    } finally {
      setLoading(false);
    }
  };

  // Edit human agent
  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.humanAgentName,
      email: agent.email,
      contactNumber: agent.mobileNumber || "",
      selectedAgents: agent.agentIds || [], // Use agentIds array
      role: agent.role || "executive",
    });
    setShowForm(true);
  };

  // Reset form
  const handleCancel = () => {
    setFormData({
      name: "",
      email: "",
      contactNumber: "",
      selectedAgents: [], // Reset to empty array
      role: "executive",
    });
    setEditingAgent(null);
    setShowForm(false);
  };

  useEffect(() => {
    fetchHumanAgents();
    fetchAvailableAgents();
    fetchClientInfo();
  }, [clientId, clientToken]);

  useEffect(() => {
    if (clientInfo.businessLogoUrl) {
      console.log(
        "[HumanAgentManagement] businessLogoUrl updated:",
        clientInfo.businessLogoUrl
      );
    } else {
      console.log("[HumanAgentManagement] No businessLogoUrl available");
    }
  }, [clientInfo.businessLogoUrl]);

  return (
    <div className="fixed inset-0 bg-gray-50 p-6 ml-64 z-50 overflow-auto">
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdated) {
                      onUpdated();
                    }
                    onClose && onClose();
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:outline-none"
                  title="Back"
                >
                  <FiArrowLeft className="w-5 h-5 mr-2" /> Back
                </button>
                <h2 className="text-2xl font-bold text-gray-800">
                  {clientInfo.clientName ||
                    clientInfo.businessName ||
                    "Unknown"}
                </h2>
              </div>
              <div />
            </div>
          </div>

          <div className="p-6">
            {/* Add New Agent Button */}
            {!showForm && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add Team
                </button>
              </div>
            )}

            {/* Form */}
            {showForm && (
              <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">
                  {editingAgent ? "Edit Team" : "Add New Team"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="executive">Executive</option>
                        <option value="team leads">Team Leads</option>
                        <option value="deputy manager">Deputy Manager</option>
                        <option value="deputy director">Deputy Director</option>
                        <option value="manager">Manager</option>
                        <option value="director">Director</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.contactNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Enter contact number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Agents *
                      </label>
                      <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                        {availableAgents.length === 0 ? (
                          <p className="text-gray-500 text-sm">
                            No agents available
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {availableAgents.map((agent) => (
                              <label
                                key={agent._id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors border border-transparent hover:border-gray-200"
                              >
                                <input
                                  type="checkbox"
                                  value={agent._id}
                                  checked={formData.selectedAgents.includes(
                                    agent._id
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        selectedAgents: [
                                          ...formData.selectedAgents,
                                          agent._id,
                                        ],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        selectedAgents:
                                          formData.selectedAgents.filter(
                                            (id) => id !== agent._id
                                          ),
                                      });
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                                />
                                <span className="text-sm text-gray-700 truncate">
                                  {agent.name || agent.agentName}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {formData.selectedAgents.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">
                            Selected ({formData.selectedAgents.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {formData.selectedAgents.map((agentId) => {
                              const agent = availableAgents.find(
                                (a) => a._id === agentId
                              );
                              return (
                                <span
                                  key={agentId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {agent
                                    ? agent.name || agent.agentName
                                    : agentId}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        selectedAgents:
                                          formData.selectedAgents.filter(
                                            (id) => id !== agentId
                                          ),
                                      });
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading
                        ? "Saving..."
                        : editingAgent
                        ? "Update"
                        : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Human Agents List */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiUser className="w-5 h-5 mr-2 text-blue-600" />
                Team
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading human agents...</p>
                </div>
              ) : humanAgents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiUser className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No Team found</p>
                  <p className="text-sm">Click "Add Team" to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mobile Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Selected Agents
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profile Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approval Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {humanAgents.map((agent) => (
                        <tr key={agent._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {agent.humanAgentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {agent.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {agent.mobileNumber || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {(() => {
                              if (
                                !agent.agentIds ||
                                agent.agentIds.length === 0
                              ) {
                                return "N/A";
                              }

                              // If availableAgents is not loaded yet, show loading
                              if (availableAgents.length === 0) {
                                return "Loading agents...";
                              }

                              const selectedAgentNames = agent.agentIds.map(
                                (agentId) => {
                                  // Handle case where agentId might be an object
                                  const actualAgentId =
                                    typeof agentId === "object"
                                      ? agentId._id || agentId.id
                                      : agentId;

                                  const selectedAgent = availableAgents.find(
                                    (a) => a._id === actualAgentId
                                  );

                                  if (selectedAgent) {
                                    return (
                                      selectedAgent.name ||
                                      selectedAgent.agentName ||
                                      "Unknown Agent"
                                    );
                                  } else {
                                    // If agent not found, show the ID or a fallback
                                    return typeof agentId === "object"
                                      ? agentId.name ||
                                          agentId.agentName ||
                                          "Unknown Agent"
                                      : `Agent ID: ${actualAgentId}`;
                                  }
                                }
                              );

                              return selectedAgentNames.join(", ");
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="capitalize">
                              {agent.role || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                agent.isprofileCompleted
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {agent.isprofileCompleted
                                ? "Completed"
                                : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                agent.isApproved
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {agent.isApproved ? "Approved" : "Not Approved"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(agent.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(agent)}
                              className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(agent._id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanAgentManagement;
