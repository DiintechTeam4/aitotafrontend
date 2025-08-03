import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const HumanAgents = () => {
  const [humanAgents, setHumanAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    humanAgentName: "",
    email: "",
    mobileNumber: "",
    did: "",
    isprofileCompleted: true,
    isApproved: true,
  });

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

  // Create or update human agent
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");

      const url = editingAgent
        ? `${API_BASE_URL}/client/human-agents/${editingAgent._id}`
        : `${API_BASE_URL}/client/human-agents`;

      const method = editingAgent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save human agent");
      }

      const data = await response.json();
      alert(
        editingAgent
          ? "Human agent updated successfully"
          : "Human agent created successfully"
      );

      // Reset form and refresh list
      setFormData({
        humanAgentName: "",
        email: "",
        mobileNumber: "",
        did: "",
        isprofileCompleted: true,
        isApproved: true,
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
    if (!window.confirm("Are you sure you want to delete this human agent?")) {
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
        throw new Error("Failed to delete human agent");
      }

      alert("Human agent deleted successfully");
      await fetchHumanAgents();
    } catch (error) {
      console.error("Error deleting human agent:", error);
      alert("Failed to delete human agent");
    } finally {
      setLoading(false);
    }
  };

  // Edit human agent
  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      humanAgentName: agent.humanAgentName,
      email: agent.email,
      mobileNumber: agent.mobileNumber || "",
      did: agent.did || "",
      isprofileCompleted: agent.isprofileCompleted,
      isApproved: agent.isApproved,
    });
    setShowForm(true);
  };

  // Reset form
  const handleCancel = () => {
    setFormData({
      humanAgentName: "",
      email: "",
      mobileNumber: "",
      did: "",
      isprofileCompleted: true,
      isApproved: true,
    });
    setEditingAgent(null);
    setShowForm(false);
  };

  useEffect(() => {
    fetchHumanAgents();
  }, []);

  if (loading && humanAgents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading human agents...</p>
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
            Error Loading Human Agents
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FiUserCheck className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Human Agents</h2>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-black hover:bg-black text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center"
          >
            <FiUserPlus className="w-5 h-5 mr-2" />
            Add New Agent
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">
            {editingAgent ? "Edit Human Agent" : "Add New Human Agent"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Human Agent Name *
                </label>
                <input
                  type="text"
                  value={formData.humanAgentName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      humanAgentName: e.target.value,
                    })
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
                  value={formData.mobileNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, mobileNumber: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  AI Agent *
                </label>
                <input
                  type="text"
                  value={formData.did}
                  onChange={(e) =>
                    setFormData({ ...formData, did: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Select agent"
                  required
                />
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
                  ? "Update Agent"
                  : "Create Agent"}
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
              No human agents found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new human agent.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Mobile Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      DID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {humanAgents.map((agent) => (
                    <tr
                      key={agent._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {agent.humanAgentName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {agent.humanAgentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {agent.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.mobileNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.did || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEdit(agent)}
                            className="text-blue-600 hover:text-blue-900 font-semibold transition-colors flex items-center"
                          >
                            <FiEdit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(agent._id)}
                            className="text-red-600 hover:text-red-900 font-semibold transition-colors flex items-center"
                          >
                            <FiTrash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
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
