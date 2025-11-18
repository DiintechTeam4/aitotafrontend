import React, { useState, useEffect } from "react";
import {
  FiArrowLeft,
  FiMail,
  FiUsers,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiTarget,
  FiBarChart,
  FiCalendar,
  FiRefreshCw,
  FiPhone,
  FiDollarSign,
  FiPlus,
} from "react-icons/fi";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../../config";
import LeadsDisposition from "./LeadsDisposition";
import * as XLSX from "xlsx";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const HumanAgentDetails = ({ agentId, onBack }) => {
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [dialsReport, setDialsReport] = useState({});
  const [dialsLeads, setDialsLeads] = useState({});
  const [dialsDone, setDialsDone] = useState([]);
  const [selectedLeadCategory, setSelectedLeadCategory] = useState(null);
  const [leadDetails, setLeadDetails] = useState([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [showLeadHistoryModal, setShowLeadHistoryModal] = useState(false);
  const [leadHistory, setLeadHistory] = useState([]);
  const [loadingLeadHistory, setLoadingLeadHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("report");
  const [dateFilter, setDateFilter] = useState("last7days"); // today | yesterday | last7days | custom | all
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showAssignContactsModal, setShowAssignContactsModal] = useState(false);
  const [assignContacts, setAssignContacts] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showSuperModal, setShowSuperModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [superSearch, setSuperSearch] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all"); // "all" | "assigned" | "notAssigned"
  const [assignedContactIds, setAssignedContactIds] = useState(new Set()); // Track which contacts are assigned
  const [assigningContacts, setAssigningContacts] = useState(false); // Loading state for assignment

  // Phone normalization helper
  const normalizePhoneLocal = (value) => {
    if (!value) return "";
    const raw = String(value).trim();
    const kept = raw.replace(/[^\d+]/g, "");
    const cleaned = kept.replace(/\+(?=.+\+)/g, "");
    return cleaned.startsWith("+") ? cleaned : cleaned;
  };

  // Proper-case a full name: "SUMIT RAWAT" -> "Sumit Rawat"
  const formatName = (name) => {
    if (!name) return "";
    return String(name)
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
      .join(" ");
  };

  // Parse CSV file
  const parseCSV = (csvText) => {
    const lines = csvText.split(/\r?\n/);
    const data = [];
    const errors = [];

    const looksLikeHeader = (values) => {
      const first = (values[0] || "").toLowerCase();
      if (first.includes("phone") || first.includes("number")) return true;
      const phoneLike = /^[+\d][\d\s\-()]*$/;
      return !phoneLike.test(values[0] || "");
    };

    let startIndex = 0;
    if (lines.length > 0) {
      const firstValues = lines[0].split(",").map((v) => v.trim());
      if (looksLikeHeader(firstValues)) {
        startIndex = 1;
      }
    }

    for (let i = startIndex; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(",").map((v) => v.trim());
      const phoneRaw = values[0] || "";
      const nameRaw = values[1] || "";
      const emailRaw = values[2] || "";

      const isEmailEmpty =
        !emailRaw ||
        emailRaw === "" ||
        emailRaw === "undefined" ||
        emailRaw === "null" ||
        emailRaw === "NA" ||
        emailRaw.replace(/\s/g, "") === "";

      const cleanPhone = phoneRaw.replace(/[^\d+]/g, "");
      const phoneRegex = /^[\+]?[0-9]{6,16}$/;
      if (!cleanPhone) {
        errors.push(`Row ${i + 1}: Missing required field (phone)`);
        continue;
      }
      if (!phoneRegex.test(cleanPhone)) {
        errors.push(`Row ${i + 1}: Invalid phone number format`);
        continue;
      }

      if (!isEmailEmpty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
        errors.push(`Row ${i + 1}: Invalid email format`);
        continue;
      }

      data.push({
        name: nameRaw || "",
        phone: cleanPhone,
        email: isEmailEmpty ? "" : emailRaw,
      });
    }

    return { data, errors };
  };

  // Parse Excel file
  const parseExcel = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      const dataOut = [];
      const errors = [];

      const looksLikeHeader = (firstRow) => {
        if (!firstRow || firstRow.length === 0) return false;
        const first = String(firstRow[0] || "").toLowerCase();
        if (first.includes("phone") || first.includes("number")) return true;
        const phoneLike = /^[+\d][\d\s\-()]*$/;
        return !phoneLike.test(String(firstRow[0] || ""));
      };

      let startIndex = 0;
      if (rows.length > 0 && looksLikeHeader(rows[0])) {
        startIndex = 1;
      }

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (
          !row ||
          row.length === 0 ||
          row.every((c) => String(c).trim() === "")
        )
          continue;

        const phoneRaw = String(row[0] ?? "").trim();
        const nameRaw = String(row[1] ?? "").trim();
        const emailRaw =
          row[2] === undefined || row[2] === null ? "" : String(row[2]).trim();

        const isEmailEmpty =
          !emailRaw ||
          emailRaw === "" ||
          emailRaw === "undefined" ||
          emailRaw === "null" ||
          emailRaw === "NaN" ||
          emailRaw === "NA" ||
          emailRaw.replace(/\s/g, "") === "" ||
          emailRaw.length === 0;

        const cleanPhone = phoneRaw.replace(/[^\d+]/g, "");
        const phoneRegex = /^[\+]?[0-9]{6,16}$/;
        if (!cleanPhone) {
          errors.push(`Row ${i + 1}: Missing required field (phone)`);
          continue;
        }
        if (!phoneRegex.test(cleanPhone)) {
          errors.push(`Row ${i + 1}: Invalid phone number format`);
          continue;
        }

        if (!isEmailEmpty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
          errors.push(`Row ${i + 1}: Invalid email format`);
          continue;
        }

        dataOut.push({
          name: nameRaw || "",
          phone: cleanPhone,
          email: isEmailEmpty ? "" : emailRaw,
        });
      }

      return { data: dataOut, errors };
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      return {
        data: [],
        errors: [
          "Error parsing Excel file. Use 3 columns: Phone (required), Name (optional), Email (optional).",
        ],
      };
    }
  };

  const [assignedGroups, setAssignedGroups] = useState([]);
  const [showGroupContactsModal, setShowGroupContactsModal] = useState(false);
  const [selectedGroupContacts, setSelectedGroupContacts] = useState([]);
  const [loadingGroupContacts, setLoadingGroupContacts] = useState(false);
  const [selectedGroupForContacts, setSelectedGroupForContacts] =
    useState(null);

  const fetchGroupContacts = async (group) => {
    setLoadingGroupContacts(true);
    setSelectedGroupForContacts(group);
    try {
      const clientToken = sessionStorage.getItem("clienttoken");
      // Get human agent token
      const tokenResponse = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/auth/human-agent-token/${agentId}`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
        }
      );
      const tokenData = await tokenResponse.json();
      if (tokenData.success && tokenData.token) {
        // Use token to fetch contacts in this group
        const response = await fetch(
          `https://aitotabackend-sih2.onrender.com/api/v1/human-agent/groups/${group._id}/contacts`,
          {
            headers: { Authorization: `Bearer ${tokenData.token}` },
          }
        );
        const data = await response.json();
        const contactsList =
          data?.data?.contacts || data?.contacts || [];
        setSelectedGroupContacts(contactsList);
      } else {
        setSelectedGroupContacts([]);
      }
    } catch (e) {
      setSelectedGroupContacts([]);
      console.error(e);
    } finally {
      setLoadingGroupContacts(false);
    }
  };

  const fetchAssignedGroups = async () => {
    try {
      const clientToken = sessionStorage.getItem("clienttoken");
      // First get human agent token
      const tokenResponse = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/auth/human-agent-token/${agentId}`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
        }
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.success && tokenData.token) {
        // Now use human agent token to fetch assigned groups
        const response = await fetch(
          `https://aitotabackend-sih2.onrender.com/api/v1/human-agent/groups?owner=assign`,
          {
            headers: { Authorization: `Bearer ${tokenData.token}` },
          }
        );
        const data = await response.json();
        setAssignedGroups(data.groups || data.data || []);
      }
    } catch (error) {
      console.error("Error fetching assigned groups:", error);
      setAssignedGroups([]);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchAgentDetails();
      fetchAgentStats();
      fetchDialsReport();
      fetchDialsLeads();
      fetchDialsDone();
      generateChartData();
      fetchAssignedGroups();
    }
  }, [agentId, dateFilter, customStartDate, customEndDate]);

  const fetchAgentDetails = async () => {
    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/human-agents/${agentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Agent not found");
        }
        throw new Error("Failed to fetch agent details");
      }

      const data = await response.json();
      setAgent(data.data);
    } catch (error) {
      console.error("Error fetching agent details:", error);
      setError(error.message);
    }
  };

  const fetchAgentStats = async () => {
    try {
      const clientToken = sessionStorage.getItem("clienttoken");
      // First get human agent token
      const tokenResponse = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/auth/human-agent-token/${agentId}`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
        }
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.success && tokenData.token) {
        // Now use human agent token to fetch stats
        const response = await fetch(
          `https://aitotabackend-sih2.onrender.com/api/v1/human-agent/agent-dispo-stats?humanAgentId=${agentId}`,
          {
            headers: { Authorization: `Bearer ${tokenData.token}` },
          }
        );
        const data = await response.json();
        if (response.ok && data?.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching agent stats:", error);
    }
  };

  const fetchDialsReport = async () => {
    try {
      const clientToken = sessionStorage.getItem("clienttoken");
      // First get human agent token
      const tokenResponse = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/auth/human-agent-token/${agentId}`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
        }
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.success && tokenData.token) {
        // Now use human agent token to fetch dials report
        const q = buildDateQuery();
        const response = await fetch(
          `https://aitotabackend-sih2.onrender.com/api/v1/human-agent/dials/report${
            q ? `?${q}` : ""
          }`,
          {
            headers: { Authorization: `Bearer ${tokenData.token}` },
          }
        );
        const data = await response.json();
        if (response.ok && data?.success) {
          setDialsReport(data.data || {});
        }
      }
    } catch (error) {
      console.error("Error fetching dials report:", error);
    }
  };

  const fetchDialsLeads = async () => {
    try {
      const clientToken = sessionStorage.getItem("clienttoken");
      // First get human agent token
      const tokenResponse = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/auth/human-agent-token/${agentId}`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
        }
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.success && tokenData.token) {
        // Now use human agent token to fetch dials leads
        const q = buildDateQuery();
        const response = await fetch(
          `https://aitotabackend-sih2.onrender.com/api/v1/human-agent/dials/leads${
            q ? `?${q}` : ""
          }`,
          {
            headers: { Authorization: `Bearer ${tokenData.token}` },
          }
        );
        const data = await response.json();
        if (response.ok && data?.success) {
          setDialsLeads(data.data || {});
        }
      }
    } catch (error) {
      console.error("Error fetching dials leads:", error);
    }
  };

  const fetchDialsDone = async () => {
    try {
      const clientToken = sessionStorage.getItem("clienttoken");
      // First get human agent token
      const tokenResponse = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/auth/human-agent-token/${agentId}`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
        }
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.success && tokenData.token) {
        // Now use human agent token to fetch dials done
        const q = buildDateQuery();
        const response = await fetch(
          `https://aitotabackend-sih2.onrender.com/api/v1/human-agent/dials/done${
            q ? `?${q}` : ""
          }`,
          {
            headers: { Authorization: `Bearer ${tokenData.token}` },
          }
        );
        const data = await response.json();
        if (response.ok && data?.success) {
          setDialsDone(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching dials done:", error);
    }
  };

  const fetchLeadDetails = async (category) => {
    try {
      setLoadingLeads(true);
      const clientToken = sessionStorage.getItem("clienttoken");

      // First get human agent token
      const tokenResponse = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/auth/human-agent-token/${agentId}`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
        }
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.success && tokenData.token) {
        // Fetch leads data
        const q = buildDateQuery();
        const response = await fetch(
          `https://aitotabackend-sih2.onrender.com/api/v1/human-agent/dials/leads${
            q ? `?${q}` : ""
          }`,
          {
            headers: { Authorization: `Bearer ${tokenData.token}` },
          }
        );
        const data = await response.json();

        if (response.ok && data?.success) {
          // store the selected category and its items in-state (no modal)
          const items = data.data[category]?.data || [];
          setLeadDetails(items);
          setSelectedLeadCategory(category);
        }
      }
    } catch (error) {
      console.error("Error fetching lead details:", error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const closeLeadModal = () => {
    setShowLeadModal(false);
    setSelectedLeadCategory(null);
    setLeadDetails([]);
  };

  const closeLeadHistory = () => {
    setShowLeadHistoryModal(false);
    setLeadHistory([]);
  };

  const openLeadHistory = async (lead) => {
    // lead can be an object or phone string
    const phone =
      typeof lead === "string"
        ? lead
        : lead.phoneNumber ||
          lead.phone ||
          lead.contactNumber ||
          lead.contact ||
          "";
    if (!phone) return;
    setLoadingLeadHistory(true);
    try {
      // Ensure we have latest grouped leads and done list
      await fetchDialsLeads();
      await fetchDialsDone();

      // Flatten grouped leads
      const all = [];
      for (const key of Object.keys(dialsLeads || {})) {
        const arr = (dialsLeads[key] && dialsLeads[key].data) || [];
        for (const it of arr) all.push({ ...it, _source: key });
      }
      // include done
      for (const it of dialsDone || [])
        all.push({ ...it, _source: "sale_done" });

      const normalize = (s) => String(s || "").replace(/\D/g, "");
      const target = normalize(phone);

      const history = all
        .filter((i) => {
          const p = normalize(
            i.phoneNumber ||
              i.phone ||
              i.contactNumber ||
              i.contact ||
              i.contactName ||
              ""
          );
          return p && p === target;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setLeadHistory(history);
      setShowLeadHistoryModal(true);
    } catch (e) {
      console.error("Error building lead history:", e);
      setLeadHistory([]);
    } finally {
      setLoadingLeadHistory(false);
    }
  };

  const generateChartData = () => {
    // Generate simple daily performance data for the last 7 days
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const tasksAssigned = Math.floor(Math.random() * 8) + 3; // 3-10 tasks
      const tasksCompleted = Math.floor(
        tasksAssigned * (0.6 + Math.random() * 0.4)
      ); // 60-100% completion

      data.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate(),
        completed: tasksCompleted,
        total: tasksAssigned,
        percentage: Math.round((tasksCompleted / tasksAssigned) * 100),
      });
    }

    setChartData(data);
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAgentDetails(),
      fetchAgentStats(),
      fetchDialsReport(),
      fetchDialsLeads(),
      fetchDialsDone(),
      fetchContactsForAgentGroup(),
      fetchAssignedGroups(),
    ]);
    generateChartData();
    setLoading(false);
  };

  const buildDateQuery = () => {
    if (dateFilter === "custom" && customStartDate && customEndDate) {
      return `startDate=${encodeURIComponent(
        customStartDate
      )}&endDate=${encodeURIComponent(customEndDate)}`;
    }
    if (dateFilter && dateFilter !== "all") {
      return `filter=${encodeURIComponent(dateFilter)}`;
    }
    return "";
  };

  const fetchContactsForAgentGroup = async () => {
    setAssignLoading(true);
    try {
      const token = sessionStorage.getItem("clienttoken");
      // agent.groupId must exist
      const resp = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/groups/${agent.groupId}/contacts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await resp.json();
      setAvailableContacts(data.contacts || []);
    } catch (e) {
      setAvailableContacts([]);
    } finally {
      setAssignLoading(false);
    }
  };

  const fetchAvailableGroups = async () => {
    const token = sessionStorage.getItem("clienttoken");
    const resp = await fetch(
      `https://aitotabackend-sih2.onrender.com/api/v1/client/groups`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const res = await resp.json();
    setAvailableGroups(res.groups || res.data || []);
    // Auto-set if only one group
    if ((res.groups || res.data || []).length === 1) {
      setSelectedGroupId((res.groups || res.data)[0]._id);
      await fetchContactsForGroup((res.groups || res.data)[0]._id);
    }
  };

  const fetchContactsForGroup = async (groupId) => {
    setAssignLoading(true);
    const token = sessionStorage.getItem("clienttoken");
    const resp = await fetch(
      `https://aitotabackend-sih2.onrender.com/api/v1/client/groups/${groupId}/contacts`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const res = await resp.json();
    setAvailableContacts(res.contacts || []);
    setAssignLoading(false);
  };

  const fetchAllGroups = async () => {
    const token = sessionStorage.getItem("clienttoken");
    const resp = await fetch(
      `https://aitotabackend-sih2.onrender.com/api/v1/client/groups`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const res = await resp.json();
    let grps = res.groups || res.data || [];
    setGroups(grps);

    // Update selectedGroup if it exists to reflect new contact counts
    if (selectedGroup) {
      const updatedGroup = grps.find((g) => g._id === selectedGroup._id);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
    }

    if (!selectedGroup && grps.length > 0) {
      await handleSelectGroup(grps[0]);
    }
  };

  const fetchAssignGroupContacts = async (group) => {
    setLoadingGroupContacts(true);
    setSelectedGroupForContacts(group);
    try {
      // 1. Get client token from session
      const clientToken = sessionStorage.getItem("clienttoken");
      // 2. Human agent token API call
      const tokenResponse = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/auth/human-agent-token/${agentId}`,
        {
          headers: { Authorization: `Bearer ${clientToken}` },
        }
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.success && tokenData.token) {
        // 3. Now use this new token to fetch contacts for group
        const response = await fetch(
          `https://aitotabackend-sih2.onrender.com/api/v1/human-agent/groups/${group._id}/contacts`,
          {
            headers: { Authorization: `Bearer ${tokenData.token}` },
          }
        );
        const data = await response.json();
        const contactsList =
          data?.data?.contacts || data?.contacts || [];
        setSelectedGroupContacts(contactsList);
      } else {
        setSelectedGroupContacts([]);
      }
    } catch (error) {
      setSelectedGroupContacts([]);
      console.error("Error fetching group contacts:", error);
    } finally {
      setLoadingGroupContacts(false);
    }
  };

  // Select a group in the Super modal using CLIENT token and load its contacts on right side
  const handleSelectGroup = async (group) => {
    try {
      setSelectedGroup(group);
      setSuperSearch("");
      setLoadingContacts(true);
      const token = sessionStorage.getItem("clienttoken");
      const resp = await fetch(
        `https://aitotabackend-sih2.onrender.com/api/v1/client/groups/${group._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await resp.json();
      if (resp.ok && result?.success) {
        const contactsList = (result.data && result.data.contacts) || [];
        setContacts(contactsList);
        
        // Check which contacts are already assigned to this agent
        const assignedIds = new Set();
        if (agentId && contactsList.length > 0) {
          contactsList.forEach((contact) => {
            if (contact.assignedToHumanAgents && Array.isArray(contact.assignedToHumanAgents)) {
              const isAssigned = contact.assignedToHumanAgents.some(
                (assignment) => String(assignment.humanAgentId) === String(agentId)
              );
              if (isAssigned) {
                assignedIds.add(String(contact._id));
              }
            }
          });
        }
        setAssignedContactIds(assignedIds);
      } else {
        setContacts([]);
        setAssignedContactIds(new Set());
      }
    } catch (e) {
      console.error("Error loading group contacts (client):", e);
      setContacts([]);
      setAssignedContactIds(new Set());
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    // Only set loading to false when we have agent data or confirmed error
    if (agent || error) {
      setLoading(false);
    }
  }, [agent, error]);

  useEffect(() => {
    if (showSuperModal) fetchAllGroups();
    // eslint-disable-next-line
  }, [showSuperModal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent details...</p>
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
            Error Loading Agent Details
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!agent && !loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Agent Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            The requested agent could not be found.
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const completionRate =
    stats.assignedCount > 0
      ? ((stats.updatedByAgent / stats.assignedCount) * 100).toFixed(1)
      : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <span className="text-xl font-bold text-blue-600">
                {agent.humanAgentName?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {agent.humanAgentName || "Unknown Agent"}
              </h2>
              <p className="text-gray-600 capitalize">
                {agent.role || "Executive"} • {agent.email || "N/A"} •{" "}
                {agent.mobileNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <FiRefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Tabs + Date Filters */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <nav className="flex flex-wrap gap-2">
            {[
              { key: "logs", label: "My Call Logs" },
              { key: "leads", label: "My Leads" },
              { key: "report", label: "My Report" },
              { key: "assign", label: "My Assign" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-50 text-blue-700 border border-b-0 border-blue-200"
                    : "text-gray-600 hover:text-blue-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Date Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "last7days", label: "Last 7 Days" },
              { key: "all", label: "All" },
              { key: "custom", label: "Custom" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  dateFilter === f.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}

            {dateFilter === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Agent Info moved to header (minimal) */}

      {/* My Report */}
      {activeTab === "report" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Dials Report */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiPhone className="w-5 h-5 mr-2 text-blue-600" />
              Call Report
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Total Calls
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {dialsReport.totalCalls || 0}
                    </p>
                  </div>
                  <FiPhone className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Connected
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {dialsReport.totalConnected || 0}
                    </p>
                  </div>
                  <FiCheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">
                      Not Connected
                    </p>
                    <p className="text-2xl font-bold text-red-900">
                      {dialsReport.totalNotConnected || 0}
                    </p>
                  </div>
                  <FiClock className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Avg Duration
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {Math.round(dialsReport.avgCallDuration || 0)}s
                    </p>
                  </div>
                  <FiClock className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Sales Done */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiDollarSign className="w-5 h-5 mr-2 text-green-600" />
              Sales Done
            </h3>
            <div className="text-center py-8">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {dialsDone.length}
              </div>
              <p className="text-gray-600 mb-4">Total Sales Completed</p>
              {dialsDone.length > 0 && (
                <div className="text-sm text-gray-500">
                  Latest:{" "}
                  {new Date(
                    dialsDone[0]?.createdAt || new Date()
                  ).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead History Modal */}
      {showLeadHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-[95vw] max-w-3xl shadow-lg p-6 relative">
            <button
              onClick={closeLeadHistory}
              className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-gray-900"
              aria-label="Close lead history"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-4">Lead History</h3>

            {loadingLeadHistory ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : leadHistory.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No history found for this number.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Disposition
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leadHistory.map((h, i) => (
                      <tr key={h._id || i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {i + 1}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {h.name || h.contactName || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {h.phoneNumber || h.contactNumber || h.phone || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {h.leadStatus || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {h.duration ? `${h.duration}s` : "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {h._source || h.source || "N/A"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {h.createdAt
                            ? new Date(h.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Leads */}
      {activeTab === "leads" && (
        <LeadsDisposition
          dialsLeads={dialsLeads}
          fetchLeadDetails={fetchLeadDetails}
          selectedLeadCategory={selectedLeadCategory}
          leadDetails={leadDetails}
          loadingLeads={loadingLeads}
          openLeadHistory={openLeadHistory}
        />
      )}

      {/* My Assign */}

      {activeTab === "assign" && (
        <>
          {/* Assigned Groups Section */}
          <div className="mb-8">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiUsers className="w-5 h-5 mr-2 text-green-600" />
                Assigned Groups
              </h3>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
                onClick={() => setShowSuperModal(true)}
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Assign Contacts
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedGroups.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-4">
                  No groups assigned yet
                </div>
              ) : (
                assignedGroups.map((group) => (
                  <div
                    key={group._id}
                    className="bg-green-50 rounded-lg p-4 border border-green-200"
                  >
                    <div
                      className="flex items-center justify-between mb-2"
                      onClick={() => {
                        fetchAssignGroupContacts(group);
                        setShowGroupContactsModal(true);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-green-600">
                            {group.name?.charAt(0).toUpperCase() || "G"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {group.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {group.category || "Group"}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {group.contacts?.length || group.contactsCount || 0}{" "}
                        contacts
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {showGroupContactsModal && (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50/60 to-white flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-blue-700">
                    <span className="inline-block mr-1 align-middle">👥</span>
                    {selectedGroupForContacts?.name || "Group"} Contacts
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    All contacts in this group
                  </p>
                </div>
                <button
                  className="text-gray-400 hover:text-red-500 text-2xl rounded-full px-2 py-1 transition-colors duration-150"
                  onClick={() => {
                    setShowGroupContactsModal(false);
                    setSelectedGroupContacts([]);
                    setSelectedGroupForContacts(null);
                  }}
                  aria-label="Close contacts panel"
                >
                  ×
                </button>
              </div>
              <div className="px-6 py-5 min-h-[120px] max-h-[340px] overflow-y-auto">
                {loadingGroupContacts ? (
                  <div className="text-center text-gray-500 py-8">
                    Loading...
                  </div>
                ) : selectedGroupContacts.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No contacts found in this group.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {selectedGroupContacts.map((c) => (
                      <li
                        key={c._id}
                        className="border border-blue-100 bg-blue-50/50 rounded-xl px-5 py-3 shadow flex flex-col gap-0.5 hover:shadow-md transition-all"
                      >
                        <span className="font-bold text-gray-800 flex items-center gap-2">
                          <span className="text-blue-600">•</span>{" "}
                          {c.name || "No Name"}
                        </span>
                        <span className="text-[13px] text-gray-700">
                          {c.phone}
                        </span>
                        {c.email && (
                          <span className="text-[13px] text-blue-700 font-mono">
                            {c.email}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="px-6 py-4 border-t bg-gradient-to-r from-blue-50/60 to-white flex justify-end rounded-b-2xl">
                <button
                  className="px-6 py-1.5 bg-white border border-gray-300 font-semibold rounded-lg hover:bg-gray-100 transition-all"
                  onClick={() => {
                    setShowGroupContactsModal(false);
                    setSelectedGroupContacts([]);
                    setSelectedGroupForContacts(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Daily Performance Chart (Report) */}
      {activeTab === "report" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiBarChart className="w-5 h-5 mr-2 text-green-600" />
            Daily Performance
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  stroke="#666"
                  fontSize={12}
                  tick={{ fill: "#666" }}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tick={{ fill: "#666" }}
                  label={{ value: "Tasks", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, name) => [
                    value,
                    name === "completed" ? "Completed" : "Total",
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `${payload[0].payload.day} ${payload[0].payload.date} - ${payload[0].payload.percentage}% completion`;
                    }
                    return label;
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#e5e7eb"
                  name="total"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  fill="#10b981"
                  name="completed"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-gray-600">Completed Tasks</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
              <span className="text-gray-600">Total Tasks</span>
            </div>
          </div>
        </div>
      )}

      {/* My Call Logs (placeholder) */}
      {activeTab === "logs" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 text-gray-500">
          Call logs will appear here.
        </div>
      )}

      {/* Lead Details Inline Table (replaces modal) */}
      {selectedLeadCategory && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {selectedLeadCategory?.replace(/([A-Z])/g, " $1").trim()} Leads
            </h3>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => {
                  // Clear selection to hide table
                  setSelectedLeadCategory(null);
                  setLeadDetails([]);
                }}
              >
                Close
              </button>
              <button
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  // Refresh current category
                  if (selectedLeadCategory)
                    fetchLeadDetails(selectedLeadCategory);
                }}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="p-2 overflow-x-auto">
            {loadingLeads ? (
              <div className="py-8 text-center text-gray-500">
                Loading leads...
              </div>
            ) : leadDetails.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disposition
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leadDetails.map((lead, index) => (
                    <tr
                      key={lead._id || index}
                      onClick={() => openLeadHistory(lead)}
                      className="hover:bg-gray-50 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          openLeadHistory(lead);
                      }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lead.name || lead.contactName || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {lead.phoneNumber || lead.contactNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {lead.leadStatus || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {lead.explanation || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {lead.duration ? `${lead.duration}s` : "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No leads found for this category.
              </div>
            )}
          </div>
        </div>
      )}

      {showAssignContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-96 shadow-lg p-6 relative">
            <h3 className="text-lg font-bold mb-4">Assign Contacts to Group</h3>
            {/* Group select dropdown */}
            <div className="mb-4">
              <label className="block font-medium mb-1">Select Group:</label>
              <select
                className="border rounded px-2 py-1 w-full"
                value={selectedGroupId || ""}
                onChange={async (e) => {
                  setSelectedGroupId(e.target.value);
                  setAssignContacts([]);
                  await fetchContactsForGroup(e.target.value);
                }}
              >
                <option value="">-- Select Group --</option>
                {availableGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name || "No Name"} ({group.contacts?.length || 0}{" "}
                    contacts)
                  </option>
                ))}
              </select>
            </div>
            {/* Contacts */}
            {selectedGroupId && (
              <div className="max-h-56 overflow-y-auto mb-4 border rounded p-2">
                {assignLoading ? (
                  <div>Loading contacts...</div>
                ) : availableContacts.length === 0 ? (
                  <div className="text-gray-500">
                    No contacts in this group.
                  </div>
                ) : (
                  availableContacts.map((contact) => (
                    <div key={contact._id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={assignContacts.includes(contact._id)}
                        onChange={() => {
                          setAssignContacts((prev) =>
                            prev.includes(contact._id)
                              ? prev.filter((id) => id !== contact._id)
                              : [...prev, contact._id]
                          );
                        }}
                        className="mr-2"
                      />
                      <span>
                        {contact.name} ({contact.phone})
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
            {/* Modal buttons */}
            <div className="flex gap-3 justify-end mt-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowAssignContactsModal(false);
                  setAssignContacts([]);
                  setAvailableContacts([]);
                  setSelectedGroupId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={
                  !selectedGroupId ||
                  assignContacts.length === 0 ||
                  assignLoading
                }
                onClick={async () => {
                  setAssignLoading(true);
                  const token = sessionStorage.getItem("clienttoken");
                  await fetch(
                    `https://aitotabackend-sih2.onrender.com/api/v1/client/groups/${selectedGroupId}/assign-contacts`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        contactIds: assignContacts,
                        agentId: agent._id,
                      }),
                    }
                  );
                  setShowAssignContactsModal(false);
                  setAssignContacts([]);
                  setAvailableContacts([]);
                  setSelectedGroupId(null);
                  setAssignLoading(false);
                  // Optional: show toast or refresh assigned/progress info
                }}
              >
                Assign Selected Contacts
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[85vh] shadow-xl p-6 overflow-hidden relative flex flex-col">
            <button
              onClick={() => {
                setShowSuperModal(false);
                setSelectedGroup(null);
                setAssignContacts([]);
                setContacts([]);
                setSelectedFileName("");
                setSuperSearch("");
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl font-bold z-10"
            >
              ×
            </button>
            <div className="flex gap-6 h-full overflow-hidden">
              {/* LEFT SIDE: Groups Cards + New Group */}
              <div className="w-2/5 pr-4 border-r border-gray-200 h-full overflow-y-auto thin-scrollbar">
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-3 text-gray-800">
                    Groups
                  </h2>
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group._id}
                        onClick={() => handleSelectGroup(group)}
                        className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                          selectedGroup && selectedGroup._id === group._id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-base text-gray-800 truncate flex-1">
                            {group.name}
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 ml-2">
                            {group.contactsCount ?? group.contacts?.length ?? 0}
                          </span>
                        </div>
                        {group.category && (
                          <div className="text-xs text-gray-500 mt-1">
                            {group.category}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* New group button */}
                  <div className="w-full mt-4">
                    {!creatingGroup ? (
                      <button
                        onClick={() => setCreatingGroup(true)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        + New Group
                      </button>
                    ) : (
                      <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <input
                          type="text"
                          className="border border-gray-300 rounded-lg w-full mb-2 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Group name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={!newGroupName.trim()}
                            onClick={async () => {
                              const token =
                                sessionStorage.getItem("clienttoken");
                              const resp = await fetch(
                                `https://aitotabackend-sih2.onrender.com/api/v1/client/groups`,
                                {
                                  method: "POST",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ name: newGroupName }),
                                }
                              );
                              const data = await resp.json();
                              if (data.success) {
                                setNewGroupName("");
                                setCreatingGroup(false);
                                fetchAllGroups();
                              }
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            Create
                          </button>
                          <button
                            onClick={() => setCreatingGroup(false)}
                            className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Contacts, CSV, Assign */}
              <div className="flex-1 pl-4 flex flex-col h-full overflow-hidden">
                {!selectedGroup ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    Select a group to view/add contacts
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-800 mb-1">
                        Contacts in {selectedGroup.name}
                      </h2>
                      <p className="text-xs text-gray-500 mb-3">
                        {(contacts || []).length} contact(s)
                      </p>
                      {/* Upload toolbar */}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setUploadingCsv(true);
                          setImportStatus(null);

                          const fileInput =
                            e.target.querySelector('input[type="file"]');
                          const file = fileInput?.files?.[0];

                          if (!file) {
                            setImportStatus({
                              success: false,
                              error: "Please select a file to upload",
                            });
                            setUploadingCsv(false);
                            return;
                          }

                          const allowedTypes = [
                            "text/csv",
                            "application/vnd.ms-excel",
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                          ];

                          if (!allowedTypes.includes(file.type)) {
                            setImportStatus({
                              success: false,
                              error: "Please upload a CSV or Excel file",
                            });
                            setUploadingCsv(false);
                            return;
                          }

                          try {
                            // Parse file
                            let result;
                            if (file.type === "text/csv") {
                              const text = await file.text();
                              result = parseCSV(text);
                            } else {
                              result = await parseExcel(file);
                            }

                            // Filter duplicates within file and against existing contacts
                            const existingSet = new Set(
                              (contacts || [])
                                .map((c) =>
                                  normalizePhoneLocal(
                                    c.normalizedPhone || c.phone
                                  )
                                )
                                .filter(Boolean)
                            );
                            const seenInFile = new Set();
                            const uniqueContacts = [];

                            for (const c of result.data) {
                              const normalized = normalizePhoneLocal(c.phone);
                              if (!normalized) continue;
                              if (seenInFile.has(normalized)) continue; // duplicate within file
                              if (existingSet.has(normalized)) {
                                seenInFile.add(normalized);
                                continue; // already in group
                              }
                              seenInFile.add(normalized);
                              uniqueContacts.push({
                                ...c,
                                name: formatName(c.name),
                              });
                            }

                            if (uniqueContacts.length === 0) {
                              setImportStatus({
                                success: false,
                                error:
                                  result.errors.length > 0
                                    ? result.errors.join("; ")
                                    : "No new contacts to add. All contacts already exist or are duplicates.",
                              });
                              setUploadingCsv(false);
                              return;
                            }

                            // Send to bulk-add API
                            const token = sessionStorage.getItem("clienttoken");
                            const resp = await fetch(
                              `https://aitotabackend-sih2.onrender.com/api/v1/client/groups/${selectedGroup._id}/contacts/bulk-add`,
                              {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  contacts: uniqueContacts,
                                }),
                              }
                            );

                            const res = await resp.json();

                            if (resp.ok && res.success) {
                              setImportStatus({
                                success: true,
                                message: `Successfully added ${
                                  res.added || uniqueContacts.length
                                } contact(s)`,
                              });
                              // Reset file input
                              fileInput.value = "";
                              setSelectedFileName("");

                              // Refresh contacts in the modal (preserve success message)
                              await handleSelectGroup(selectedGroup);

                              // Refresh groups list to update contact counts
                              await fetchAllGroups();

                              // Auto-refresh after 500ms to show updated data
                              setTimeout(async () => {
                                await handleSelectGroup(selectedGroup);
                              }, 500);

                              // Clear success message after 5 seconds
                              setTimeout(() => {
                                setImportStatus(null);
                              }, 5000);
                            } else {
                              setImportStatus({
                                success: false,
                                error: res.error || "Failed to import contacts",
                              });
                            }
                          } catch (error) {
                            console.error("Error processing file:", error);
                            setImportStatus({
                              success: false,
                              error:
                                "Error processing file. Please check the file format.",
                            });
                          } finally {
                            setUploadingCsv(false);
                          }
                        }}
                        className="flex items-center gap-2 mb-3"
                      >
                        <input
                          type="file"
                          id="csv-hidden-input-super"
                          name="file"
                          className="hidden"
                          accept=".csv,.xls,.xlsx"
                          disabled={uploadingCsv}
                          onChange={(e) =>
                            setSelectedFileName(e.target.files?.[0]?.name || "")
                          }
                        />
                        <label
                          htmlFor="csv-hidden-input-super"
                          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Choose File
                        </label>
                        <span className="text-xs text-gray-500 max-w-[200px] truncate">
                          {selectedFileName || "No file chosen"}
                        </span>
                        <button
                          disabled={uploadingCsv}
                          type="submit"
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {uploadingCsv ? "Uploading..." : "Upload CSV/XLSX"}
                        </button>
                      </form>
                    </div>
                    {importStatus && (
                      <div
                        className={`mb-3 px-3 py-2 rounded-lg text-sm ${
                          importStatus.success
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {importStatus.message || importStatus.error}
                      </div>
                    )}
                    {/* Filter + Select all */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={superSearch}
                          onChange={(e) => setSuperSearch(e.target.value)}
                          placeholder="Filter contacts by name, phone, email"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">
                          🔎
                        </span>
                      </div>
                      {(() => {
                        const normalized = superSearch.trim().toLowerCase();
                        const visible = (contacts || []).filter((c) => {
                          // Search filter
                          if (normalized) {
                            const name = String(c.name || "").toLowerCase();
                            const phone = String(c.phone || "").toLowerCase();
                            const email = String(c.email || "").toLowerCase();
                            if (
                              !name.includes(normalized) &&
                              !phone.includes(normalized) &&
                              !email.includes(normalized)
                            ) {
                              return false;
                            }
                          }
                          
                          // Assignment filter
                          const isAssigned = assignedContactIds.has(String(c._id));
                          if (assignmentFilter === "assigned" && !isAssigned) {
                            return false;
                          }
                          if (assignmentFilter === "notAssigned" && isAssigned) {
                            return false;
                          }
                          
                          return true;
                        });
                        const ids = visible.map((c) => c._id);
                        const allSelected =
                          ids.length > 0 &&
                          ids.every((id) => assignContacts.includes(id));
                        return (
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={() => {
                                setAssignContacts((prev) => {
                                  if (allSelected) {
                                    const set = new Set(ids);
                                    return prev.filter((id) => !set.has(id));
                                  }
                                  const set = new Set(prev);
                                  ids.forEach((id) => set.add(id));
                                  return Array.from(set);
                                });
                              }}
                              className="accent-green-600"
                            />
                            Select All ({ids.length})
                          </label>
                        );
                      })()}
                      <div className="text-xs text-gray-500">
                        Selected {assignContacts.length}
                      </div>
                    </div>
                    
                    {/* Assignment Filter Buttons */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-gray-700">Filter by assignment:</span>
                      {[
                        { key: "all", label: "All" },
                        { key: "assigned", label: "Already Assigned" },
                        { key: "notAssigned", label: "Not Assigned" },
                      ].map((filter) => (
                        <button
                          key={filter.key}
                          onClick={() => setAssignmentFilter(filter.key)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            assignmentFilter === filter.key
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto thin-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {loadingContacts ? (
                          <div className="text-gray-400 col-span-full text-center py-8">
                            Loading contacts...
                          </div>
                        ) : contacts.length === 0 ? (
                          <div className="text-gray-400 col-span-full text-center py-8">
                            No contacts.
                          </div>
                        ) : (
                          contacts
                            .filter((c) => {
                              // Search filter
                              const q = superSearch.trim().toLowerCase();
                              if (q) {
                                const name = String(c.name || "").toLowerCase();
                                const phone = String(c.phone || "").toLowerCase();
                                const email = String(c.email || "").toLowerCase();
                                if (
                                  !name.includes(q) &&
                                  !phone.includes(q) &&
                                  !email.includes(q)
                                ) {
                                  return false;
                                }
                              }
                              
                              // Assignment filter
                              const isAssigned = assignedContactIds.has(String(c._id));
                              if (assignmentFilter === "assigned" && !isAssigned) {
                                return false;
                              }
                              if (assignmentFilter === "notAssigned" && isAssigned) {
                                return false;
                              }
                              
                              return true;
                            })
                            .map((contact) => {
                              const isAssigned = assignedContactIds.has(String(contact._id));
                              return (
                                <div
                                  key={contact._id}
                                  className={`border rounded-lg p-3 flex flex-col transition-colors ${
                                    assignContacts.includes(contact._id)
                                      ? "border-blue-500 bg-blue-50"
                                      : isAssigned
                                      ? "border-green-300 bg-green-50"
                                      : "border-gray-200 bg-white"
                                  }`}
                                >
                                  <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={assignContacts.includes(
                                        contact._id
                                      )}
                                      onChange={() => {
                                        setAssignContacts((prev) =>
                                          prev.includes(contact._id)
                                            ? prev.filter(
                                                (id) => id !== contact._id
                                              )
                                            : [...prev, contact._id]
                                        );
                                      }}
                                      className="mt-1 accent-blue-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        {contact.name && (
                                          <div className="font-semibold text-sm text-gray-900 truncate">
                                            {contact.name}
                                          </div>
                                        )}
                                        {isAssigned && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Assigned
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-600 truncate">
                                        {contact.phone}
                                      </div>
                                      {contact.email && (
                                        <div className="text-xs text-gray-500 truncate">
                                          {contact.email}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                      {(() => {
                        // Check if any selected contacts are already assigned
                        const selectedAssigned = assignContacts.some((id) =>
                          assignedContactIds.has(String(id))
                        );
                        const selectedNotAssigned = assignContacts.some(
                          (id) => !assignedContactIds.has(String(id))
                        );
                        const buttonText =
                          selectedAssigned && selectedNotAssigned
                            ? "Assign/Reassign Checked"
                            : selectedAssigned
                            ? "Reassign Checked Contacts"
                            : "Assign Checked Contacts";

                        return (
                          <button
                            disabled={
                              assignContacts.length === 0 || assigningContacts
                            }
                            className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-700 transition-colors flex items-center gap-2"
                            onClick={async () => {
                              try {
                                setAssigningContacts(true);
                                const token = sessionStorage.getItem("clienttoken");
                                const response = await fetch(
                                  `https://aitotabackend-sih2.onrender.com/api/v1/client/groups/${selectedGroup._id}/assign?owner=assign`,
                                  {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      contactIds: assignContacts,
                                      agentId: agent._id,
                                      humanAgentId: agent._id,
                                    }),
                                  }
                                );
                                const result = await response.json();
                                if (result.success) {
                                  // Refresh contacts to show updated assignments
                                  await handleSelectGroup(selectedGroup);
                                  setAssignContacts([]);
                                  alert(
                                    result.message ||
                                      `Successfully ${
                                        selectedAssigned ? "reassigned" : "assigned"
                                      } ${assignContacts.length} contact(s)`
                                  );
                                } else {
                                  alert(
                                    result.error || "Failed to assign contacts"
                                  );
                                }
                              } catch (error) {
                                console.error("Error assigning contacts:", error);
                                alert(
                                  "Failed to assign contacts. Please try again."
                                );
                              } finally {
                                setAssigningContacts(false);
                              }
                            }}
                          >
                            {assigningContacts ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              buttonText
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

HumanAgentDetails.propTypes = {
  agentId: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default HumanAgentDetails;
