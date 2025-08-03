import React, { useState, useEffect } from "react";
import { FiPlus, FiUser } from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const HumanAgentManagement = ({ clientId, clientToken, onClose }) => {
  const [humanAgents, setHumanAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    did: "",
  });

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
      setHumanAgents(data.data || []);
    } catch (error) {
      console.error("Error fetching human agents:", error);
      alert("Failed to fetch human agents");
    } finally {
      setLoading(false);
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
          did: formData.did,
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
          did: formData.did,
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

        // Create minimal profile with required fields
        const profileData = {
          businessName: formData.name,
          businessType: "Sub Admin", // Default business type
          contactNumber: formData.contactNumber,
          contactName: formData.name, // Use same name as contact name
          pincode: "000000", // Default pincode
          city: "Not Specified", // Default city
          state: "Not Specified", // Default state
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

        alert("Human agent and profile created successfully");
      }

      // Reset form and refresh list
      setFormData({
        name: "",
        email: "",
        contactNumber: "",
        did: "",
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
      name: agent.humanAgentName,
      email: agent.email,
      contactNumber: agent.mobileNumber || "",
      did: agent.did || "",
    });
    setShowForm(true);
  };

  // Reset form
  const handleCancel = () => {
    setFormData({
      name: "",
      email: "",
      contactNumber: "",
      did: "",
    });
    setEditingAgent(null);
    setShowForm(false);
  };

  useEffect(() => {
    fetchHumanAgents();
  }, [clientId, clientToken]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 ml-64">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Human Agent Management
              </h2>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              )}
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
                  Add Human Agent
                </button>
              </div>
            )}

            {/* Form */}
            {showForm && (
              <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">
                  {editingAgent ? "Edit Human Agent" : "Add New Human Agent"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DID *
                      </label>
                      <input
                        type="text"
                        value={formData.did}
                        onChange={(e) =>
                          setFormData({ ...formData, did: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Enter DID"
                      />
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
                Human Agents
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading human agents...</p>
                </div>
              ) : humanAgents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiUser className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No human agents found</p>
                  <p className="text-sm">
                    Click "Add Human Agent" to get started
                  </p>
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
                          DID
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {agent.did || "N/A"}
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
