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
  FiBarChart2,
  FiUserPlus,
  FiFolder,
} from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

function CampaignDetails({ campaignId, onBack }) {
  // Debug: Check if icons are imported
  console.log("Icons imported:", { FiPhone, FiUsers, FiPlus, FiBarChart2 });

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

  // Campaign contacts management states
  const [campaignContacts, setCampaignContacts] = useState([]);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [loadingContacts, setLoadingContacts] = useState(false);

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
        // Previous groups are fully completed
        completedContacts += group.contacts.length;
      } else if (i === currentGroupIndex) {
        // Current group: count contacts up to current index
        completedContacts += currentContactIndex;
      }
      totalContacts += group.contacts.length;
    }

    // If we're at the last group and last contact, mark as fully completed
    if (
      currentGroupIndex === campaignGroups.length - 1 &&
      currentContactIndex >=
        (campaignGroups[currentGroupIndex]?.contacts?.length || 0)
    ) {
      completedContacts = totalContacts;
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

  // Campaign contacts management functions
  const fetchCampaignContacts = async () => {
    try {
      if (!campaign?._id) return;
      setLoadingContacts(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/contacts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        setCampaignContacts(result.data || []);
      } else {
        console.error("Failed to fetch campaign contacts:", result.error);
        setCampaignContacts([]);
      }
    } catch (error) {
      console.error("Error fetching campaign contacts:", error);
      setCampaignContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const syncContactsFromGroups = async () => {
    try {
      if (!campaign?._id) return;
      setLoadingContacts(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/sync-contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        alert(
          `Successfully synced ${result.data.totalContacts} contacts from ${result.data.totalGroups} groups`
        );
        fetchCampaignContacts(); // Refresh the contacts list
      } else {
        alert("Failed to sync contacts: " + result.error);
      }
    } catch (error) {
      console.error("Error syncing contacts:", error);
      alert("Error syncing contacts: " + error.message);
    } finally {
      setLoadingContacts(false);
    }
  };

  const addContactToCampaign = async () => {
    try {
      if (!campaign?._id || !contactForm.name || !contactForm.phone) {
        alert("Name and phone are required");
        return;
      }
      setLoadingContacts(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contactForm),
        }
      );
      const result = await response.json();
      if (result.success) {
        alert("Contact added successfully");
        setContactForm({
          name: "",
          phone: "",
          email: "",
        });
        setShowAddContactModal(false);
        fetchCampaignContacts(); // Refresh the contacts list
      } else {
        alert("Failed to add contact: " + result.error);
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      alert("Error adding contact: " + error.message);
    } finally {
      setLoadingContacts(false);
    }
  };

  const removeContactFromCampaign = async (contactId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this contact from the campaign?"
      )
    ) {
      return;
    }
    try {
      if (!campaign?._id) return;
      setLoadingContacts(true);
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/contacts/${contactId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        alert("Contact removed successfully");
        fetchCampaignContacts(); // Refresh the contacts list
      } else {
        alert("Failed to remove contact: " + result.error);
      }
    } catch (error) {
      console.error("Error removing contact:", error);
      alert("Error removing contact: " + error.message);
    } finally {
      setLoadingContacts(false);
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 shadow-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Campaigns
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {campaign.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Campaign Management Dashboard
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">
                Created{" "}
                {new Date(campaign.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                {campaignGroups.length} Groups
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Campaign Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Start Date
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(campaign.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(campaign.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campaign.status === "active"
                        ? "bg-green-100 text-green-800"
                        : campaign.status === "expired"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {campaign.status.charAt(0).toUpperCase() +
                      campaign.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Contacts
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {campaignGroups.reduce(
                      (total, group) => total + (group.contacts?.length || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Campaign Actions
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage your campaign operations and contacts
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchCampaignGroups}
                  disabled={loadingCampaignGroups}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      loadingCampaignGroups ? "animate-spin" : ""
                    }`}
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
                  {loadingCampaignGroups ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setShowCallModal(true)}
                className="group relative bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                disabled={campaignGroups.length === 0 || loadingAgents}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
                    <FiPhone
                      className="w-6 h-6 text-green-700"
                      style={{ minWidth: "24px", minHeight: "24px" }}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Make Calls</div>
                    <div className="text-sm opacity-90">
                      Start campaign calling
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowCallDetailsModal(true);
                  fetchCampaignCallLogs(1);
                }}
                className="group relative bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                disabled={!campaign}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
                    <FiBarChart2
                      className="w-6 h-6 text-purple-700"
                      style={{ minWidth: "24px", minHeight: "24px" }}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Call Details</div>
                    <div className="text-sm opacity-90">View call logs</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowContactsModal(true);
                  fetchCampaignContacts();
                }}
                className="group relative bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                disabled={!campaign}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
                    <FiUsers
                      className="w-6 h-6 text-orange-700"
                      style={{ minWidth: "24px", minHeight: "24px" }}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Manage Contacts</div>
                    <div className="text-sm opacity-90">Add, sync, remove</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowAddGroupsModal(true)}
                className="group relative bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
                    <FiPlus
                      className="w-6 h-6 text-blue-700"
                      style={{ minWidth: "24px", minHeight: "24px" }}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Add Groups</div>
                    <div className="text-sm opacity-90">Include new groups</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Campaign Groups Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Campaign Groups
                </h2>
                <p className="text-gray-600 mt-1">
                  Groups and contacts associated with this campaign
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {campaignGroups.length}
                </div>
                <div className="text-sm text-gray-500">Total Groups</div>
              </div>
            </div>

            {loadingCampaignGroups ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-gray-500 mt-4 text-lg">
                  Loading campaign groups...
                </p>
              </div>
            ) : campaignGroups.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <FiUsers className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No groups in campaign
                </h3>
                <p className="text-gray-500 mb-6">
                  This campaign doesn't have any groups yet. Add groups to get
                  started.
                </p>
                <button
                  onClick={() => setShowAddGroupsModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add Your First Group
                </button>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">
                          Total Groups
                        </p>
                        <p className="text-3xl font-bold text-blue-900">
                          {campaignGroups.length}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">
                          Total Contacts
                        </p>
                        <p className="text-3xl font-bold text-green-900">
                          {campaignGroups.reduce(
                            (total, group) =>
                              total + (group.contacts?.length || 0),
                            0
                          )}
                        </p>
                      </div>
                      <div className="p-3 bg-green-500 rounded-lg">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">
                          Active Groups
                        </p>
                        <p className="text-3xl font-bold text-purple-900">
                          {
                            campaignGroups.filter(
                              (group) =>
                                group.contacts && group.contacts.length > 0
                            ).length
                          }
                        </p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-lg">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaignGroups.map((group) => (
                    <div
                      key={group._id}
                      className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {group.description}
                            </p>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            {group.contacts?.length || 0} contacts
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveGroup(group._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                          disabled={loading}
                          title="Remove from campaign"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Make Calls Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 call-modal">
          <div className="bg-white rounded-2xl w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Make Calls to Campaign Groups
                </h3>
                <p className="text-gray-600 mt-1">
                  Automate your campaign calling process
                </p>
              </div>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowCallModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="p-6">
              {/* Agent Selection */}
              {!selectedAgent && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Select an Agent
                  </h4>
                  {loadingAgents ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="text-gray-500 mt-4 text-lg">
                        Loading agents...
                      </p>
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <h5 className="text-lg font-medium text-gray-900 mb-2">
                        No agents available
                      </h5>
                      <p className="text-gray-500">
                        Please create agents before starting calls
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {agents.map((agent) => (
                        <div
                          key={agent._id}
                          className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                          onClick={() => setSelectedAgent(agent)}
                        >
                          <div className="flex items-center mb-4">
                            <div className="p-3 bg-blue-100 rounded-lg mr-4 group-hover:bg-blue-200 transition-colors duration-200">
                              <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                {agent.agentName}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {agent.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            Click to select this agent
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Calling Interface */}
              {selectedAgent && (
                <div>
                  <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                          <svg
                            className="w-6 h-6 mr-2 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Selected Agent: {selectedAgent.agentName}
                        </h4>
                        <p className="text-gray-700">
                          {selectedAgent.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedAgent(null)}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-lg transition-colors duration-200"
                      >
                        Change Agent
                      </button>
                    </div>
                  </div>

                  {/* Campaign Overview */}
                  <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Campaign Overview
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {campaignGroups.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          Campaign Groups
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {campaignGroups.reduce(
                            (total, group) =>
                              total + (group.contacts?.length || 0),
                            0
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Contacts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {campaignGroups[currentGroupIndex]?.name || "None"}
                        </div>
                        <div className="text-sm text-gray-600">
                          Current Group
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 capitalize">
                          {callingStatus}
                        </div>
                        <div className="text-sm text-gray-600">Status</div>
                      </div>
                    </div>
                  </div>

                  {/* Call Progress */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xl font-semibold text-gray-800 flex items-center">
                        <svg
                          className="w-6 h-6 mr-2 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Call Progress
                      </h4>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">
                          Group {currentGroupIndex + 1} of{" "}
                          {campaignGroups.length} (
                          {campaignGroups[currentGroupIndex]?.name || "Unknown"}
                          )
                        </div>
                        <div className="text-sm text-gray-600">
                          Contact {currentContactIndex + 1} of{" "}
                          {campaignGroups[currentGroupIndex]?.contacts
                            ?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
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
                        <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 mb-6">
                          <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <svg
                              className="w-5 h-5 mr-2 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            Currently Calling
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Name</div>
                              <div className="font-semibold text-gray-900">
                                {campaignGroups[currentGroupIndex]?.contacts?.[
                                  currentContactIndex
                                ]?.name || "Unknown"}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Phone</div>
                              <div className="font-semibold text-gray-900">
                                {campaignGroups[currentGroupIndex]?.contacts?.[
                                  currentContactIndex
                                ]?.phone || "Unknown"}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Group</div>
                              <div className="font-semibold text-gray-900">
                                {campaignGroups[currentGroupIndex]?.name ||
                                  "Unknown"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Control Buttons */}
                    <div className="flex gap-4 justify-center">
                      {callingStatus === "idle" && (
                        <button
                          onClick={startCalling}
                          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          <FiPlay className="w-5 h-5 mr-2" />
                          Start Calling
                        </button>
                      )}

                      {callingStatus === "calling" && (
                        <>
                          <button
                            onClick={pauseCalling}
                            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-lg font-semibold rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            <FiPause className="w-5 h-5 mr-2" />
                            Pause
                          </button>
                          <button
                            onClick={skipToNext}
                            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            <FiSkipForward className="w-5 h-5 mr-2" />
                            Skip
                          </button>
                        </>
                      )}

                      {callingStatus === "paused" && (
                        <button
                          onClick={resumeCalling}
                          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          <FiPlay className="w-5 h-5 mr-2" />
                          Resume
                        </button>
                      )}

                      {(callingStatus === "completed" ||
                        callingStatus === "paused") && (
                        <button
                          onClick={resetCalling}
                          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-lg font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Call Results */}
                  {callResults.length > 0 && (
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <svg
                          className="w-6 h-6 mr-2 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Call Results
                      </h4>
                      <div className="max-h-80 overflow-y-auto space-y-3">
                        {callResults.map((result, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-xl border-2 ${
                              result.success
                                ? "bg-green-50 border-green-200"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h6 className="font-semibold text-gray-800 mb-1">
                                  {result.contact.name}
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">
                                      Phone:
                                    </span>
                                    <div className="font-medium">
                                      {result.contact.phone}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Group:
                                    </span>
                                    <div className="font-medium">
                                      {result.group?.name || "Unknown"}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Time:</span>
                                    <div className="font-medium">
                                      {result.timestamp.toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    result.success
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {result.success ? "Success" : "Failed"}
                                </span>
                              </div>
                            </div>
                            {result.error && (
                              <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                <p className="text-sm text-red-700">
                                  <span className="font-semibold">Error:</span>{" "}
                                  {result.error}
                                </p>
                              </div>
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

      {/* Call Details Modal */}
      {showCallDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Call Details</h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowCallDetailsModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {callDetailsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-500 mt-2">Loading call logs...</p>
                </div>
              ) : callDetails.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
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

      {/* Campaign Contacts Management Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">
                Manage Campaign Contacts
              </h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowContactsModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Contact
                </button>
                <button
                  onClick={syncContactsFromGroups}
                  disabled={loadingContacts}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingContacts ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FiUsers className="w-4 h-4" />
                  )}
                  Sync from Groups
                </button>
                <button
                  onClick={fetchCampaignContacts}
                  disabled={loadingContacts}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
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

              {/* Contacts List */}
              {loadingContacts ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-500 mt-2">Loading contacts...</p>
                </div>
              ) : campaignContacts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h5 className="text-lg font-medium text-gray-600 mb-2">
                    No contacts in campaign
                  </h5>
                  <p className="text-gray-500">
                    Add contacts manually or sync from groups to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaignContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">Name</div>
                              <div className="font-semibold">
                                {contact.name}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Phone</div>
                              <div className="font-medium">{contact.phone}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Email</div>
                              <div className="font-medium">
                                {contact.email || "-"}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Added:{" "}
                            {new Date(contact.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() =>
                              removeContactFromCampaign(contact._id)
                            }
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">
                Add Contact to Campaign
              </h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowAddContactModal(false)}
              >
                <FiX />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addContactToCampaign();
              }}
              className="p-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phone: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingContacts}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loadingContacts ? "Adding..." : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Groups Modal */}
      {showAddGroupsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl add-groups-modal">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">
                Add Groups to Campaign
              </h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
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
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
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
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
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
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
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
    </div>
  );
}

export default CampaignDetails;
