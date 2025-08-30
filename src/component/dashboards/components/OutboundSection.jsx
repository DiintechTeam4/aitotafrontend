import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FiX,
  FiEye,
  FiMoreVertical,
  FiUsers,
  FiGrid,
  FiList,
} from "react-icons/fi";
import GroupDetails from "./GroupDetails";
import CampaignDetails from "./CampaignDetails";
import { API_BASE_URL } from "../../../config";

function OutboundSection({ tenantId }) {
  // Original states
  const [contactGroups, setContactGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("campaigns");
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);

  // New states for campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [showAddCampaignForm, setShowAddCampaignForm] = useState(false);

  // Form states
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    category: "",
  });

  // Initialize campaign view mode to mirror groups by default
  useEffect(() => {
    setCampaignViewMode(viewMode);
  }, []);

  // Update campaign handlers
  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    if (!editingCampaign?._id || !campaignEditForm.name.trim()) {
      toast.warn("Campaign name is required");
      return;
    }
    try {
      setSavingCampaignEdit(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${editingCampaign._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: campaignEditForm.name,
            description: campaignEditForm.description,
            category: campaignEditForm.category,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.error || "Failed to update campaign");
      }

      // Update local state
      setCampaigns((prev) =>
        prev.map((c) =>
          c._id === editingCampaign._id ? { ...c, ...result.data } : c
        )
      );
      setShowEditCampaignForm(false);
      setEditingCampaign(null);
    } catch (err) {
      console.error("Error updating campaign:", err);
      toast.error(err.message || "Failed to update campaign");
    } finally {
      setSavingCampaignEdit(false);
    }
  };

  // Loading states
  const [loading, setLoading] = useState(false);

  // Navigation state
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [campaignViewMode, setCampaignViewMode] = useState("grid");

  // Group editing UI state
  const [openMenuGroupId, setOpenMenuGroupId] = useState(null);
  const [openMenuCampaignId, setOpenMenuCampaignId] = useState(null);
  const [showEditGroupForm, setShowEditGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupEditForm, setGroupEditForm] = useState({
    name: "",
    description: "",
  });
  const [savingGroupEdit, setSavingGroupEdit] = useState(false);

  // Campaign editing UI state
  const [showEditCampaignForm, setShowEditCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignEditForm, setCampaignEditForm] = useState({
    name: "",
    description: "",
    category: "",
  });
  const [savingCampaignEdit, setSavingCampaignEdit] = useState(false);

  // API base URL
  const API_BASE = `${API_BASE_URL}/client`;

  // Derived stats
  const totalGroups = contactGroups.length;
  const totalContacts = contactGroups.reduce(
    (sum, g) => sum + (g.contacts?.length || 0),
    0
  );

  useEffect(() => {
    fetchGroups();
    fetchCampaigns();
  }, [tenantId]);

  // Fetch groups from API
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

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

      const response = await fetch(`${API_BASE}/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

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
        toast.error("Failed to create group: " + result.error);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Error creating group");
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
          category: campaignForm.category,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCampaignForm({
          name: "",
          description: "",
          category: "",
        });
        setShowAddCampaignForm(false);
        fetchCampaigns(); // Refresh the list
      } else {
        console.error("Failed to create campaign:", result.error);
        toast.error("Failed to create campaign: " + result.error);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Error creating campaign");
    } finally {
      setLoading(false);
    }
  };

  // Copy group
  const handleCopyGroup = async (group) => {
    try {
      setLoading(true);

      // First create the new group
      const response = await fetch(`${API_BASE}/groups`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${group.name}_copy`,
          description: group.description || "",
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create copied group");
      }

      const newGroupId = result.data._id;

      // If the original group has contacts, copy them to the new group
      if (group.contacts && group.contacts.length > 0) {
        let successCount = 0;
        let errorCount = 0;

        // Add contacts one by one since the API only accepts single contacts
        for (const contact of group.contacts) {
          try {
            const contactData = {
              name: contact.name || "",
              phone: contact.phone || "",
              email: contact.email || "",
            };

            const addContactResponse = await fetch(
              `${API_BASE}/groups/${newGroupId}/contacts`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${sessionStorage.getItem(
                    "clienttoken"
                  )}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(contactData),
              }
            );

            const addContactResult = await addContactResponse.json();
            if (addContactResult.success) {
              successCount++;
            } else {
              errorCount++;
              console.warn(
                `Failed to copy contact ${contact.name}:`,
                addContactResult.error
              );
            }
          } catch (error) {
            errorCount++;
            console.error(`Error copying contact ${contact.name}:`, error);
          }
        }

        if (errorCount === 0) {
          toast.success(
            `Group copied successfully with ${successCount} contacts!`
          );
        } else if (successCount > 0) {
          toast.success(
            `Group copied with ${successCount} contacts (${errorCount} failed)`
          );
        } else {
          toast.warn("Group copied but all contacts failed to copy");
        }
      } else {
        toast.success("Group copied successfully!");
      }

      fetchGroups(); // Refresh the list
    } catch (error) {
      console.error("Error copying group:", error);
      toast.error("Error copying group: " + error.message);
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
          toast.error("Failed to delete group: " + result.error);
        }
      } catch (error) {
        console.error("Error deleting group:", error);
        toast.error("Error deleting group");
      } finally {
        setLoading(false);
      }
    }
  };

  // Edit group handlers
  const openEditGroup = (group) => {
    setEditingGroup(group);
    setGroupEditForm({
      name: group.name || "",
      description: group.description || "",
    });
    setShowEditGroupForm(true);
    setOpenMenuGroupId(null);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup?._id || !groupEditForm.name.trim()) {
      toast.warn("Group name is required");
      return;
    }
    try {
      setSavingGroupEdit(true);
      const response = await fetch(`${API_BASE}/groups/${editingGroup._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("clienttoken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupEditForm.name,
          description: groupEditForm.description,
          category: groupEditForm.category,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setShowEditGroupForm(false);
        setEditingGroup(null);
        // Refresh groups list
        fetchGroups();
      } else {
        toast.error(
          "Failed to update group: " + (result.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Error updating group. Please try again.");
    } finally {
      setSavingGroupEdit(false);
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
          toast.error("Failed to delete campaign: " + result.error);
        }
      } catch (error) {
        console.error("Error deleting campaign:", error);
        toast.error("Error deleting campaign");
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
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Outbound</h2>
        <p className="text-gray-600 text-base">
          Manage contact groups and configure outbound communications for your
          campaigns.
        </p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
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
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "groups" && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  className={`p-2 rounded-lg border ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                  title="Grid view"
                  onClick={() => setViewMode("grid")}
                >
                  <FiGrid />
                </button>
                <button
                  className={`p-2 rounded-lg border ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                  title="List view"
                  onClick={() => setViewMode("list")}
                >
                  <FiList />
                </button>
              </div>
            )}
            {activeTab === "campaigns" && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  className={`p-2 rounded-lg border ${
                    campaignViewMode === "grid"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                  title="Grid view"
                  onClick={() => setCampaignViewMode("grid")}
                >
                  <FiGrid />
                </button>
                <button
                  className={`p-2 rounded-lg border ${
                    campaignViewMode === "list"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                  title="List view"
                  onClick={() => setCampaignViewMode("list")}
                >
                  <FiList />
                </button>
              </div>
            )}
            {activeTab === "groups" ? (
              <button
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                onClick={() => setShowAddGroupForm(true)}
                disabled={loading}
              >
                {loading ? "Loading..." : "+ Create Group"}
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                onClick={() => setShowAddCampaignForm(true)}
                disabled={loading}
              >
                {loading ? "Loading..." : "+ Create Campaign"}
              </button>
            )}
          </div>
        </div>

        {activeTab === "groups" && (
          <div>
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 px-8 py-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-700">
                      Total Groups
                    </div>
                    <div className="text-3xl font-extrabold text-blue-900">
                      {totalGroups}
                    </div>
                  </div>
                  <div className="p-2 bg-blue-500 rounded-xl text-white">
                    <FiUsers className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 px-8 py-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-700">
                      Total Contacts
                    </div>
                    <div className="text-3xl font-extrabold text-green-900 mt-1">
                      {totalContacts}
                    </div>
                  </div>
                  <div className="p-2 bg-green-500 rounded-xl text-white">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
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
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {contactGroups.map((group) => (
                  <div
                    key={group._id}
                    className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 h-48 flex flex-col cursor-pointer relative hover:-translate-y-0.5"
                    onClick={() => setSelectedGroupId(group._id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-sm font-bold text-gray-900 m-0 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {group.name}
                      </h3>
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                          onClick={() =>
                            setOpenMenuGroupId((prev) =>
                              prev === group._id ? null : group._id
                            )
                          }
                          disabled={loading}
                          aria-haspopup="menu"
                          aria-expanded={openMenuGroupId === group._id}
                          title="More actions"
                        >
                          <FiMoreVertical />
                        </button>
                        {openMenuGroupId === group._id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              onClick={() => openEditGroup(group)}
                            >
                              Edit
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              onClick={() => {
                                setOpenMenuGroupId(null);
                                handleCopyGroup(group);
                              }}
                            >
                              Copy
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setOpenMenuGroupId(null);
                                handleDeleteGroup(group._id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {group.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {group.contacts?.length || 0} contacts
                      </div>
                      <div className="text-xs text-gray-400">
                        <div>Created</div>
                        <div>
                          {new Date(group.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          {new Date(group.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white">
                {contactGroups.map((group) => (
                  <div
                    key={group._id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setSelectedGroupId(group._id)}
                    >
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {group.name}
                      </div>
                      {group.description && (
                        <div className="text-sm text-gray-600 truncate">
                          {group.description}
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:block w-32 text-sm text-gray-600">
                      {group.contacts?.length || 0} contacts
                    </div>
                    <div className="hidden md:block w-40 text-xs text-gray-400">
                      <div>Created</div>
                      <div>
                        {new Date(group.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        {new Date(group.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="ml-2 relative">
                      <button
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuGroupId((prev) =>
                            prev === group._id ? null : group._id
                          );
                        }}
                        disabled={loading}
                        aria-haspopup="menu"
                        aria-expanded={openMenuGroupId === group._id}
                        title="More actions"
                      >
                        <FiMoreVertical />
                      </button>
                      {openMenuGroupId === group._id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => openEditGroup(group)}
                          >
                            Edit
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => {
                              setOpenMenuGroupId(null);
                              handleCopyGroup(group);
                            }}
                          >
                            Copy
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setOpenMenuGroupId(null);
                              handleDeleteGroup(group._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
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
              <div
                className={
                  campaignViewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
                    : "divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white"
                }
              >
                {campaigns.map((campaign) =>
                  campaignViewMode === "grid" ? (
                    <div
                      key={campaign._id}
                      className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 h-48 flex flex-col cursor-pointer relative hover:-translate-y-0.5"
                      onClick={() => setSelectedCampaignId(campaign._id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-sm font-bold text-gray-900 m-0 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {campaign.name}
                        </h3>
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            onClick={() =>
                              setOpenMenuCampaignId((prev) =>
                                prev === campaign._id ? null : campaign._id
                              )
                            }
                            disabled={loading}
                            aria-haspopup="menu"
                            aria-expanded={openMenuCampaignId === campaign._id}
                            title="More actions"
                          >
                            <FiMoreVertical />
                          </button>
                          {openMenuCampaignId === campaign._id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                onClick={() => {
                                  setEditingCampaign(campaign);
                                  setCampaignEditForm({
                                    name: campaign.name || "",
                                    description: campaign.description || "",
                                    category: campaign.category || "",
                                  });
                                  setShowEditCampaignForm(true);
                                  setOpenMenuCampaignId(null);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setOpenMenuCampaignId(null);
                                  handleDeleteCampaign(campaign._id);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {campaign.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {campaign.description}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {(campaign.groupIds && campaign.groupIds.length) || 0}{" "}
                          groups
                        </div>
                        <div className="text-xs text-gray-400">
                          <div>Created</div>
                          <div>
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            {new Date(campaign.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={campaign._id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedCampaignId(campaign._id)}
                      >
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {campaign.name}
                        </div>
                        {campaign.description && (
                          <div className="text-sm text-gray-600 truncate">
                            {campaign.description}
                          </div>
                        )}
                      </div>
                      <div className="hidden sm:block w-32 text-sm text-gray-600">
                        {(campaign.groupIds && campaign.groupIds.length) || 0}{" "}
                        groups
                      </div>
                      <div className="hidden md:block w-40 text-xs text-gray-400">
                        <div>Created</div>
                        <div>
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          {new Date(campaign.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="ml-2 relative">
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuCampaignId((prev) =>
                              prev === campaign._id ? null : campaign._id
                            );
                          }}
                          disabled={loading}
                          aria-haspopup="menu"
                          aria-expanded={openMenuCampaignId === campaign._id}
                          title="More actions"
                        >
                          <FiMoreVertical />
                        </button>
                        {openMenuCampaignId === campaign._id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              onClick={() => {
                                setEditingCampaign(campaign);
                                setCampaignEditForm({
                                  name: campaign.name || "",
                                  description: campaign.description || "",
                                  category: campaign.category || "",
                                });
                                setShowEditCampaignForm(true);
                                setOpenMenuCampaignId(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setOpenMenuCampaignId(null);
                                handleDeleteCampaign(campaign._id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit Campaign Modal */}
        {showEditCampaignForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="m-0 text-gray-800">Edit Campaign</h3>
                <button
                  className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-0 w-8 h-8 flex items-center justify-center"
                  onClick={() => setShowEditCampaignForm(false)}
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleUpdateCampaign} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={campaignEditForm.name}
                    onChange={(e) =>
                      setCampaignEditForm({
                        ...campaignEditForm,
                        name: e.target.value,
                      })
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
                    value={campaignEditForm.description}
                    onChange={(e) =>
                      setCampaignEditForm({
                        ...campaignEditForm,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={campaignEditForm.category}
                    onChange={(e) =>
                      setCampaignEditForm({
                        ...campaignEditForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                    onClick={() => setShowEditCampaignForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCampaignEdit}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                  >
                    {savingCampaignEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Group Modal */}
        {showAddGroupForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

        {/* Edit Group Modal */}
        {showEditGroupForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="m-0 text-gray-800">Edit Group</h3>
                <button
                  className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-0 w-8 h-8 flex items-center justify-center"
                  onClick={() => setShowEditGroupForm(false)}
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleUpdateGroup} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupEditForm.name}
                    onChange={(e) =>
                      setGroupEditForm({
                        ...groupEditForm,
                        name: e.target.value,
                      })
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
                    rows="3"
                    value={groupEditForm.description}
                    onChange={(e) =>
                      setGroupEditForm({
                        ...groupEditForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                    onClick={() => setShowEditGroupForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                    disabled={savingGroupEdit}
                  >
                    {savingGroupEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Campaign Modal */}
        {showAddCampaignForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                    Category
                  </label>
                  <input
                    type="text"
                    value={campaignForm.category}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        category: e.target.value,
                      })
                    }
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
