import { useState, useEffect } from "react";
import {
  FiX,
  FiPlus,
  FiUsers,
  FiCalendar,
  FiTrash2,
  FiPhone,
  FiPlay,
  FiPause,
  FiSkipForward,
} from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

function CampaignDetails({ campaignId, onBack }) {
  const [campaign, setCampaign] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingGroups, setAddingGroups] = useState(false);

  // New states for calling functionality
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const [showCallModal, setShowCallModal] = useState(false);
  const [callingStatus, setCallingStatus] = useState("idle"); // idle, calling, paused, completed
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [callResults, setCallResults] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [campaignGroups, setCampaignGroups] = useState([]);
  const [loadingCampaignGroups, setLoadingCampaignGroups] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAddGroupsModal, setShowAddGroupsModal] = useState(false);
  // Call details states
  const [showCallDetailsModal, setShowCallDetailsModal] = useState(false);
  const [callDetails, setCallDetails] = useState([]);
  const [callDetailsLoading, setCallDetailsLoading] = useState(false);
  const [callDetailsPage, setCallDetailsPage] = useState(1);
  const [callDetailsLimit] = useState(20);
  const [callDetailsMeta, setCallDetailsMeta] = useState({
    totalPages: 0,
    totalLogs: 0,
  });

  // API base URL
  const API_BASE = `${API_BASE_URL}/client`;
  useEffect(() => {
    fetchCampaignDetails();
    fetchAvailableGroups();
    fetchAgents();
    fetchClientData();
    fetchCampaignGroups();
    // Remove fetchCampaignGroups from here to prevent re-rendering issues
  }, [campaignId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCallModal && !event.target.closest(".call-modal")) {
        setShowCallModal(false);
      }
      if (showAddGroupsModal && !event.target.closest(".add-groups-modal")) {
        handleCloseAddGroupsModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCallModal, showAddGroupsModal]);

  const fetchClientData = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(`${API_BASE}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setClientData(result.data);
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
    }
  };

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/agents`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setAgents(result.data || []);
      } else {
        console.error("Failed to fetch agents:", result.error);
        setAgents([]);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  const makeVoiceBotCall = async (contact, agent) => {
    try {
      // Get client API key from database
      const token = sessionStorage.getItem("clienttoken");
      const apiKeysResponse = await fetch(`${API_BASE}/api-keys`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const apiKeysResult = await apiKeysResponse.json();
      let apiKey = "629lXqsiDk85lfMub7RsN73u4741MlOl4Dv8kJE9"; // fallback

      if (apiKeysResult.success && apiKeysResult.data.length > 0) {
        // Use the first available API key or find a specific one
        apiKey = apiKeysResult.data[0].key;
      }

      // Generate unique ID for this campaign call (same format as agent calls)
      const uniqueId = `aidial-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const callPayload = {
        transaction_id: "CTI_BOT_DIAL",
        phone_num: contact.phone.replace(/[^\d]/g, ""), // Remove non-digits
        uniqueid: uniqueId,
        callerid: "168353225",
        uuid: clientData?.clientId || "client-uuid-001",
        custom_param: {
          uniqueid: uniqueId,
        },
        resFormat: 3,
      };

      // Use your backend proxy instead of direct API call
      const response = await fetch(`${API_BASE}/proxy/clicktobot`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: apiKey,
          payload: callPayload,
        }),
      });

      const result = await response.json();

      // If call is successful, store the unique ID in the campaign
      if (result.success && campaign?._id) {
        try {
          await fetch(`${API_BASE}/campaigns/${campaign._id}/unique-ids`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uniqueId }),
          });
        } catch (error) {
          console.error("Failed to store unique ID in campaign:", error);
          // Don't fail the call if this fails
        }
      }

      return {
        success: result.success,
        data: result.data,
        contact: contact,
        group: campaignGroups[currentGroupIndex],
        timestamp: new Date(),
        uniqueId: uniqueId, // Include unique ID in result for tracking
      };
    } catch (error) {
      console.error("Error making voice bot call:", error);
      return {
        success: false,
        error: error.message,
        contact: contact,
        group: campaignGroups[currentGroupIndex],
        timestamp: new Date(),
      };
    }
  };

  const startCalling = async () => {
    if (!selectedAgent || campaignGroups.length === 0) {
      alert(
        "Please select an agent and ensure there are groups in the campaign."
      );
      return;
    }

    setCallingStatus("calling");
    setCurrentGroupIndex(0);
    setCurrentContactIndex(0);
    setCallResults([]);

    // Loop through all campaign groups
    for (let groupIdx = 0; groupIdx < campaignGroups.length; groupIdx++) {
      if (callingStatus === "paused") {
        break;
      }

      setCurrentGroupIndex(groupIdx);
      const group = campaignGroups[groupIdx];

      if (!group || !group.contacts || group.contacts.length === 0) {
        continue; // Skip groups without contacts
      }

      // Loop through all contacts in the current group
      for (
        let contactIdx = 0;
        contactIdx < group.contacts.length;
        contactIdx++
      ) {
        if (callingStatus === "paused") {
          break;
        }

        setCurrentContactIndex(contactIdx);
        const contact = group.contacts[contactIdx];

        console.log(
          `Calling ${contact.name} at ${contact.phone} in group ${group.name}...`
        );

        const result = await makeVoiceBotCall(contact, selectedAgent);
        setCallResults((prev) => [...prev, result]);

        // Wait 2 seconds between calls to avoid overwhelming the API
        if (contactIdx < group.contacts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    setCallingStatus("completed");
  };

  const pauseCalling = () => {
    setCallingStatus("paused");
  };

  const resumeCalling = async () => {
    setCallingStatus("calling");

    // Resume from current group and contact
    for (
      let groupIdx = currentGroupIndex;
      groupIdx < campaignGroups.length;
      groupIdx++
    ) {
      if (callingStatus === "paused") {
        break;
      }

      setCurrentGroupIndex(groupIdx);
      const group = campaignGroups[groupIdx];

      if (!group || !group.contacts || group.contacts.length === 0) {
        continue;
      }

      // Start from current contact index for the first group, 0 for subsequent groups
      const startContactIdx =
        groupIdx === currentGroupIndex ? currentContactIndex : 0;

      for (
        let contactIdx = startContactIdx;
        contactIdx < group.contacts.length;
        contactIdx++
      ) {
        if (callingStatus === "paused") {
          break;
        }

        setCurrentContactIndex(contactIdx);
        const contact = group.contacts[contactIdx];

        console.log(
          `Calling ${contact.name} at ${contact.phone} in group ${group.name}...`
        );

        const result = await makeVoiceBotCall(contact, selectedAgent);
        setCallResults((prev) => [...prev, result]);

        // Wait 2 seconds between calls
        if (contactIdx < group.contacts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    setCallingStatus("completed");
  };

  const skipToNext = () => {
    const currentGroup = campaignGroups[currentGroupIndex];
    if (
      currentGroup &&
      currentContactIndex < currentGroup.contacts.length - 1
    ) {
      setCurrentContactIndex((prev) => prev + 1);
    } else if (currentGroupIndex < campaignGroups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
      setCurrentContactIndex(0);
    }
  };

  const resetCalling = () => {
    setCallingStatus("idle");
    setCurrentGroupIndex(0);
    setCurrentContactIndex(0);
    setCallResults([]);
    // Don't reset the selected agent or close the modal
  };

  // Get current progress
  const getProgress = () => {
    let completedContacts = 0;
    let totalContacts = 0;

    for (let i = 0; i < campaignGroups.length; i++) {
      const group = campaignGroups[i];
      if (i < currentGroupIndex) {
        completedContacts += group.contacts.length;
      } else if (i === currentGroupIndex) {
        completedContacts += currentContactIndex;
      }
      totalContacts += group.contacts.length;
    }

    return { completed: completedContacts, total: totalContacts };
  };

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setCampaign(result.data);
        // Remove this call to prevent re-rendering issues
        // fetchCampaignGroups();
      } else {
        console.error("Failed to fetch campaign details:", result.error);
        // For demo purposes, create a dummy campaign if API fails
        setCampaign({
          _id: campaignId,
          name: "Demo Campaign",
          description: "This is a demo campaign for testing purposes",
          groupIds: [],
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: "draft",
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error fetching campaign details:", error);
      // For demo purposes, create a dummy campaign if API fails
      setCampaign({
        _id: campaignId,
        name: "Demo Campaign",
        description: "This is a demo campaign for testing purposes",
        groupIds: [],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "draft",
        createdAt: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableGroups = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(`${API_BASE}/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setAvailableGroups(result.data);
      } else {
        console.error("Failed to fetch groups:", result.error);
        // For demo purposes, create dummy groups if API fails
        setAvailableGroups([
          {
            _id: "1",
            name: "Demo Group 1",
            description: "First demo group",
            contacts: [],
          },
          {
            _id: "2",
            name: "Demo Group 2",
            description: "Second demo group",
            contacts: [],
          },
          {
            _id: "3",
            name: "Demo Group 3",
            description: "Third demo group",
            contacts: [],
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      // For demo purposes, create dummy groups if API fails
      setAvailableGroups([
        {
          _id: "1",
          name: "Demo Group 1",
          description: "First demo group",
          contacts: [],
        },
        {
          _id: "2",
          name: "Demo Group 2",
          description: "Second demo group",
          contacts: [],
        },
        {
          _id: "3",
          name: "Demo Group 3",
          description: "Third demo group",
          contacts: [],
        },
      ]);
    }
  };

  const fetchCampaignGroups = async () => {
    try {
      setLoadingCampaignGroups(true);
      const token = sessionStorage.getItem("clienttoken");

      if (!token) {
        setCampaignGroups([]);
        return;
      }

      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setCampaignGroups(result.data || []);
      } else {
        console.error("Failed to fetch campaign groups:", result.error);
        setCampaignGroups([]);
      }
    } catch (error) {
      console.error("Error fetching campaign groups:", error);
      setCampaignGroups([]);
    } finally {
      setLoadingCampaignGroups(false);
    }
  };

  // Fetch campaign call logs
  const fetchCampaignCallLogs = async (page = 1) => {
    try {
      if (!campaign?._id) return;
      setCallDetailsLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(callDetailsLimit),
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/call-logs?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        throw new Error(result.error || "Failed to fetch call logs");
      }
      setCallDetails(result.data || []);
      setCallDetailsMeta(result.pagination || { totalPages: 0, totalLogs: 0 });
      setCallDetailsPage(page);
    } catch (e) {
      console.error("Error fetching campaign call logs:", e);
      setCallDetails([]);
      setCallDetailsMeta({ totalPages: 0, totalLogs: 0 });
    } finally {
      setCallDetailsLoading(false);
    }
  };

  const handleCloseAddGroupsModal = () => {
    setShowAddGroupsModal(false);
    // Clear selected groups that are not in the campaign
    const currentSelected = selectedGroups.filter((id) =>
      campaignGroups.some((cg) => cg._id === id)
    );
    setSelectedGroups(currentSelected);
  };

  const getAvailableGroupsForCampaign = () => {
    // Get groups that are not already in the campaign
    const campaignGroupIds = campaignGroups.map((group) => group._id);
    return availableGroups.filter(
      (group) => !campaignGroupIds.includes(group._id)
    );
  };

  const handleAddSpecificGroupsToCampaign = async (groupIdsToAdd) => {
    if (groupIdsToAdd.length === 0) {
      alert("Please select at least one group to add to the campaign.");
      return;
    }

    try {
      setAddingGroups(true);
      const token = sessionStorage.getItem("clienttoken");

      // Get current campaign groups and add new ones
      const currentGroupIds = campaignGroups.map((group) => group._id);
      const updatedGroupIds = [...currentGroupIds, ...groupIdsToAdd];

      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/groups`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupIds: updatedGroupIds,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        // Update the campaign with new groups
        setCampaign((prev) => ({
          ...prev,
          groupIds: updatedGroupIds,
        }));
        // Refresh campaign groups to show the updated list
        fetchCampaignGroups();
        setShowAddGroupsModal(false);
        alert("Groups added to campaign successfully!");
      } else {
        console.error("Failed to add groups to campaign:", result.error);
        alert("Failed to add groups: " + result.error);
      }
    } catch (error) {
      console.error("Error adding groups to campaign:", error);
      alert("Error adding groups to campaign: " + error.message);
    } finally {
      setAddingGroups(false);
    }
  };

  const handleAddGroupsToCampaign = async () => {
    if (selectedGroups.length === 0) {
      alert("Please select at least one group to add to the campaign.");
      return;
    }

    try {
      setAddingGroups(true);
      const token = sessionStorage.getItem("clienttoken");

      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/groups`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupIds: selectedGroups,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        // Update the campaign with new groups
        setCampaign((prev) => ({
          ...prev,
          groupIds: selectedGroups,
        }));
        // Refresh campaign groups to show the updated list
        fetchCampaignGroups();
        alert("Groups updated successfully!");
      } else {
        console.error("Failed to add groups to campaign:", result.error);
        alert("Failed to update groups: " + result.error);
      }
    } catch (error) {
      console.error("Error adding groups to campaign:", error);
      // For demo purposes, update locally if API fails
      setCampaign((prev) => ({
        ...prev,
        groupIds: selectedGroups,
      }));
      alert("Groups updated (demo mode)!");
    } finally {
      setAddingGroups(false);
    }
  };

  const handleRemoveGroup = async (groupId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this group from the campaign?"
      )
    ) {
      try {
        setLoading(true);
        const updatedGroups = campaignGroups.filter(
          (group) => group._id !== groupId
        );

        const token = sessionStorage.getItem("clienttoken");
        const response = await fetch(
          `${API_BASE}/campaigns/${campaignId}/groups`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              groupIds: updatedGroups.map((group) => group._id),
            }),
          }
        );

        const result = await response.json();
        if (result.success) {
          setCampaign((prev) => ({
            ...prev,
            groupIds: updatedGroups.map((group) => group._id),
          }));
          // Refresh campaign groups to show the updated list
          fetchCampaignGroups();
        } else {
          console.error("Failed to remove group:", result.error);
          alert("Failed to remove group: " + result.error);
        }
      } catch (error) {
        console.error("Error removing group:", error);
        // For demo purposes, remove locally if API fails
        const updatedGroups = campaignGroups.filter(
          (group) => group._id !== groupId
        );
        setCampaign((prev) => ({
          ...prev,
          groupIds: updatedGroups.map((group) => group._id),
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "expired":
        return "bg-red-100 text-red-700";
      case "draft":
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading && !campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Campaign not found</div>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b-2 border-black p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 mb-2 flex items-center gap-2"
            >
              ← Back to Campaigns
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {campaign.name}
            </h2>
            <p className="text-gray-600 text-base">
              {campaign.description || "No description available"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Created: {new Date(campaign.createdAt).toLocaleDateString()}
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {campaignGroups.length} groups
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Campaign Info */}
        <div className="mb-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Campaign Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <FiCalendar className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Start Date</div>
                <div className="font-medium">
                  {new Date(campaign.startDate).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiCalendar className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">End Date</div>
                <div className="font-medium">
                  {new Date(campaign.endDate).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiUsers className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {campaign.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiUsers className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Groups</div>
                <div className="font-medium">
                  {campaignGroups.length} groups in campaign
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Groups */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-medium text-gray-700">
                Campaign Groups
              </h4>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowCallModal(true);
                }}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center gap-2"
                disabled={campaignGroups.length === 0 || loadingAgents}
              >
                <FiPhone className="w-4 h-4" />
                Make Calls
              </button>
              <button
                onClick={() => {
                  setShowCallDetailsModal(true);
                  fetchCampaignCallLogs(1);
                }}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 flex items-center gap-2"
                disabled={!campaign}
              >
                Call Details
              </button>
              <button
                onClick={() => setShowAddGroupsModal(true)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Add Groups
              </button>
              <button
                onClick={fetchCampaignGroups}
                disabled={loadingCampaignGroups}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          {loadingCampaignGroups ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading campaign groups...</p>
            </div>
          ) : campaignGroups.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
              <h5 className="text-lg font-medium text-gray-600 mb-2">
                No groups in campaign
              </h5>
              <p className="text-gray-500">
                This campaign doesn't have any groups yet
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-800">
                      {campaignGroups.length}
                    </div>
                    <div className="text-sm text-blue-600">Total Groups</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-800">
                      {campaignGroups.reduce(
                        (total, group) => total + (group.contacts?.length || 0),
                        0
                      )}
                    </div>
                    <div className="text-sm text-blue-600">Total Contacts</div>
                  </div>
                </div>
              </div>

              {/* Groups Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaignGroups.map((group) => (
                  <div
                    key={group._id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-blue-800">
                        {group.name}
                      </h5>
                      <button
                        onClick={() => handleRemoveGroup(group._id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        disabled={loading}
                        title="Remove from campaign"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                    <p className="text-sm text-blue-600 mb-2">
                      {group.description}
                    </p>
                    <div className="text-xs text-blue-500">
                      {group.contacts?.length || 0} contacts
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Make Calls Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 call-modal">
          <div className="bg-white rounded-lg w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="m-0 text-gray-800">
                Make Calls to Campaign Groups
              </h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-0 w-8 h-8 flex items-center justify-center"
                onClick={() => setShowCallModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="p-6">
              {/* Agent Selection */}
              {!selectedAgent && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Select an Agent
                  </h4>
                  {loadingAgents ? (
                    <div className="text-center py-4">Loading agents...</div>
                  ) : agents.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No agents available
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {agents.map((agent) => (
                        <div
                          key={agent._id}
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-200 transition-colors"
                          onClick={() => setSelectedAgent(agent)}
                        >
                          <h5 className="font-semibold text-gray-800 mb-2">
                            {agent.agentName}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {agent.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Calling Interface */}
              {selectedAgent && (
                <div>
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Selected Agent: {selectedAgent.agentName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedAgent.description}
                    </p>
                    <button
                      onClick={() => setSelectedAgent(null)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Change Agent
                    </button>
                  </div>

                  {/* Campaign Overview */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Campaign Overview
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Campaign Groups:</span>
                        <div className="font-semibold">
                          {campaignGroups.length}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Contacts:</span>
                        <div className="font-semibold">
                          {campaignGroups.reduce(
                            (total, group) =>
                              total + (group.contacts?.length || 0),
                            0
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Group:</span>
                        <div className="font-semibold">
                          {campaignGroups[currentGroupIndex]?.name || "None"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <div className="font-semibold capitalize">
                          {callingStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Call Progress
                      </h4>
                      <div className="text-sm text-gray-600">
                        <div className="text-center mb-4">
                          <div className="text-sm text-gray-600 mb-2">
                            Group {currentGroupIndex + 1} of{" "}
                            {campaignGroups.length} (
                            {campaignGroups[currentGroupIndex]?.name ||
                              "Unknown"}
                            )
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Contact {currentContactIndex + 1} of{" "}
                            {campaignGroups[currentGroupIndex]?.contacts
                              ?.length || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (getProgress().completed / getProgress().total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>

                    {/* Current Contact */}
                    {callingStatus !== "idle" &&
                      campaignGroups[currentGroupIndex] && (
                        <div className="p-4 bg-gray-50 rounded-lg mb-4">
                          <h5 className="font-semibold text-gray-800">
                            Currently Calling:{" "}
                            {campaignGroups[currentGroupIndex]?.contacts?.[
                              currentContactIndex
                            ]?.name || "Unknown"}
                          </h5>
                          <p className="text-sm text-gray-600">
                            Phone:{" "}
                            {campaignGroups[currentGroupIndex]?.contacts?.[
                              currentContactIndex
                            ]?.phone || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Group:{" "}
                            {campaignGroups[currentGroupIndex]?.name ||
                              "Unknown"}
                          </p>
                        </div>
                      )}

                    {/* Control Buttons */}
                    <div className="flex gap-3 justify-center">
                      {callingStatus === "idle" && (
                        <button
                          onClick={startCalling}
                          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <FiPlay className="text-sm" />
                          Start Calling
                        </button>
                      )}

                      {callingStatus === "calling" && (
                        <>
                          <button
                            onClick={pauseCalling}
                            className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center gap-2"
                          >
                            <FiPause className="text-sm" />
                            Pause
                          </button>
                          <button
                            onClick={skipToNext}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <FiSkipForward className="text-sm" />
                            Skip
                          </button>
                        </>
                      )}

                      {callingStatus === "paused" && (
                        <button
                          onClick={resumeCalling}
                          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <FiPlay className="text-sm" />
                          Resume
                        </button>
                      )}

                      {(callingStatus === "completed" ||
                        callingStatus === "paused") && (
                        <button
                          onClick={resetCalling}
                          className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Call Results */}
                  {callResults.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">
                        Call Results
                      </h4>
                      <div className="max-h-64 overflow-y-auto">
                        {callResults.map((result, index) => (
                          <div
                            key={index}
                            className={`p-3 mb-2 rounded-lg ${
                              result.success
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h6 className="font-semibold text-gray-800">
                                  {result.contact.name}
                                </h6>
                                <p className="text-sm text-gray-600">
                                  {result.contact.phone}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Group: {result.group?.name || "Unknown"}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    result.success
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {result.success ? "Success" : "Failed"}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  {result.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                            {result.error && (
                              <p className="text-sm text-red-600 mt-2">
                                Error: {result.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Groups Modal */}
      {showAddGroupsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl add-groups-modal">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="m-0 text-gray-800">Add Groups to Campaign</h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-0 w-8 h-8 flex items-center justify-center"
                onClick={handleCloseAddGroupsModal}
              >
                <FiX />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Available Groups
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Select groups to add to this campaign. Only groups not already
                  in the campaign are shown.
                </p>

                {getAvailableGroupsForCampaign().length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                    <h5 className="text-lg font-medium text-gray-600 mb-2">
                      No available groups
                    </h5>
                    <p className="text-gray-500">
                      All groups are already in this campaign
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getAvailableGroupsForCampaign().map((group) => (
                      <div
                        key={group._id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
                        onClick={() => {
                          const currentSelected = selectedGroups.filter(
                            (id) => !campaignGroups.some((cg) => cg._id === id)
                          );
                          if (currentSelected.includes(group._id)) {
                            setSelectedGroups(
                              currentSelected.filter((id) => id !== group._id)
                            );
                          } else {
                            setSelectedGroups([...currentSelected, group._id]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-800">
                            {group.name}
                          </h5>
                          <div
                            className={`w-5 h-5 rounded border-2 ${
                              selectedGroups.includes(group._id) &&
                              !campaignGroups.some((cg) => cg._id === group._id)
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300"
                            } flex items-center justify-center`}
                          >
                            {selectedGroups.includes(group._id) &&
                              !campaignGroups.some(
                                (cg) => cg._id === group._id
                              ) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {group.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          {group.contacts?.length || 0} contacts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseAddGroupsModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const groupsToAdd = selectedGroups.filter(
                      (id) => !campaignGroups.some((cg) => cg._id === id)
                    );
                    handleAddSpecificGroupsToCampaign(groupsToAdd);
                  }}
                  disabled={
                    addingGroups ||
                    selectedGroups.filter(
                      (id) => !campaignGroups.some((cg) => cg._id === id)
                    ).length === 0
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {addingGroups ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-4 h-4" />
                      Add to Campaign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Details Modal */}
      {showCallDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="m-0 text-gray-800">Call Details</h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-0 w-8 h-8 flex items-center justify-center"
                onClick={() => setShowCallDetailsModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {callDetailsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading call logs...</p>
                </div>
              ) : callDetails.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h5 className="text-lg font-medium text-gray-600 mb-2">
                    No call logs
                  </h5>
                  <p className="text-gray-500">
                    No calls found for this campaign yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {callDetails.map((log) => (
                    <div
                      key={log._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm text-gray-500">Time</div>
                          <div className="font-semibold">
                            {new Date(
                              log.createdAt || log.time
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Duration</div>
                          <div className="font-semibold">
                            {Math.max(0, log.duration || 0)}s
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div>
                          <div className="text-sm text-gray-500">Mobile</div>
                          <div className="font-medium">{log.mobile || "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Agent</div>
                          <div className="font-medium">
                            {log.agentId?.agentName || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">
                            Lead Status
                          </div>
                          <div className="font-medium capitalize">
                            {log.leadStatus || "-"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500 break-all">
                        <span className="font-semibold">uniqueId:</span>{" "}
                        {log.metadata?.customParams?.uniqueid || "-"}
                      </div>
                      {log.transcript && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-blue-600">
                            View transcript
                          </summary>
                          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded mt-2 max-h-64 overflow-y-auto">
                            {log.transcript}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {callDetailsPage} of {callDetailsMeta.totalPages || 1} •
                  Total {callDetailsMeta.totalLogs || 0}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    onClick={() =>
                      fetchCampaignCallLogs(Math.max(1, callDetailsPage - 1))
                    }
                    disabled={callDetailsPage <= 1 || callDetailsLoading}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    onClick={() => fetchCampaignCallLogs(callDetailsPage + 1)}
                    disabled={
                      callDetailsLoading ||
                      (callDetailsMeta.totalPages &&
                        callDetailsPage >= callDetailsMeta.totalPages)
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignDetails;
