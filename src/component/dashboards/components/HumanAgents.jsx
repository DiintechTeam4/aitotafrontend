import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
} from "react-icons/fi";
import HumanAgentDetails from "./HumanAgentDetails";
import { API_BASE_URL_RENDER } from "../../../config";
import { API_BASE_URL } from "../../../config";

const HumanAgents = () => {
  const [humanAgents, setHumanAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    selectedAgents: [],
    role: "executive",
  });
  const [availableAgents, setAvailableAgents] = useState([]);
  const [agentStats, setAgentStats] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Switch to this human agent (client -> team impersonation via common switch API)
  const switchToHumanAgent = async (agent) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        alert("You must be logged in as a client to switch to a team account.");
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/client/auth/switch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: "humanAgent", id: agent._id }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success || !json?.token) {
        throw new Error(json?.message || json?.error || "Failed to switch");
      }

      // Create a new tab with token in URL for session setup
      const userData = {
        role: "humanAgent",
        id: json.id,
        name: json.name || agent.humanAgentName || "",
        email: json.email || agent.email || "",
        clientId: json.clientId || "",
        clientUserId: json.clientUserId || "",
      };

      // Encode the data to pass via URL
      const encodedData = encodeURIComponent(
        JSON.stringify({
          token: json.token,
          userData: userData,
        })
      );

      // Open new tab with token data
      window.open(`/auth/dashboard?token=${encodedData}`, "_blank");
    } catch (e) {
      console.error("Switch to human agent failed:", e);
      alert(e?.message || "Failed to switch to team");
    }
  };

  // Fetch human agents for the current client
  const fetchHumanAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/client/human-agents`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch human agents");
      }

      const data = await response.json();
      setHumanAgents(data.data || []);
    } catch (error) {
      console.error("Error fetching human agents:", error);
      setError(error.message || "Failed to fetch human agents");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available agents for dropdown
  const fetchAvailableAgents = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/client/agents`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableAgents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching available agents:", error);
    }
  };

  // Create or update human agent
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");

      if (editingAgent) {
        // Update existing human agent (replicate HumanAgentManagement)
        const humanAgentData = {
          humanAgentName: formData.name,
          email: formData.email,
          mobileNumber: formData.contactNumber,
          agentIds: formData.selectedAgents,
          role: formData.role,
        };

        const response = await fetch(
          `${API_BASE_URL}/client/human-agents/${editingAgent._id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(humanAgentData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update sales staff");
        }
        alert("Sales Staff updated successfully");
      } else {
        // Create new human agent (replicate HumanAgentManagement)
        const humanAgentData = {
          humanAgentName: formData.name,
          email: formData.email,
          mobileNumber: formData.contactNumber,
          agentIds: formData.selectedAgents,
          role: formData.role,
          isprofileCompleted: false,
          isApproved: true,
        };

        const humanAgentResponse = await fetch(
          `${API_BASE_URL}/client/human-agents`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(humanAgentData),
          }
        );

        if (!humanAgentResponse.ok) {
          const errorData = await humanAgentResponse.json();
          throw new Error(errorData.message || "Failed to create sales staff");
        }

        const humanAgentResult = await humanAgentResponse.json();
        const humanAgentId = humanAgentResult.data._id;
        const humangAgentRole = humanAgentResult.data.role;

        // Create minimal profile
        const profileData = {
          businessName: formData.name,
          contactNumber: formData.contactNumber,
          role: humangAgentRole,
          contactName: formData.name,
          humanAgentId,
        };

        const profileResponse = await fetch(
          `${API_BASE_URL}/auth/client/profile`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(profileData),
          }
        );

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.message || "Failed to create profile");
        }

        alert("Sales Staff created successfully");
      }

      // Reset form and refresh list
      setFormData({
        name: "",
        email: "",
        contactNumber: "",
        selectedAgents: [],
        role: "executive",
      });
      setEditingAgent(null);
      setShowForm(false);
      await fetchHumanAgents();
    } catch (error) {
      console.error("Error saving Sales Staff:", error);
      alert(error.message || "Failed to save Sales Staff");
    } finally {
      setLoading(false);
    }
  };

  // Delete Sales Staff
  const handleDelete = async (agentId) => {
    if (!window.confirm("Are you sure you want to delete this Sales Staff?")) {
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(
        `${API_BASE_URL}/client/human-agents/${agentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete Sales Staff");
      }

      alert("Sales Staff deleted successfully");
      await fetchHumanAgents();
    } catch (error) {
      console.error("Error deleting Sales Staff:", error);
      alert("Failed to delete Sales Staff");
    } finally {
      setLoading(false);
    }
  };

  // Edit Sales Staff
  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.humanAgentName,
      email: agent.email,
      contactNumber: agent.mobileNumber || "",
      selectedAgents:
        agent.agentIds || (agent.selectAgent ? [agent.selectAgent] : []),
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
      selectedAgents: [],
      role: "executive",
    });
    setEditingAgent(null);
    setShowForm(false);
  };

   // Handle row click to show details
   const handleRowClick = (agent) => {
    setSelectedAgentId(agent._id);
    setShowDetails(true);
  };

  // Handle back from details
  const handleBackFromDetails = () => {
    setShowDetails(false);
    setSelectedAgentId(null);
  };

  useEffect(() => {
    fetchHumanAgents();
    fetchAvailableAgents();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest(".relative")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  if (loading && humanAgents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales staff...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Sales Staff
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchHumanAgents}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show details view if an agent is selected
  if (showDetails && selectedAgentId) {
    return (
      <HumanAgentDetails
        agentId={selectedAgentId}
        onBack={handleBackFromDetails}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FiUserCheck className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Team</h2>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-black hover:bg-black text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center"
          >
            <FiUserPlus className="w-5 h-5 mr-2" />
            Add New Team Member
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">
            {editingAgent ? "Edit Team" : "Add New Team"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter agent name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNumber: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Agents *
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                  {availableAgents.length === 0 ? (
                    <p className="text-gray-500 text-sm">No agents available</p>
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
                            {agent ? agent.name || agent.agentName : agentId}
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

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Saving..."
                  : editingAgent
                  ? "Update Team"
                  : "Create Team"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Human Agents List */}
      <div>
        {humanAgents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <FiUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No sales staff found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new sales staff.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 ">
            <div className="overflow-x-auto max-w-full pb-15">
              <table className="w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Name
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
                      Email
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Mobile
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">
                      Selected Agents
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                      Role
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                      Created
                    </th>
                    <th className="px-2 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                      Auth
                    </th>
                    <th className="px-1 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-8"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {humanAgents.map((agent) => (
                    <tr
                      key={agent._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(agent)}
                    >
                      <td className="px-3 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {agent.humanAgentName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {agent.humanAgentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 truncate">
                          {agent.email}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 truncate">
                        {agent.mobileNumber || "N/A"}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {(() => {
                          if (agent.agentIds && agent.agentIds.length > 0) {
                            const names = agent.agentIds.map((agentId) => {
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
                                return typeof agentId === "object"
                                  ? agentId.name ||
                                      agentId.agentName ||
                                      "Unknown Agent"
                                  : `Agent ID: ${actualAgentId}`;
                              }
                            });
                            return names.join(", ");
                          }
                          // Fallback for older records with single selectAgent
                          const selectedAgent = availableAgents.find(
                            (a) => a._id === agent.selectAgent
                          );
                          return selectedAgent
                            ? selectedAgent.name || selectedAgent.agentName
                            : agent.selectAgent || "N/A";
                        })()}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 truncate">
                        <span className="capitalize">
                          {agent.type || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 truncate">
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-4 text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            switchToHumanAgent(agent);
                          }}
                          className="px-2 py-1 text-xs rounded-md bg-black text-white hover:bg-gray-800 transition-colors"
                          title="Authenticate into this team account"
                          aria-label="Authenticate into team account"
                        >
                          Login
                        </button>
                      </td>
                      <td className="px-1 py-4 text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === agent._id ? null : agent._id
                              );
                            }}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            title="More actions"
                          >
                            <FiMoreVertical className="w-4 h-4 text-gray-600" />
                          </button>

                          {openMenuId === agent._id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(agent);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <FiEdit className="w-3 h-3 mr-2" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(agent._id);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center w-full px-3 py-2 text-xs text-red-600 hover:bg-gray-100 transition-colors"
                                >
                                  <FiTrash2 className="w-3 h-3 mr-2" />
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HumanAgents;
