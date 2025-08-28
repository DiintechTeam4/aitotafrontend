import { useState, useEffect, useRef, useMemo } from "react";
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
  FiUser,
  FiBarChart2,
  FiUserPlus,
  FiFolder,
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
  // Cache for fetching single agent by id when not present in agents list
  const [agentMap, setAgentMap] = useState({});

  // Utility: robustly extract assigned agent id and optional name from various shapes
  const getPrimaryAgentIdentity = () => {
    // Case 1: campaign.agent is an array [id | object]
    if (Array.isArray(campaign?.agent) && campaign.agent.length > 0) {
      const raw = campaign.agent[0];
      if (typeof raw === "string") return { id: raw, immediateName: "" };
      const id = raw?._id || raw?.id || raw?.agentId || null;
      const immediateName =
        raw?.name || raw?.fullName || raw?.agentName || raw?.email || "";
      return { id, immediateName };
    }

    // Case 2: campaign.agent is a single id string or object
    if (campaign?.agent && !Array.isArray(campaign.agent)) {
      if (typeof campaign.agent === "string") {
        return { id: campaign.agent, immediateName: "" };
      }
      const id = campaign.agent?._id || campaign.agent?.id || null;
      const immediateName =
        campaign.agent?.name ||
        campaign.agent?.fullName ||
        campaign.agent?.agentName ||
        campaign.agent?.email ||
        "";
      return { id, immediateName };
    }

    // Case 3: alternative fields commonly used
    const alt =
      campaign?.agentId || campaign?.assignedAgent || campaign?.agent_id;
    if (alt) {
      if (typeof alt === "string") return { id: alt, immediateName: "" };
      const id = alt?._id || alt?.id || alt?.agentId || null;
      const immediateName =
        alt?.name || alt?.fullName || alt?.agentName || alt?.email || "";
      return { id, immediateName };
    }

    return { id: null, immediateName: "" };
  };
  const [selectedAgent, setSelectedAgent] = useState(null);

  const [showCallModal, setShowCallModal] = useState(false);
  const [callingStatus, setCallingStatus] = useState("idle"); // idle, calling, paused, completed
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [callResults, setCallResults] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false); // Prevent multiple simultaneous start calls
  const [campaignGroups, setCampaignGroups] = useState([]);
  const [loadingCampaignGroups, setLoadingCampaignGroups] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAddGroupsModal, setShowAddGroupsModal] = useState(false);
  // Add Agent modal
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [selectedAgentIdForAssign, setSelectedAgentIdForAssign] = useState("");
  // Backend start/stop calling toggle state
  const [isTogglingCampaign, setIsTogglingCampaign] = useState(false);
  // Insufficient credits modal
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  // Minimal leads list and transcript
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotalPages, setLeadsTotalPages] = useState(0);
  const [leadsTotalItems, setLeadsTotalItems] = useState(0);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [transcriptDocId, setTranscriptDocId] = useState(null);
  const [transcriptContent, setTranscriptContent] = useState("");
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  // Missed calls
  const [missedCalls, setMissedCalls] = useState([]);
  const [missedLoading, setMissedLoading] = useState(false);
  const [callFilter, setCallFilter] = useState("all"); // all | connected | missed
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

  // Live call logs states
  const [selectedCall, setSelectedCall] = useState(null);
  const [showLiveCallModal, setShowLiveCallModal] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveTranscriptLines, setLiveTranscriptLines] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [liveCallDetails, setLiveCallDetails] = useState(null);
  const [callConnectionStatus, setCallConnectionStatus] = useState("connected"); // connected, not_connected
  const [callResultsConnectionStatus, setCallResultsConnectionStatus] =
    useState({}); // Track connection status for each call result
  const logsPollRef = useRef(null);
  const transcriptRef = useRef(null);
  const connectionTimeoutRef = useRef(null);

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
  const [showRestoreNotification, setShowRestoreNotification] = useState(false);

  // Build a merged list of calls: recent leads + missed calls, sorted by time desc
  const mergedCalls = useMemo(() => {
    const toTimestamp = (value) => {
      if (!value) return 0;
      const t = new Date(value).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const normalizedLeads = (leads || []).map((lead) => ({
      key: lead.documentId || `${lead.number || "-"}-${lead.time || ""}`,
      time: lead.time || null,
      name: lead.name || "-",
      number: lead.number || "-",
      status: (lead.status || "").toLowerCase(),
      isMissed: false,
      documentId: lead.documentId || null,
    }));

    const normalizedMissed = (missedCalls || []).map((item, idx) => ({
      key: `missed-${item.uniqueId || idx}`,
      time: item.time || item.createdAt || null,
      name: item.contact?.name || "-",
      number: item.contact?.phone || "-",
      status: "missed",
      isMissed: true,
      documentId: null,
    }));

    return [...normalizedLeads, ...normalizedMissed].sort(
      (a, b) => toTimestamp(b.time) - toTimestamp(a.time)
    );
  }, [leads, missedCalls]);
  // Tracks whether calling state was restored from storage to gate auto-resume
  const restoredFromStorageRef = useRef(false);

  // API base URL
  const API_BASE = `${API_BASE_URL}/client`;

  // State persistence functions
  const getStorageKey = (key) => `campaign_${campaignId}_${key}`;

  const saveCallingState = () => {
    const state = {
      showCallModal,
      callingStatus,
      currentContactIndex,
      callResults,
      selectedAgent,
      callResultsConnectionStatus,
      timestamp: Date.now(),
    };
    localStorage.setItem(getStorageKey("callingState"), JSON.stringify(state));
  };

  const loadCallingState = () => {
    try {
      const saved = localStorage.getItem(getStorageKey("callingState"));
      if (saved) {
        const state = JSON.parse(saved);
        // Only restore if the saved state is less than 24 hours old
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          setShowCallModal(state.showCallModal || false);
          setCallingStatus(state.callingStatus || "idle");
          setCurrentContactIndex(state.currentContactIndex || 0);

          // Convert timestamp strings back to Date objects in callResults
          const restoredCallResults = (state.callResults || []).map(
            (result) => ({
              ...result,
              timestamp: new Date(result.timestamp),
            })
          );
          setCallResults(restoredCallResults);

          // Restore connection status for call results
          if (state.callResultsConnectionStatus) {
            setCallResultsConnectionStatus(state.callResultsConnectionStatus);
          }

          setSelectedAgent(state.selectedAgent || null);
          // Mark that we restored from storage; used to gate auto-resume
          restoredFromStorageRef.current = true;
          return true;
        } else {
          // Clear old state
          localStorage.removeItem(getStorageKey("callingState"));
        }
      }
    } catch (error) {
      console.error("Error loading calling state:", error);
    }
    return false;
  };

  const clearCallingState = () => {
    localStorage.removeItem(getStorageKey("callingState"));
  };

  // Utility function to safely format timestamps
  const safeFormatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown";
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Error";
    }
  };

  // Function to check connection status for a specific call result
  const checkCallResultConnection = async (uniqueId, resultIndex) => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE_URL}/logs?uniqueid=${uniqueId}&limit=1`,
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

      if (result.logs && result.logs.length > 0) {
        // Found logs, mark as connected
        setCallResultsConnectionStatus((prev) => ({
          ...prev,
          [uniqueId]: "connected",
        }));
      } else {
        // No logs found, mark as not connected
        setCallResultsConnectionStatus((prev) => ({
          ...prev,
          [uniqueId]: "not_connected",
        }));
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      // On error, mark as not connected
      setCallResultsConnectionStatus((prev) => ({
        ...prev,
        [uniqueId]: "not_connected",
      }));
    }
  };

  const manualSaveState = () => {
    saveCallingState();
    // Show a temporary success message
    const saveButton = document.querySelector(
      '[title="Manually save your calling progress"]'
    );
    if (saveButton) {
      const originalText = saveButton.innerHTML;
      saveButton.innerHTML = `
        <svg class="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Saved!
      `;
      saveButton.className =
        "inline-flex items-center px-4 py-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg transition-all duration-200";

      setTimeout(() => {
        saveButton.innerHTML = originalText;
        saveButton.className =
          "inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200";
      }, 2000);
    }
  };

  // Save state whenever calling-related states change
  useEffect(() => {
    if (campaignId) {
      saveCallingState();
    }
  }, [
    showCallModal,
    callingStatus,
    currentContactIndex,
    callResults,
    selectedAgent,
    callResultsConnectionStatus,
    campaignId,
  ]);

  useEffect(() => {
    fetchCampaignDetails();
    fetchAvailableGroups();
    fetchAgents();
    fetchClientData();
    fetchCampaignGroups();
    // Also load leads list initially
    fetchLeads(1);
    fetchMissedCalls();
  }, [campaignId]);

  // Ensure agent name is resolved when campaign agent changes
  useEffect(() => {
    const resolve = async () => {
      const { id, immediateName } = getPrimaryAgentIdentity();
      if (!id) return;
      if (immediateName && !agentMap[id]) {
        setAgentMap((m) => ({ ...m, [id]: immediateName }));
      }
      if (!agentMap[id]) {
        const name = await getAgentNameById(id);
        setAgentMap((m) => ({ ...m, [id]: name }));
      }
    };
    resolve();
  }, [campaign?.agent]);

  // Fetch campaign contacts when campaign data is available
  useEffect(() => {
    if (campaign?._id) {
      fetchCampaignContacts();
    }
  }, [campaign]);

  // Load calling state when campaign contacts are available
  useEffect(() => {
    if (campaignContacts.length > 0 && campaignId) {
      const hasRestoredState = loadCallingState();
      if (hasRestoredState && callingStatus === "calling") {
        // If we restored a calling state, show a notification
        setShowRestoreNotification(true);
        // Auto-hide notification after 5 seconds
        setTimeout(() => setShowRestoreNotification(false), 5000);
      }
    }
  }, [campaignContacts, campaignId]);

  // Auto-resume calling ONLY if restored from storage (not on manual start)
  useEffect(() => {
    if (
      restoredFromStorageRef.current &&
      callingStatus === "calling" &&
      campaignContacts.length > 0 &&
      selectedAgent &&
      !isStartingCall
    ) {
      const timer = setTimeout(() => {
        // Reset the flag so this runs only once after restore
        restoredFromStorageRef.current = false;
        if (callingStatus === "calling") {
          console.log("Auto-resuming calling session after restore...");
          resumeCalling();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [callingStatus, campaignContacts, selectedAgent, isStartingCall]);

  // Check connection status for call results after 40 seconds AND automatically update campaign status
  useEffect(() => {
    callResults.forEach((result, index) => {
      if (result.success && result.uniqueId) {
        // Set initial status as connected
        setCallResultsConnectionStatus((prev) => ({
          ...prev,
          [result.uniqueId]: "connected",
        }));

        // Check connection status after 40 seconds
        const timer = setTimeout(async () => {
          await checkCallResultConnection(result.uniqueId, index);

          // AUTOMATIC: Also update campaign status after checking connection
          if (campaign?._id) {
            console.log(
              `Automatically updating campaign status for ${result.uniqueId} after connection check...`
            );
            updateCallStatus(result.uniqueId);
          }
        }, 40000);

        // Cleanup timer on unmount
        return () => clearTimeout(timer);
      }
    });
  }, [callResults, campaign?._id]);

  // Debug: Monitor callResults changes to identify duplicates
  useEffect(() => {
    if (callResults.length > 0) {
      console.log("CallResults changed:", callResults.length, "results");

      // Check for duplicates
      const contactCounts = {};
      callResults.forEach((result) => {
        const contactKey = `${result.contact.phone}-${result.contact.name}`;
        contactCounts[contactKey] = (contactCounts[contactKey] || 0) + 1;
      });

      const duplicates = Object.entries(contactCounts).filter(
        ([key, count]) => count > 1
      );
      if (duplicates.length > 0) {
        console.warn("Duplicate call results detected:", duplicates);
        duplicates.forEach(([contactKey, count]) => {
          console.warn(`Contact ${contactKey} has ${count} call results`);
        });
      }
    }
  }, [callResults]);

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

  // Resolve agent name by id using cached list or fetch single agent
  const getAgentNameById = async (agentId) => {
    if (!agentId) return "";
    // Try local cache map
    if (agentMap[agentId]) {
      return agentMap[agentId];
    }
    // Try existing agents list
    const found = (agents || []).find((a) => a._id === agentId);
    if (found) {
      const name =
        found.name ||
        found.fullName ||
        found.email ||
        String(agentId).slice(0, 6);
      setAgentMap((m) => ({ ...m, [agentId]: name }));
      return name;
    }
    // Fetch single agent from lightweight API
    try {
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(`${API_BASE}/agents/${agentId}/name`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await resp.json();
      if (resp.ok && result?.data) {
        const name = result.data.name || String(agentId).slice(0, 6);
        setAgentMap((m) => ({ ...m, [agentId]: name }));
        return name;
      }
    } catch (e) {
      console.error("Failed to fetch agent by id", e);
    }
    // Fallback: try public agent endpoint without client scoping
    try {
      const resp2 = await fetch(`${API_BASE}/agents/${agentId}/public`);
      const result2 = await resp2.json();
      if (resp2.ok && result2?.data) {
        const agent = result2.data;
        const name =
          agent.name ||
          agent.fullName ||
          agent.agentName ||
          agent.email ||
          String(agentId).slice(0, 6);
        setAgentMap((m) => ({ ...m, [agentId]: name }));
        return name;
      }
    } catch (e) {
      console.error("Failed to fetch public agent by id", e);
    }
    return String(agentId).slice(0, 6);
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
      // Use performance.now() for higher precision and add a counter to ensure uniqueness
      const uniqueId = `aidial-${Date.now()}-${performance
        .now()
        .toString(36)
        .replace(".", "")}-${Math.random().toString(36).substr(2, 9)}`;

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
            body: JSON.stringify({
              uniqueId,
              contactId: contact._id || null, // Include contactId if available
            }),
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
        timestamp: new Date(),
        uniqueId: uniqueId, // Include unique ID in result for tracking
      };
    } catch (error) {
      console.error("Error making voice bot call:", error);
      return {
        success: false,
        error: error.message,
        contact: contact,
        timestamp: new Date(),
        uniqueId: uniqueId, // Include unique ID even for failed calls
      };
    }
  };

  const startCalling = async () => {
    // Prevent multiple simultaneous calls
    if (callingStatus === "calling" || isStartingCall) {
      console.log(
        "Calling already in progress or starting, ignoring duplicate start request"
      );
      return;
    }

    if (!selectedAgent || campaignContacts.length === 0) {
      alert(
        "Please select an agent and ensure there are contacts in the campaign. Add contacts through 'Manage Contacts' first."
      );
      return;
    }

    setIsStartingCall(true);

    console.log("Starting calling process...");
    console.log("Current callResults before starting:", callResults);

    setCallingStatus("calling");
    setCurrentContactIndex(0);

    // Don't clear existing results - keep them to prevent duplicates
    // setCallResults([]); // Removed this line to prevent duplicate calls

    // Track contacts that have been called in this session
    const calledContacts = new Set();

    // Remove duplicates from campaignContacts to prevent duplicate calls
    const uniqueContacts = campaignContacts.filter(
      (contact, index, self) =>
        index ===
        self.findIndex(
          (c) => c.phone === contact.phone && c.name === contact.name
        )
    );

    console.log(
      `Original contacts: ${campaignContacts.length}, Unique contacts: ${uniqueContacts.length}`
    );

    // Loop through all campaign contacts
    for (let contactIdx = 0; contactIdx < uniqueContacts.length; contactIdx++) {
      if (callingStatus === "paused") {
        break;
      }

      setCurrentContactIndex(contactIdx);
      const contact = uniqueContacts[contactIdx];

      // Create a unique key for this contact
      const contactKey = `${contact.phone}-${contact.name}`;

      // Check if this contact was already called in this session or in previous results
      const alreadyCalledInSession = calledContacts.has(contactKey);
      const alreadyCalledInResults = callResults.some(
        (r) =>
          r.contact.phone === contact.phone && r.contact.name === contact.name
      );

      // Additional check: if the same contact was called very recently (within 30 seconds), skip it
      const recentCall = callResults.find(
        (r) =>
          r.contact.phone === contact.phone &&
          r.contact.name === contact.name &&
          r.timestamp &&
          Date.now() - new Date(r.timestamp).getTime() < 30000 // 30 seconds
      );

      if (alreadyCalledInSession || alreadyCalledInResults || recentCall) {
        console.log(
          `Contact ${contact.name} (${contact.phone}) already called or called recently, skipping...`
        );
        continue;
      }

      console.log(
        `Calling ${contact.name} at ${contact.phone} from campaign contacts...`
      );

      // Mark this contact as called
      calledContacts.add(contactKey);

      console.log(
        `Making voice bot call to ${contact.name} (${contact.phone})...`
      );
      const result = await makeVoiceBotCall(contact, selectedAgent);
      console.log(`Call result for ${contact.name}:`, result);

      // Add the call result
      setCallResults((prev) => {
        console.log(
          `Adding new call result for ${contact.name}. Previous count: ${prev.length}`
        );
        return [...prev, result];
      });

      // Wait 2 seconds between calls to avoid overwhelming the API
      if (contactIdx < uniqueContacts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Additional safeguard: wait 1 second after each call to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("Calling process completed. Final callResults:", callResults);

    // AUTOMATIC: Update all call statuses when calling process completes
    if (campaign?._id) {
      console.log(
        "Calling process completed, automatically updating all call statuses..."
      );
      callResults.forEach((result) => {
        if (result.uniqueId) {
          updateCallStatus(result.uniqueId);
        }
      });
    }

    setCallingStatus("completed");
    setIsStartingCall(false);
  };

  const pauseCalling = () => {
    setCallingStatus("paused");
    console.log("Calling paused - state will persist across page reloads");
  };

  const resumeCalling = async () => {
    setCallingStatus("calling");

    // Track contacts that have been called in this session
    const calledContacts = new Set();

    // Resume from current contact index
    for (
      let contactIdx = currentContactIndex;
      contactIdx < campaignContacts.length;
      contactIdx++
    ) {
      if (callingStatus === "paused") {
        break;
      }

      setCurrentContactIndex(contactIdx);
      const contact = campaignContacts[contactIdx];

      // Create a unique key for this contact
      const contactKey = `${contact.phone}-${contact.name}`;

      // Check if this contact was already called in this session or in previous results
      const alreadyCalledInSession = calledContacts.has(contactKey);
      const alreadyCalledInResults = callResults.some(
        (r) =>
          r.contact.phone === contact.phone && r.contact.name === contact.name
      );

      // Additional check: if the same contact was called very recently (within 30 seconds), skip it
      const recentCall = callResults.find(
        (r) =>
          r.contact.phone === contact.phone &&
          r.contact.name === contact.name &&
          r.timestamp &&
          Date.now() - new Date(r.timestamp).getTime() < 30000 // 30 seconds
      );

      if (alreadyCalledInSession || alreadyCalledInResults || recentCall) {
        console.log(
          `Contact ${contact.name} (${contact.phone}) already called or called recently, skipping...`
        );
        continue;
      }

      console.log(
        `Calling ${contact.name} at ${contact.phone} from campaign contacts...`
      );

      // Mark this contact as called
      calledContacts.add(contactKey);

      const result = await makeVoiceBotCall(contact, selectedAgent);
      setCallResults((prev) => [...prev, result]);

      // Wait 2 seconds between calls
      if (contactIdx < campaignContacts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Additional safeguard: wait 1 second after each call to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setCallingStatus("completed");
  };

  const skipToNext = () => {
    if (currentContactIndex < campaignContacts.length - 1) {
      setCurrentContactIndex((prev) => prev + 1);
    }
  };

  const resetCalling = () => {
    setCallingStatus("idle");
    setCurrentContactIndex(0);
    setCallResults([]);
    setCallResultsConnectionStatus({}); // Clear connection status
    clearCallingState(); // Clear saved state when resetting
    console.log("Calling reset - all progress cleared");
  };

  // Function to remove duplicate call results
  const removeDuplicateCallResults = () => {
    setCallResults((prev) => {
      const uniqueResults = [];
      const seenContacts = new Set();

      prev.forEach((result) => {
        const contactKey = `${result.contact.phone}-${result.contact.name}`;
        if (!seenContacts.has(contactKey)) {
          seenContacts.add(contactKey);
          uniqueResults.push(result);
        } else {
          console.log(
            `Removing duplicate call result for ${result.contact.name}`
          );
        }
      });

      console.log(
        `Cleaned up call results: ${prev.length} -> ${uniqueResults.length}`
      );
      return uniqueResults;
    });
  };

  // Function to update call status based on isActive from external service
  const updateCallStatus = async (uniqueId) => {
    try {
      if (!campaign?._id) return;

      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/call-status/${uniqueId}/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        console.log(`Call status updated for ${uniqueId}:`, result.data);
        // Refresh campaign data to get updated status
        fetchCampaignDetails();
      }
    } catch (error) {
      console.error("Error updating call status:", error);
    }
  };

  // Get current progress
  const getProgress = () => {
    const totalContacts = campaignContacts.length;
    const completedContacts = currentContactIndex;

    // If we're at the last contact, mark as fully completed
    if (currentContactIndex >= totalContacts) {
      return { completed: totalContacts, total: totalContacts };
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
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
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
        `${API_BASE}/campaigns/${
          campaign._id
        }/call-logs-dashboard?${params.toString()}`,
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

  // Fetch minimal leads list for this campaign
  const fetchLeads = async (page = 1) => {
    try {
      if (!campaignId) return;
      setLeadsLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(25),
      });
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaignId}/leads?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        throw new Error(result.error || "Failed to fetch leads");
      }
      setLeads(result.data || []);
      setLeadsPage(result.pagination?.currentPage || page);
      setLeadsTotalPages(result.pagination?.totalPages || 0);
      setLeadsTotalItems(result.pagination?.totalItems || 0);
    } catch (e) {
      console.error("Error fetching leads:", e);
      setLeads([]);
      setLeadsPage(1);
      setLeadsTotalPages(0);
      setLeadsTotalItems(0);
    } finally {
      setLeadsLoading(false);
    }
  };

  // Open transcript modal and fetch transcript by documentId
  const openTranscript = async (documentId) => {
    try {
      if (!campaignId || !documentId) return;
      setTranscriptDocId(documentId);
      setTranscriptContent("");
      setTranscriptLoading(true);
      setShowTranscriptModal(true);
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaignId}/logs/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        throw new Error(result.error || "Failed to fetch transcript");
      }
      setTranscriptContent(result.transcript || "");
    } catch (e) {
      console.error("Error fetching transcript:", e);
      setTranscriptContent("");
    } finally {
      setTranscriptLoading(false);
    }
  };

  // Open transcript intelligently: if call is ongoing and we have uniqueId, show live logs; else load saved transcript
  const openTranscriptSmart = async (lead) => {
    try {
      const status = (lead.status || lead.leadStatus || "").toLowerCase();
      const uniqueId =
        lead.uniqueId || lead.metadata?.customParams?.uniqueid || null;

      if (status === "ongoing" && uniqueId) {
        setShowCallModal(true);
        // Seed selected call context for details panel
        setSelectedCall(
          lead.metadata ? { ...lead, metadata: lead.metadata } : { ...lead }
        );
        await startLiveCallPolling(uniqueId);
        return;
      }

      if (lead.documentId) {
        await openTranscript(lead.documentId);
      }
    } catch (e) {
      console.error("Failed to open transcript smartly:", e);
    }
  };

  // Fetch missed calls: uniqueIds in campaign.details that have no CallLog
  const fetchMissedCalls = async () => {
    try {
      if (!campaignId) return;
      setMissedLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaignId}/missed-calls`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        throw new Error(result.error || "Failed to fetch missed calls");
      }
      setMissedCalls(result.data || []);
    } catch (e) {
      console.error("Error fetching missed calls:", e);
      setMissedCalls([]);
    } finally {
      setMissedLoading(false);
    }
  };

  // Fetch campaign calling status and progress
  const fetchCampaignCallingStatus = async () => {
    try {
      if (!campaignId) return;
      const token = sessionStorage.getItem("clienttoken");
      const response = await fetch(
        `${API_BASE}/campaigns/${campaignId}/calling-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Update campaign status if it's running
          if (result.data.isRunning !== campaign?.isRunning) {
            setCampaign((prev) =>
              prev ? { ...prev, isRunning: result.data.isRunning } : null
            );
          }

          // Update calling status based on backend data
          if (result.data.progress) {
            const progress = result.data.progress;
            if (progress.totalContacts > 0) {
              // Calculate percentage and update calling status
              const completedPercentage =
                (progress.completedCalls / progress.totalContacts) * 100;

              if (completedPercentage === 100) {
                setCallingStatus("completed");
              } else if (progress.isRunning) {
                setCallingStatus("calling");
              } else if (progress.isPaused) {
                setCallingStatus("paused");
              }

              // Update current contact index if available
              if (progress.currentContactIndex !== undefined) {
                setCurrentContactIndex(progress.currentContactIndex);
              }
            }
          }

          // Update last updated timestamp
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error("Error fetching campaign calling status:", error);
    }
  };

  // Call again: dial only the missed calls' contacts
  const callMissedCalls = async () => {
    try {
      if (!selectedAgent) {
        alert("Please select an agent first (top Make Calls card).");
        return;
      }
      const retryContacts = (missedCalls || [])
        .map((m) => m.contact)
        .filter((c) => c && c.phone);
      if (retryContacts.length === 0) {
        alert("No retriable missed contacts found.");
        return;
      }

      setCallingStatus("calling");

      // Deduplicate by phone+name and avoid very recent calls (30s)
      const seen = new Set();
      for (let idx = 0; idx < retryContacts.length; idx++) {
        const contact = retryContacts[idx];
        const key = `${contact.phone}-${contact.name || ""}`;
        if (seen.has(key)) continue;
        const recent = callResults.find(
          (r) =>
            r.contact?.phone === contact.phone &&
            r.timestamp &&
            Date.now() - new Date(r.timestamp).getTime() < 30000
        );
        if (recent) continue;
        seen.add(key);

        const result = await makeVoiceBotCall(contact, selectedAgent);
        setCallResults((prev) => [...prev, result]);

        // small pacing like startCalling
        if (idx < retryContacts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // After retries, update statuses like elsewhere
      if (campaign?._id) {
        callResults.forEach((result) => {
          if (result.uniqueId) {
            updateCallStatus(result.uniqueId);
          }
        });
      }

      // Refresh lists
      fetchLeads(1);
      fetchMissedCalls();

      setCallingStatus("completed");
    } catch (e) {
      console.error("Error calling missed contacts:", e);
      setCallingStatus("paused");
    }
  };

  // Retry a single lead (row) via backend single-call API
  const handleRetryLead = async (lead) => {
    try {
      const phone = (lead.number || "").toString().trim();
      if (!phone) return;

      const { id: primaryAgentId } = getPrimaryAgentIdentity();
      if (!primaryAgentId) {
        alert("Please add/select an agent for this campaign first.");
        return;
      }

      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(`${API_BASE}/calls/single`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: {
            name: lead.name || "",
            phone,
            contactId: lead._id || lead.contactId || null,
          },
          agentId: primaryAgentId,
          campaignId: campaign?._id || null,
        }),
      });
      // Handle insufficient credits with modal
      if (resp.status === 402) {
        setShowCreditsModal(true);
        return;
      }
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        throw new Error(result.error || "Failed to initiate call");
      }
      // Success feedback
      alert(`Calling to ${phone} started successfully`);
      console.log("Single call initiated:", result.data?.uniqueId);
    } catch (e) {
      console.error("Retry call failed:", e);
      alert("Failed to initiate call.");
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

  const syncContactsFromGroups = async (silent = false) => {
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
        if (!silent) {
          alert(
            `Successfully synced ${result.data.totalContacts} contacts from ${result.data.totalGroups} groups`
          );
        }
        fetchCampaignContacts(); // Refresh the contacts list
      } else {
        // If backend reports no groups, treat it as success after last-group deletion
        if (result.error === "No groups in campaign to sync from") {
          await fetchCampaignContacts();
          if (!silent) {
            alert("Contacts cleared because no groups remain in the campaign.");
          }
        } else if (!silent) {
          alert("Failed to sync contacts: " + result.error);
        }
      }
    } catch (error) {
      console.error("Error syncing contacts:", error);
      if (!silent) {
        alert("Error syncing contacts: " + error.message);
      }
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
        // Auto-sync contacts after adding groups (silent)
        await syncContactsFromGroups(true);
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
        // Auto-sync contacts after updating groups (silent)
        await syncContactsFromGroups(true);
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
        const token = sessionStorage.getItem("clienttoken");
        const response = await fetch(
          `${API_BASE}/campaigns/${campaignId}/groups/${groupId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();
        if (result.success) {
          const updatedGroups = campaignGroups.filter(
            (group) => group._id !== groupId
          );
          setCampaign((prev) => ({
            ...prev,
            groupIds: updatedGroups.map((group) => group._id),
          }));
          setCampaignGroups(updatedGroups);
          setSelectedGroups((prev) => prev.filter((id) => id !== groupId));
          // Auto-sync contacts after removing a group (silent). Always run to clear stale contacts when no groups remain
          await syncContactsFromGroups(true);
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

  // Assign agent to campaign (PUT)
  const saveSelectedAgentToCampaign = async () => {
    try {
      if (!campaign?._id || !selectedAgentIdForAssign) return;
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(`${API_BASE}/campaigns/${campaign._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agent: [selectedAgentIdForAssign] }),
      });
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        alert(result.error || "Failed to assign agent");
        return;
      }
      setCampaign(result.data);
      // Optimistically set agent name so UI updates immediately without refresh
      try {
        const picked = (agents || []).find(
          (a) => a._id === selectedAgentIdForAssign
        );
        if (picked) {
          const displayName =
            picked.agentName ||
            picked.name ||
            picked.fullName ||
            picked.email ||
            "";
          if (displayName) {
            setAgentMap((m) => ({
              ...m,
              [selectedAgentIdForAssign]: displayName,
            }));
          }
        } else {
          // Fallback: fetch name via helper
          getAgentNameById(selectedAgentIdForAssign).then((nm) => {
            if (nm) {
              setAgentMap((m) => ({ ...m, [selectedAgentIdForAssign]: nm }));
            }
          });
        }
      } catch (_) {}
      setShowAddAgentModal(false);
      setSelectedAgentIdForAssign("");
      alert("Agent assigned successfully");
    } catch (e) {
      console.error("Assign agent failed:", e);
      alert("Failed to assign agent");
    }
  };

  // Backend start/stop campaign calling (replace frontend calling flow)
  const startCampaignCallingBackend = async () => {
    try {
      if (!campaign?._id) return;
      const primaryAgentId =
        Array.isArray(campaign.agent) && campaign.agent.length > 0
          ? campaign.agent[0]
          : null;
      if (!primaryAgentId) {
        alert("Please add/select an agent for this campaign first.");
        return;
      }
      setIsTogglingCampaign(true);
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/start-calling`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId: primaryAgentId,
            delayBetweenCalls: 2000,
          }),
        }
      );
      const result = await resp.json();
      if (resp.status === 402) {
        setShowCreditsModal(true);
        return;
      }
      if (!resp.ok || result.success === false) {
        alert(result.error || "Failed to start campaign calling");
        return;
      }
      setCampaign((prev) => (prev ? { ...prev, isRunning: true } : prev));
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Start calling failed:", e);
      alert("Failed to start campaign calling");
    } finally {
      setIsTogglingCampaign(false);
    }
  };

  const stopCampaignCallingBackend = async () => {
    try {
      if (!campaign?._id) return;
      setIsTogglingCampaign(true);
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(
        `${API_BASE}/campaigns/${campaign._id}/stop-calling`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await resp.json();
      if (!resp.ok || result.success === false) {
        alert(result.error || "Failed to stop campaign calling");
        return;
      }
      setCampaign((prev) => (prev ? { ...prev, isRunning: false } : prev));
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Stop calling failed:", e);
      alert("Failed to stop campaign calling");
    } finally {
      setIsTogglingCampaign(false);
    }
  };

  const handleToggleCampaignCalling = async () => {
    if (campaign?.isRunning) {
      await stopCampaignCallingBackend();
    } else {
      await startCampaignCallingBackend();
    }
  };

  // Live call logs functions
  const startLiveCallPolling = async (uniqueId) => {
    if (isPolling) {
      stopLiveCallPolling();
    }

    setIsPolling(true);
    setCallConnectionStatus("connected");
    setLiveTranscript("");
    setLiveTranscriptLines([]);
    setLiveCallDetails(null);

    const pollLogs = async () => {
      try {
        console.log("Polling for uniqueId:", uniqueId);
        const apiUrl = `${API_BASE_URL}/logs?uniqueid=${uniqueId}&limit=1`;
        console.log("API URL:", apiUrl);
        const token = sessionStorage.getItem("clienttoken");
        const response = await fetch(
          `${API_BASE_URL}/logs?uniqueid=${uniqueId}&limit=1`,
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
        console.log("Polling response:", result);
        if (result.logs && result.logs.length > 0) {
          const callLog = result.logs[0];
          console.log("Found call log:", callLog);
          setLiveCallDetails(callLog);

          // Check if call is active based on isActive field
          const isCallActiveForStatus = callLog.metadata?.isActive !== false;

          if (isCallActiveForStatus) {
            // Call is active, set connected status
            setCallConnectionStatus("connected");
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
            }

            // Set new timeout for 40 seconds
            connectionTimeoutRef.current = setTimeout(() => {
              console.log(
                "No response for 40 seconds, setting call status to 'not connected'"
              );
              setCallConnectionStatus("not_connected");
            }, 40000);
          } else {
            // Call is not active (isActive is false), set disconnected status
            console.log(
              "Call is not active (isActive: false), setting status to 'not connected'"
            );
            setCallConnectionStatus("not_connected");
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }

            // AUTOMATIC: Update campaign call status when call ends
            if (callLog.metadata?.customParams?.uniqueid) {
              console.log(
                `Call ended for ${callLog.metadata.customParams.uniqueid}, automatically updating campaign status...`
              );
              updateCallStatus(callLog.metadata.customParams.uniqueid);
            }
          }

          if (callLog.transcript) {
            setLiveTranscript(callLog.transcript);

            // Parse transcript lines with timestamps and group by speaker
            const rawLines = callLog.transcript
              .split("\n")
              .filter((line) => line.trim());

            const groupedMessages = [];
            let currentMessage = null;

            for (const line of rawLines) {
              // Extract timestamp from format [2025-08-16T07:20:20.885Z]
              const timestampMatch = line.match(/\[([^\]]+)\]/);
              let timestamp = null;

              if (timestampMatch) {
                try {
                  // Parse the timestamp and format it nicely
                  const date = new Date(timestampMatch[1]);
                  if (!isNaN(date.getTime())) {
                    timestamp = date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    });
                  }
                } catch (error) {
                  console.error("Error parsing timestamp:", error);
                }
              }

              // Remove timestamp from line
              const lineWithoutTimestamp = line.replace(/\[[^\]]+\]\s*/, "");

              // Extract speaker and text
              const colonIndex = lineWithoutTimestamp.indexOf(":");
              if (colonIndex !== -1) {
                const speaker = lineWithoutTimestamp
                  .substring(0, colonIndex)
                  .trim();
                const text = lineWithoutTimestamp
                  .substring(colonIndex + 1)
                  .trim();

                const isAI =
                  speaker.toLowerCase().includes("ai") ||
                  speaker.toLowerCase().includes("agent");
                const isUser =
                  speaker.toLowerCase().includes("user") ||
                  speaker.toLowerCase().includes("customer");

                // If this is a new speaker or first message, start a new message
                if (!currentMessage || currentMessage.speaker !== speaker) {
                  // Save previous message if exists
                  if (currentMessage) {
                    groupedMessages.push(currentMessage);
                  }

                  // Start new message
                  currentMessage = {
                    speaker,
                    text: text,
                    timestamp,
                    isAI,
                    isUser,
                  };
                } else {
                  // Same speaker, append to current message
                  currentMessage.text += " " + text;
                }
              } else {
                // No speaker found, treat as continuation of previous message
                if (currentMessage) {
                  currentMessage.text += " " + lineWithoutTimestamp.trim();
                }
              }
            }

            // Add the last message
            if (currentMessage) {
              groupedMessages.push(currentMessage);
            }

            const lines = groupedMessages;

            setLiveTranscriptLines(lines);

            // Auto-scroll to bottom when new messages are added
            setTimeout(() => {
              if (transcriptRef.current) {
                transcriptRef.current.scrollTop =
                  transcriptRef.current.scrollHeight;
              }
            }, 100);
          }

          // Check if call is still active (not completed and isActive is true)
          const shouldContinuePolling = callLog.metadata?.isActive !== false;
          const isCallCompleted =
            callLog.leadStatus &&
            ["completed", "ended", "failed"].includes(
              callLog.leadStatus.toLowerCase()
            );

          if (shouldContinuePolling && !isCallCompleted) {
            // Continue polling
            logsPollRef.current = setTimeout(pollLogs, 2000);
          } else {
            // Call completed or not active, stop polling
            console.log("Call completed or not active, stopping polling");
            setIsPolling(false);
          }
        } else {
          // No logs found yet, continue polling
          console.log("No call logs found yet, continuing to poll...");
          logsPollRef.current = setTimeout(pollLogs, 2000);
        }
      } catch (error) {
        console.error("Error polling live call logs:", error);
        // Continue polling even on error
        logsPollRef.current = setTimeout(pollLogs, 2000);
      }
    };

    pollLogs();
  };

  const stopLiveCallPolling = () => {
    if (logsPollRef.current) {
      clearTimeout(logsPollRef.current);
      logsPollRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    setIsPolling(false);
    setCallConnectionStatus("connected");
  };

  const handleViewLiveCall = (call) => {
    console.log("Opening live call modal for:", call);
    setSelectedCall(call);
    setShowLiveCallModal(true);

    // Start polling for live logs if uniqueId exists
    if (call.metadata?.customParams?.uniqueid) {
      console.log(
        "Starting live polling for uniqueId:",
        call.metadata.customParams.uniqueid
      );
      startLiveCallPolling(call.metadata.customParams.uniqueid);
    } else {
      console.log("No uniqueId found in call data");
    }
  };

  const closeLiveCallModal = () => {
    setShowLiveCallModal(false);
    setSelectedCall(null);
    stopLiveCallPolling();
    setLiveTranscript("");
    setLiveTranscriptLines([]);
    setLiveCallDetails(null);
    setCallConnectionStatus("connected");
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (logsPollRef.current) {
        clearTimeout(logsPollRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  // Removed periodic auto-refresh of campaign calling status; refresh manually via button

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
                <p className="text-gray-600 mt-1">{campaign.description}</p>
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
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Minimal Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              {/* Run / Stop toggle (small) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleCampaignCalling}
                  disabled={isTogglingCampaign}
                  title={
                    campaign?.isRunning ? "Stop campaign" : "Start campaign"
                  }
                  className={`inline-flex items-center justify-center h-9 p-2 border rounded-md border-gray-200 transition-colors ${
                    isTogglingCampaign
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : campaign?.isRunning
                      ? "bg-red-100 border-red-600 text-red-800 hover:bg-red-100"
                      : "bg-green-100 border-green-600 text-green-800 hover:bg-green-100"
                  }`}
                >
                  {campaign?.isRunning ? (
                    <FiPause className="w-4 h-4" />
                  ) : (
                    <FiPlay className="w-4 h-4" />
                  )}
                  <span className="mx-2 text-lg text-gray-600">
                    {campaign?.isRunning ? "Stop" : "Run"}
                  </span>
                </button>
              </div>

              {/* Add buttons */}

              <div className="flex items-center gap-2">
                <div className="mb-2 text-sm text-gray-700 flex items-center gap-4">
                  {Array.isArray(campaign?.agent) &&
                    campaign.agent.length > 0 && (
                      <span className="items-center gap-1">
                        <span className="text-gray-500">Agent:</span>
                        <span className="font-medium">
                          {(() => {
                            const { id, immediateName } =
                              getPrimaryAgentIdentity();
                            return immediateName || (id ? agentMap[id] : "");
                          })()}
                        </span>
                      </span>
                    )}
                </div>

                <button
                  onClick={() => {
                    setShowAddAgentModal(true);
                    if (!agents || agents.length === 0) {
                      fetchAgents();
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <FiUserPlus className="w-4 h-4 mr-1.5" /> Add Agent
                </button>
              </div>
            </div>
          </div>

          {/* State Restoration Notification */}
          {showRestoreNotification && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 mt-4 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 9a1 1 0 000 2h6a1 1 0 100-2H7zm3 3a1 1 0 000 2H7a1 1 0 100 2h3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Calling session restored!</strong> Your previous
                    calling progress has been loaded. You can continue from
                    where you left off or reset to start fresh.
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setShowRestoreNotification(false)}
                    className="inline-flex text-blue-400 hover:text-blue-500"
                  >
                    <svg
                      className="h-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Small cards for current groups */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium text-gray-900">
                Contact Groups
              </h2>
              <button
                onClick={() => setShowAddGroupsModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FiPlus className="w-4 h-4 mr-1.5" /> Add Group
              </button>
            </div>
            {campaignGroups && campaignGroups.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                {campaignGroups.map((group) => (
                  <div
                    key={`status-chip-${group._id}`}
                    className="inline-flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-800 leading-5">
                        {group.name}
                      </div>
                      <div className="text-xs text-gray-500 leading-4">
                        {group.contacts?.length || 0} contacts
                      </div>
                    </div>
                    <button
                      type="button"
                      title="Remove group"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleRemoveGroup(group._id)}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campaign Progress Section - Always Visible */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-base font-medium text-gray-900">
                  Campaign Status
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    campaign?.isRunning
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-50 text-gray-600 border border-gray-200"
                  }`}
                >
                  {campaign?.isRunning ? "🟢 Running" : "⚪ Not Running"}
                </span>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <button
                  onClick={fetchCampaignCallingStatus}
                  className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-md hover:bg-gray-100 transition-colors border border-gray-200 flex items-center justify-between"
                  title="Refresh status"
                >
                  <svg
                    className="w-3 h-3 mx-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Refersh</span>
                </button>
                {callingStatus !== "idle" && (
                  <button
                    onClick={() => setShowCallModal(true)}
                    className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    View
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {callResults.length || 0} / {campaignContacts.length || 0}
                </div>
                <div className="text-xs text-gray-500">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {leads.filter(
                    (lead) =>
                      lead.status === "completed" || lead.status === "ongoing"
                  ).length || 0}
                </div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {missedCalls.length || 0}
                </div>
                <div className="text-xs text-gray-500">Missed</div>
              </div>
            </div>

            {/* Progress Bar - Always Show */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700">
                  Progress Bar
                </span>
                <span className="text-xs text-gray-500"></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    campaignContacts.length > 0 && callResults.length > 0
                      ? "bg-gradient-to-r from-green-400 to-green-500"
                      : "bg-gray-300"
                  }`}
                  style={{
                    width: `${
                      campaignContacts.length > 0
                        ? Math.max(
                            (callResults.length / campaignContacts.length) *
                              100,
                            0
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Removed live calling UI for frontend-controlled calls */}

            {callingStatus === "paused" && (
              <div className="text-xs text-yellow-700 text-center py-2 bg-yellow-50 rounded-md border border-yellow-200">
                Calling paused - resume anytime
              </div>
            )}

            {callingStatus === "completed" && (
              <div className="text-xs text-blue-700 text-center py-2 bg-blue-50 rounded-md border border-blue-200">
                All calls completed successfully
              </div>
            )}
          </div>

          {/* Minimal Leads + Transcript Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium text-gray-900">
                Recent call logs
              </h2>
              <div className="flex items-center gap-3">
                <button
                  className="inline-flex items-center px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => {
                    fetchCampaignCallLogs(1);
                    fetchLeads(1);
                    fetchMissedCalls();
                  }}
                  title="Refresh call logs"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
                <select
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  value={callFilter}
                  onChange={(e) => setCallFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="connected">Connected</option>
                  <option value="missed">Missed</option>
                </select>
                {callFilter === "missed" && (
                  <button
                    className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    onClick={() => {
                      if (!selectedAgent) {
                        setShowCallModal(true);
                        return;
                      }
                      callMissedCalls();
                    }}
                    disabled={missedLoading}
                    title={
                      !selectedAgent
                        ? "Choose an agent, then calls will start"
                        : "Call all missed contacts"
                    }
                  >
                    Call Again
                  </button>
                )}
                <div className="text-sm text-gray-500">
                  {leadsLoading ? "Loading..." : `${leadsTotalItems} total`}
                </div>
              </div>
            </div>
            {leadsLoading ? (
              <div className="text-center py-10">Loading leads...</div>
            ) : leads.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No leads yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Number</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Conversation</th>
                      <th className="py-2 pr-4">Redial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedCalls
                      .filter((lead) => {
                        const name = (lead.name || "").toString().trim();
                        const number = (lead.number || "").toString().trim();
                        const hasRealName = name && name !== "-";
                        const hasRealNumber =
                          number && number !== "-" && /\d/.test(number);
                        const byData = hasRealName || hasRealNumber;
                        const byStatus =
                          callFilter === "all"
                            ? true
                            : callFilter === "connected"
                            ? lead.status === "completed" ||
                              lead.status === "ongoing"
                            : lead.status === "missed" ||
                              lead.status === "not_connected" ||
                              lead.status === "failed";
                        return byData && byStatus;
                      })
                      .map((lead) => (
                        <tr key={lead.key} className="border-t border-gray-100">
                          <td className="py-2 pr-4 text-gray-700">
                            {lead.time
                              ? new Date(lead.time).toLocaleString()
                              : "-"}
                          </td>
                          <td className="py-2 pr-4 text-gray-900">
                            {lead.name || "-"}
                          </td>
                          <td className="py-2 pr-4 text-gray-900">
                            {lead.number || "-"}
                          </td>
                          <td className="py-2 pr-4 capitalize">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                lead.status === "ringing"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : lead.status === "ongoing"
                                  ? "bg-blue-100 text-blue-700"
                                  : lead.status === "missed" ||
                                    lead.status === "not_connected" ||
                                    lead.status === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <button
                              className="inline-flex items-center px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                              title="View transcript"
                              onClick={() => openTranscriptSmart(lead)}
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 16h8M8 12h8M8 8h8M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H7l-2 2H3v12a2 2 0 002 2z"
                                />
                              </svg>
                              Transcript
                            </button>
                          </td>
                          <td className="py-2 pr-4">
                            <button
                              className="inline-flex items-center px-3 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50"
                              title="Retry this contact"
                              onClick={() => handleRetryLead(lead)}
                              disabled={!lead.number}
                            >
                              <FiPhone
                                className="w-3 h-3 text-green-700 mx-2"
                                style={{ minWidth: "16px", minHeight: "16px" }}
                              />
                              Retry
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {leadsPage} of {leadsTotalPages || 1}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                      onClick={() => fetchLeads(Math.max(1, leadsPage - 1))}
                      disabled={leadsLoading || leadsPage <= 1}
                    >
                      Prev
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                      onClick={() => fetchLeads(leadsPage + 1)}
                      disabled={
                        leadsLoading ||
                        (leadsTotalPages && leadsPage >= leadsTotalPages)
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Missed Calls list removed; use filter + Call Again button in header */}
        </div>
      </div>

      {/* Transcript Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Transcript</h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowTranscriptModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {transcriptLoading ? (
                <div className="text-center py-10">Loading transcript...</div>
              ) : transcriptContent ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded-lg">
                  {transcriptContent}
                </pre>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No transcript available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Credits Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Insufficient Balance
              </h3>
              <button
                className="bg-none border-none text-xl cursor-pointer text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                onClick={() => setShowCreditsModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">
                Not sufficient credits. Please recharge first to start calling.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowCreditsModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={() => {
                  setShowCreditsModal(false);
                  // Navigate to Credits/Recharge section (adjust route if different)
                  window.location.href = "/auth/credits";
                }}
              >
                Add Credits
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-sm text-blue-700">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 9a1 1 0 000 2h6a1 1 0 100-2H7zm3 3a1 1 0 000 2H7a1 1 0 100 2h3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      <strong>Auto-save enabled:</strong> Your calling progress
                      is automatically saved and will persist across page
                      reloads. You can continue calling from where you left off!
                    </span>
                  </div>
                </div>
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
                          {loadingContacts ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          ) : (
                            campaignContacts.length
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Campaign Contacts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {loadingContacts ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          ) : (
                            campaignContacts.length
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Contacts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {loadingContacts ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                          ) : (
                            campaignContacts[currentContactIndex]?.name ||
                            "None"
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Current Contact
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
                          Contact {currentContactIndex + 1} of{" "}
                          {campaignContacts.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          {campaignContacts[currentContactIndex]?.name ||
                            "Unknown"}
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
                      campaignContacts[currentContactIndex] && (
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Name</div>
                              <div className="font-semibold text-gray-900">
                                {campaignContacts[currentContactIndex]?.name ||
                                  "Unknown"}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Phone</div>
                              <div className="font-semibold text-gray-900">
                                {campaignContacts[currentContactIndex]?.phone ||
                                  "Unknown"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Save Progress Button */}
                    {callingStatus !== "idle" && (
                      <div className="flex justify-center mb-4 space-x-3">
                        <button
                          onClick={manualSaveState}
                          className="inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                          title="Manually save your calling progress"
                        >
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
                              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                            />
                          </svg>
                          Save Progress
                        </button>

                        {/* Cleanup Duplicates Button */}
                        <button
                          onClick={removeDuplicateCallResults}
                          className="inline-flex items-center px-4 py-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all duration-200"
                          title="Remove duplicate call results"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Clean Duplicates
                        </button>

                        {/* Update Call Status Button */}
                        <button
                          onClick={() => {
                            // Update status for all call results with uniqueIds
                            callResults.forEach((result) => {
                              if (result.uniqueId) {
                                updateCallStatus(result.uniqueId);
                              }
                            });
                          }}
                          className="inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                          title="Update call status from external service"
                        >
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Update Status
                        </button>
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
                                ? "bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 hover:border-green-300 transition-all duration-200"
                                : "bg-red-50 border-red-200"
                            }`}
                            onClick={() => {
                              if (result.success && result.uniqueId) {
                                // Create a call object with the necessary data for live logs
                                const callData = {
                                  _id: `result-${index}`,
                                  mobile: result.contact.phone,
                                  agentId: {
                                    agentName:
                                      selectedAgent?.agentName ||
                                      "Campaign Agent",
                                  },
                                  leadStatus: "connected",
                                  metadata: {
                                    customParams: {
                                      uniqueid: result.uniqueId,
                                    },
                                  },
                                  createdAt:
                                    result.timestamp instanceof Date
                                      ? result.timestamp
                                      : new Date(result.timestamp),
                                  time:
                                    result.timestamp instanceof Date
                                      ? result.timestamp
                                      : new Date(result.timestamp),
                                  duration: 0,
                                  callType: "outbound",
                                };
                                handleViewLiveCall(callData);
                              }
                            }}
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
                                    <span className="text-gray-600">Time:</span>
                                    <div className="font-medium">
                                      {safeFormatTimestamp(result.timestamp)}
                                    </div>
                                  </div>
                                  {result.uniqueId && (
                                    <div>
                                      <span className="text-gray-600">ID:</span>
                                      <div className="font-medium text-xs">
                                        {result.uniqueId.substring(0, 20)}...
                                      </div>
                                    </div>
                                  )}
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
                                {result.success && result.uniqueId && (
                                  <>
                                    <div className="mt-2 flex items-center text-xs text-blue-600">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Click to view live logs
                                    </div>

                                    {/* Connection Status */}
                                    <div className="mt-2">
                                      <div
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                          callResultsConnectionStatus[
                                            result.uniqueId
                                          ] === "connected"
                                            ? "bg-green-100 text-green-700 border border-green-200"
                                            : callResultsConnectionStatus[
                                                result.uniqueId
                                              ] === "not_connected"
                                            ? "bg-red-100 text-red-700 border border-red-200"
                                            : "bg-gray-100 text-gray-600 border border-gray-200"
                                        }`}
                                      >
                                        <div
                                          className={`w-2 h-2 rounded-full mr-1 ${
                                            callResultsConnectionStatus[
                                              result.uniqueId
                                            ] === "connected"
                                              ? "bg-green-500"
                                              : callResultsConnectionStatus[
                                                  result.uniqueId
                                                ] === "not_connected"
                                              ? "bg-red-500"
                                              : "bg-gray-400"
                                          }`}
                                        ></div>
                                        {callResultsConnectionStatus[
                                          result.uniqueId
                                        ] === "connected"
                                          ? "Connected"
                                          : callResultsConnectionStatus[
                                              result.uniqueId
                                            ] === "not_connected"
                                          ? "Not Accepted / Busy / Disconnected"
                                          : "Checking..."}
                                      </div>
                                    </div>
                                  </>
                                )}
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
                  disabled={
                    loadingContacts ||
                    !campaign?.groupIds ||
                    campaign.groupIds.length === 0
                  }
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
                  onClick={async () => {
                    await syncContactsFromGroups(true);
                    await fetchCampaignContacts();
                  }}
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
              {/* Current groups in campaign */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Current Groups in Campaign
                </h4>
                {campaignGroups.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No groups added yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campaignGroups.map((group) => (
                      <div
                        key={`current-${group._id}`}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-800">
                              {group.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {group.contacts?.length || 0} contacts
                            </div>
                          </div>
                          <button
                            className="text-red-600 hover:text-red-700"
                            title="Remove from campaign"
                            onClick={() => handleRemoveGroup(group._id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                    <>Update</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Select Agent</h3>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setShowAddAgentModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="p-6">
              {loadingAgents ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-500 mt-2">Loading agents...</p>
                </div>
              ) : (agents || []).length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FiUsers className="mx-auto text-4xl text-gray-400 mb-4" />
                  <h5 className="text-lg font-medium text-gray-600 mb-2">
                    No agents available
                  </h5>
                  <p className="text-gray-500">Create an agent to proceed.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {agents.map((agent) => (
                    <label
                      key={agent._id}
                      className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer ${
                        selectedAgentIdForAssign === agent._id
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedAgentIdForAssign(agent._id)}
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {agent.agentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {agent.description}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="assignAgent"
                        checked={selectedAgentIdForAssign === agent._id}
                        onChange={() => setSelectedAgentIdForAssign(agent._id)}
                      />
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddAgentModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedAgentIdForAssign}
                  onClick={saveSelectedAgentToCampaign}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Call Modal */}
      {showLiveCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Live Call Logs
                </h3>
                <p className="text-gray-600 mt-1">
                  Real-time call transcript and details
                </p>
              </div>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-700 p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={closeLiveCallModal}
              >
                <FiX />
              </button>
            </div>

            <div className="p-6">
              {/* Call Information */}
              {selectedCall && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Contact</div>
                      <div className="font-semibold">
                        {selectedCall.mobile || "Unknown"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Agent</div>
                      <div className="font-semibold">
                        {selectedCall.agentId?.agentName || "Unknown"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-semibold capitalize">
                        {selectedCall.leadStatus || "Unknown"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-semibold">uniqueId:</span>{" "}
                    {selectedCall.metadata?.customParams?.uniqueid || "Unknown"}
                  </div>
                </div>
              )}

              {/* Live Status Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        isPolling
                          ? "bg-green-500 animate-pulse"
                          : liveCallDetails?.metadata?.isActive === false
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-sm font-medium">
                      {isPolling
                        ? "Live - Polling for updates..."
                        : liveCallDetails?.metadata?.isActive === false
                        ? "Call ended - Polling stopped"
                        : "Not polling"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {liveCallDetails
                      ? `Last updated: ${new Date().toLocaleTimeString()}`
                      : "Waiting for call data..."}
                  </div>
                </div>

                {/* Connection Status */}
                <div
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    callConnectionStatus === "connected"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      callConnectionStatus === "connected"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  {callConnectionStatus === "connected"
                    ? "Call Connected"
                    : "Not Accepted / Busy / Disconnected"}
                  {callConnectionStatus === "not_connected" && (
                    <span className="ml-2 text-xs opacity-75">
                      {liveCallDetails?.metadata?.isActive === false
                        ? "(Call ended by system)"
                        : "(No response for 40+ seconds)"}
                    </span>
                  )}
                </div>
              </div>

              {/* Live Transcript */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Live Transcript
                </h4>

                {liveTranscriptLines.length > 0 ? (
                  <div
                    ref={transcriptRef}
                    className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto"
                  >
                    {liveTranscriptLines.map((line, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        {line.isAI ? (
                          // AI Message (Left side)
                          <div className="flex justify-start">
                            <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="bg-blue-500 text-white rounded-lg px-4 py-2 shadow-sm">
                                <div className="text-sm">{line.text}</div>
                                {line.timestamp && (
                                  <div className="text-xs text-blue-100 mt-1">
                                    {line.timestamp}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : line.isUser ? (
                          // User Message (Right side)
                          <div className="flex justify-end">
                            <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                              <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 shadow-sm">
                                <div className="text-sm">{line.text}</div>
                                {line.timestamp && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {line.timestamp}
                                  </div>
                                )}
                              </div>
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // System Message (Center)
                          <div className="flex justify-center">
                            <div className="bg-gray-100 text-gray-600 rounded-lg px-3 py-1 text-xs">
                              {line.text}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : liveTranscript ? (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {liveTranscript}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                    <svg
                      className="w-8 h-8 mx-auto mb-2 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    No transcript available yet. Waiting for call data...
                  </div>
                )}
              </div>

              {/* Call Details */}
              {liveCallDetails && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
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
                    Call Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Duration</div>
                      <div className="font-semibold">
                        {Math.max(0, liveCallDetails.duration || 0)}s
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">
                        Call Time
                      </div>
                      <div className="font-semibold">
                        {new Date(
                          liveCallDetails.createdAt || liveCallDetails.time
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">
                        Lead Status
                      </div>
                      <div className="font-semibold capitalize">
                        {liveCallDetails.leadStatus || "Unknown"}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">
                        Call Type
                      </div>
                      <div className="font-semibold capitalize">
                        {liveCallDetails.callType || "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignDetails;
