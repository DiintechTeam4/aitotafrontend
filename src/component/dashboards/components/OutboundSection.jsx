import { useState, useEffect } from "react";
import { FiX, FiEye } from "react-icons/fi";
import GroupDetails from "./GroupDetails";
import CampaignDetails from "./CampaignDetails";
import { API_BASE_URL } from "../../../config";

function OutboundSection({ tenantId }) {
  // Original states
  const [contactGroups, setContactGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("groups");
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);

  // New states for campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [showAddCampaignForm, setShowAddCampaignForm] = useState(false);
console.log(API_BASE_URL)
  // Form states
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Loading states
  const [loading, setLoading] = useState(false);

  // Navigation state
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  // API base URL
  const API_BASE = `${API_BASE_URL}/client`;

  useEffect(() => {
    fetchGroups();
    fetchCampaigns();
  }, [tenantId]);

  // Fetch groups from API
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      console.log(
        "Using token for groups:",
        token ? "Token exists" : "No token"
      );

      const response = await fetch(`${API_BASE}/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Groups response status:", response.status);
      const result = await response.json();
      console.log("Groups response:", result);

      if (result.success) {
        setContactGroups(result.data);
      } else {
        console.error("Failed to fetch groups:", result.error);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaigns from API
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      console.log(
        "Using token for campaigns:",
        token ? "Token exists" : "No token"
      );

      const response = await fetch(`${API_BASE}/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Campaigns response status:", response.status);
      const result = await response.json();
      console.log("Campaigns response:", result);

      if (result.success) {
        setCampaigns(result.data);
      } else {
        console.error("Failed to fetch campaigns:", result.error);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group handlers
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupForm.name,
          description: groupForm.description,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGroupForm({ name: "", description: "" });
        setShowAddGroupForm(false);
        fetchGroups(); // Refresh the list
      } else {
        console.error("Failed to create group:", result.error);
        alert("Failed to create group: " + result.error);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Error creating group");
    } finally {
      setLoading(false);
    }
  };

  // Campaign handlers
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      console.log(
        "Using token for create campaign:",
        token ? "Token exists" : "No token"
      );
      console.log("Campaign form data:", campaignForm);

      const response = await fetch(`${API_BASE}/campaigns`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: campaignForm.name,
          description: campaignForm.description,
          startDate: campaignForm.startDate,
          endDate: campaignForm.endDate,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCampaignForm({
          name: "",
          description: "",
          startDate: "",
          endDate: "",
        });
        setShowAddCampaignForm(false);
        fetchCampaigns(); // Refresh the list
      } else {
        console.error("Failed to create campaign:", result.error);
        alert("Failed to create campaign: " + result.error);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Error creating campaign");
    } finally {
      setLoading(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this group and all its contacts?"
      )
    ) {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/groups/${groupId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        if (result.success) {
          fetchGroups(); // Refresh the list
        } else {
          console.error("Failed to delete group:", result.error);
          alert("Failed to delete group: " + result.error);
        }
      } catch (error) {
        console.error("Error deleting group:", error);
        alert("Error deleting group");
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        if (result.success) {
          fetchCampaigns(); // Refresh the list
        } else {
          console.error("Failed to delete campaign:", result.error);
          alert("Failed to delete campaign: " + result.error);
        }
      } catch (error) {
        console.error("Error deleting campaign:", error);
        alert("Error deleting campaign");
      } finally {
        setLoading(false);
      }
    }
  };

  // If a group is selected, show the group details
  if (selectedGroupId) {
    return (
      <GroupDetails
        groupId={selectedGroupId}
        onBack={() => setSelectedGroupId(null)}
      />
    );
  }

  // If a campaign is selected, show the campaign details
  if (selectedCampaignId) {
    return (
      <CampaignDetails
        campaignId={selectedCampaignId}
        onBack={() => setSelectedCampaignId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="border-b-2 border-black p-6 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Contact Groups & Outbound
        </h2>
        <p className="text-gray-600 text-base">
          Manage contact groups and configure outbound communications for your
          campaigns.
        </p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              activeTab === "groups"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("groups")}
          >
            Groups ({contactGroups.length})
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              activeTab === "campaigns"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("campaigns")}
          >
            Campaigns ({campaigns.length})
          </button>
        </div>

        {activeTab === "groups" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                onClick={() => setShowAddGroupForm(true)}
                disabled={loading}
              >
                {loading ? "Loading..." : "+ Create Group"}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Loading groups...</div>
              </div>
            ) : contactGroups.length === 0 ? (
              <div className="text-center py-12 px-8 text-gray-600 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Groups
                </h3>
                <p>Create your first group to start managing contacts</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contactGroups.map((group) => (
                  <div
                    key={group._id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-800 m-0">
                        {group.name}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold flex items-center gap-1"
                          onClick={() => setSelectedGroupId(group._id)}
                          disabled={loading}
                        >
                          <FiEye className="text-xs" />
                          View
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold flex items-center"
                          onClick={() => handleDeleteGroup(group._id)}
                          disabled={loading}
                        >
                          <FiX className="text-xs" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{group.description}</p>
                    <div className="text-sm text-gray-500 font-semibold">
                      <span>{group.contacts?.length || 0} contacts</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-sm text-gray-600 font-semibold">
                        Contacts:
                      </span>
                      {!group.contacts || group.contacts.length === 0 ? (
                        <span className="ml-2 text-gray-400">No contacts</span>
                      ) : (
                        <ul className="ml-4 mt-1 list-disc text-sm">
                          {group.contacts.map((c, idx) => (
                            <li key={idx} className="text-gray-700">
                              {c.name} ({c.phone})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "campaigns" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                onClick={() => setShowAddCampaignForm(true)}
                disabled={loading}
              >
                {loading ? "Loading..." : "+ Create Campaign"}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Loading campaigns...</div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 px-8 text-gray-600 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Campaigns
                </h3>
                <p>
                  Create your first campaign to start managing outbound
                  communications
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign._id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-800 m-0">
                        {campaign.name}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold flex items-center gap-1"
                          onClick={() => setSelectedCampaignId(campaign._id)}
                          disabled={loading}
                        >
                          <FiEye className="text-xs" />
                          View
                        </button>
                        <button
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold flex items-center"
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          disabled={loading}
                        >
                          <FiX className="text-xs" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{campaign.description}</p>
                    <div className="text-sm text-gray-500 font-semibold mb-2">
                      Status:{" "}
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          campaign.status === "active"
                            ? "bg-green-100 text-green-700"
                            : campaign.status === "expired"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      <div>
                        Start: {new Date(campaign.startDate).toLocaleString()}
                      </div>
                      <div>
                        End: {new Date(campaign.endDate).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-semibold">
                        Groups:
                      </span>
                      {!campaign.groupIds || campaign.groupIds.length === 0 ? (
                        <span className="ml-2 text-gray-400">
                          No groups added
                        </span>
                      ) : (
                        <ul className="ml-4 mt-1 list-disc text-sm">
                          {campaign.groupIds.map((g) => (
                            <li key={g._id} className="text-gray-700">
                              {g.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Group Modal */}
        {showAddGroupForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="m-0 text-gray-800">Create Group</h3>
                <button
                  className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-0 w-8 h-8 flex items-center justify-center"
                  onClick={() => setShowAddGroupForm(false)}
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                    onClick={() => setShowAddGroupForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Group"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Campaign Modal */}
        {showAddCampaignForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="m-0 text-gray-800">Create Campaign</h3>
                <button
                  className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-0 w-8 h-8 flex items-center justify-center"
                  onClick={() => setShowAddCampaignForm(false)}
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleCreateCampaign} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={campaignForm.description}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={campaignForm.startDate}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        startDate: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={campaignForm.endDate}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        endDate: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                    onClick={() => setShowAddCampaignForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Campaign"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OutboundSection;
