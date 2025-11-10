import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../../config";
import LeadsDisposition from "./LeadsDisposition.jsx";

function HumanAgentMyDials() {
  const [activeTab, setActiveTab] = useState("ai");
  const [activeSection, setActiveSection] = useState("ai-leads"); // "ai-leads" or "groups"
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialsReport, setDialsReport] = useState({});
  const [dialsDone, setDialsDone] = useState([]);
  const [dialsLeads, setDialsLeads] = useState({});
  const [selectedLeadCategory, setSelectedLeadCategory] = useState(null);
  const [leadDetails, setLeadDetails] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [contacts, setContacts] = useState([]);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsTotalPages, setContactsTotalPages] = useState(1);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [groupContacts, setGroupContacts] = useState([]);
  const [groupContactsPage, setGroupContactsPage] = useState(1);
  const [groupContactsTotalPages, setGroupContactsTotalPages] = useState(1);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [groupContactsMap, setGroupContactsMap] = useState({}); // Map of groupId -> contacts array
  const [loadingGroupContacts, setLoadingGroupContacts] = useState({}); // Track which groups are loading
  const [dispoMap, setDispoMap] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const DISPO_OPTIONS = [
    "payment_pending",
    "Document_pending",
    "call_back_schedule",
    "information_shared",
    "follow_up_required",
    "call_back_due",
    "whatsapp_sent",
    "interested_waiting_confimation",
    "admission_confirmed",
    "payment_recieved",
    "course_started",
    "not_interested",
    "joined_another_institute",
    "dropped_the_plan",
    "dnd",
    "unqualified_lead",
    "wrong_number",
    "invalid_number",
    "postpone",
    "no_response",
    "call_busy",
    "not_reachable",
    "switched_off",
    "out_of_coverage",
    "call_disconnected",
    "call_later",
  ];

  // Map leadStatus to category and subCategory
  const getDispositionMapping = (leadStatus) => {
    const mapping = {
      // Connected - Hot Leads
      payment_pending: { category: "connected", subCategory: "hotLeads" },
      Document_pending: { category: "connected", subCategory: "hotLeads" },
      // Connected - Warm Leads
      call_back_schedule: { category: "connected", subCategory: "warmLeads" },
      information_shared: { category: "connected", subCategory: "warmLeads" },
      follow_up_required: { category: "connected", subCategory: "warmLeads" },
      // Connected - Follow Up
      call_back_due: { category: "connected", subCategory: "followUp" },
      whatsapp_sent: { category: "connected", subCategory: "followUp" },
      interested_waiting_confimation: {
        category: "connected",
        subCategory: "followUp",
      },
      // Connected - Converted
      admission_confirmed: { category: "connected", subCategory: "converted" },
      payment_recieved: { category: "connected", subCategory: "converted" },
      course_started: { category: "connected", subCategory: "converted" },
      // Connected - Closed/Lost
      not_interested: { category: "connected", subCategory: "closedLost" },
      joined_another_institute: {
        category: "connected",
        subCategory: "closedLost",
      },
      dropped_the_plan: { category: "connected", subCategory: "closedLost" },
      dnd: { category: "connected", subCategory: "closedLost" },
      unqualified_lead: { category: "connected", subCategory: "closedLost" },
      wrong_number: { category: "connected", subCategory: "closedLost" },
      invalid_number: { category: "connected", subCategory: "closedLost" },
      // Connected - Future Prospect
      postpone: { category: "connected", subCategory: "futureProspect" },
      // Not Connected - DNP
      no_response: { category: "notConnected", subCategory: "dnp" },
      call_busy: { category: "notConnected", subCategory: "dnp" },
      // Not Connected - CNC
      not_reachable: { category: "notConnected", subCategory: "cnc" },
      switched_off: { category: "notConnected", subCategory: "cnc" },
      out_of_coverage: { category: "notConnected", subCategory: "cnc" },
      // Not Connected - Other
      call_disconnected: { category: "notConnected", subCategory: "other" },
      call_later: { category: "notConnected", subCategory: "other" },
    };
    return (
      mapping[leadStatus] || { category: "notConnected", subCategory: "other" }
    );
  };

  const token = useMemo(() => sessionStorage.getItem("usertoken") || "", []);
  const humanAgentId = useMemo(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("userData") || "{}");
      return u?.id || "";
    } catch (_) {
      return "";
    }
  }, []);
  const selectedCampaign = useMemo(
    () =>
      selectedCampaignId
        ? (campaigns || []).find((c) => c.campaignId === selectedCampaignId)
        : null,
    [campaigns, selectedCampaignId]
  );

  const fetchAssignedCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      const url = new URL(`https://aitotabackend-sih2.onrender.com/human-agent/assigned-campaigns`);
      if (filter) url.searchParams.set("filter", filter);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || json?.success === false)
        throw new Error(
          json?.error || json?.message || "Failed to load campaigns"
        );
      setCampaigns(json?.data || []);
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const buildDateQuery = () => {
    if (!filter || filter === "all") return "";
    return `filter=${encodeURIComponent(filter)}`;
  };

  const fetchMyReport = async () => {
    try {
      setLoading(true);
      setError("");
      const q = buildDateQuery();
      const headers = { Authorization: `Bearer ${token}` };
      const [reportRes, doneRes] = await Promise.all([
        fetch(`https://aitotabackend-sih2.onrender.com/human-agent/dials/report${q ? `?${q}` : ""}`, {
          headers,
        }),
        fetch(`https://aitotabackend-sih2.onrender.com/human-agent/dials/done${q ? `?${q}` : ""}`, {
          headers,
        }),
      ]);
      const reportJson = await reportRes.json();
      const doneJson = await doneRes.json();
      if (!reportRes.ok || reportJson?.success === false) {
        throw new Error(
          reportJson?.error || reportJson?.message || "Failed to load report"
        );
      }
      if (!doneRes.ok || doneJson?.success === false) {
        throw new Error(
          doneJson?.error || doneJson?.message || "Failed to load sales done"
        );
      }
      setDialsReport(reportJson?.data || {});
      setDialsDone(doneJson?.data || []);
    } catch (e) {
      setError(e?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const q = buildDateQuery();
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(
        `https://aitotabackend-sih2.onrender.com/human-agent/dials/leads${q ? `?${q}` : ""}`,
        { headers }
      );
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || json?.message || "Failed to load leads");
      }
      setDialsLeads(json?.data || {});
    } catch (e) {
      setError(e?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadDetails = async (category) => {
    try {
      setLoadingLeads(true);
      const q = buildDateQuery();
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(
        `https://aitotabackend-sih2.onrender.com/human-agent/dials/leads${q ? `?${q}` : ""}`,
        { headers }
      );
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || data?.message || "Failed to load leads");
      }
      const items = data.data?.[category]?.data || [];
      setLeadDetails(items);
      setSelectedLeadCategory(category);
    } catch (e) {
      setError(e?.message || "Failed to load lead details");
    } finally {
      setLoadingLeads(false);
    }
  };

  const saveDisposition = async (rowKey, contact) => {
    try {
      const selected = dispoMap[rowKey];
      if (!selected) return;
      const phone = contact.phone || contact.number || "";
      const name = contact.name || contact.contactName || "";
      if (!phone) return;
      if (savingKey !== null) return;
      setSavingKey(rowKey);

      // Get category and subCategory from mapping
      const mapping = getDispositionMapping(selected);

      const body = {
        category: mapping.category,
        subCategory: mapping.subCategory,
        phoneNumber: phone,
        contactName: name || "",
        leadStatus: selected,
        date: new Date().toISOString(),
      };
      const res = await fetch(`https://aitotabackend-sih2.onrender.com/human-agent/dials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json?.success !== true) {
        throw new Error(
          json?.message || json?.error || "Failed to save disposition"
        );
      }
      // Update UI inline
      try {
        setContacts((prev) =>
          (prev || []).map((c, i) =>
            i === rowKey ? { ...c, leadStatus: selected, __locked: true } : c
          )
        );
      } catch (_) {}
      toast.success("Saved");
    } catch (e) {
      setError(e?.message || "Failed to save disposition");
      toast.error(e?.message || "Failed to save disposition");
    } finally {
      setSavingKey(null);
    }
  };

  const fetchAssignedContacts = async (page = 1) => {
    if (!selectedCampaignId) return;
    try {
      setLoading(true);
      setError("");
      const url = new URL(`https://aitotabackend-sih2.onrender.com/human-agent/assigned-contacts`);
      url.searchParams.set("campaignId", selectedCampaignId);
      if (filter) url.searchParams.set("filter", filter);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "20");
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || json?.success === false)
        throw new Error(
          json?.error || json?.message || "Failed to load contacts"
        );
      setContacts(json?.data || []);
      setContactsPage(json?.pagination?.currentPage || 1);
      setContactsTotalPages(json?.pagination?.totalPages || 1);
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedGroups = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`https://aitotabackend-sih2.onrender.com/human-agent/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(
          json?.error || json?.message || "Failed to load groups"
        );
      }
      const groups = json?.data || [];
      const myId = String(humanAgentId || "");
      const onlyAssigned = groups.filter((g) => {
        const ownerIsMe =
          String(g?.ownerType) === "humanAgent" && String(g?.ownerId) === myId;
        const assignedList = Array.isArray(g?.assignedHumanAgents)
          ? g.assignedHumanAgents.map((a) => String(a?._id || a))
          : [];
        const isAssignedToMe = assignedList.includes(myId);
        return isAssignedToMe && !ownerIsMe; // exclude self-created; include only assigned
      });
      setAssignedGroups(onlyAssigned);
    } catch (e) {
      setError(e?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupContacts = async (groupIdParam) => {
    const gid = groupIdParam || selectedGroupId;
    if (!gid) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `https://aitotabackend-sih2.onrender.com/human-agent/groups/${gid}/contacts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(
          json?.error || json?.message || "Failed to load contacts"
        );
      }
      // This endpoint returns array of contacts without pagination
      setContacts(Array.isArray(json?.data) ? json.data : []);
      setContactsPage(1);
      setContactsTotalPages(1);
    } catch (e) {
      setError(e?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch assigned groups using groups?owner=assign (contacts fetched separately)
  const fetchAssignedGroupContacts = async (page = 1, filter = "") => {
    try {
      setLoading(true);
      setError("");
      const url = new URL(`https://aitotabackend-sih2.onrender.com/human-agent/groups`);
      url.searchParams.set("owner", "assign");
      if (filter) {
        url.searchParams.set("filter", filter);
      }
  
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || json?.success === false)
        throw new Error(
          json?.error || json?.message || "Failed to load groups"
        );
  
      const allGroups = json?.data || [];
  
      // Simple pagination in frontend (adjust if backend supports pagination)
      const limitNum = 20;
      const skip = (page - 1) * limitNum;
      const paginatedGroups = allGroups.slice(skip, skip + limitNum);
      const totalPages = Math.ceil(allGroups.length / limitNum);
  
      setGroupContacts(paginatedGroups);
      setGroupContactsPage(page);
      setGroupContactsTotalPages(totalPages);
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };  

  // Fetch contacts for a specific group using /groups/:groupId/contacts
  const fetchGroupContactsForDisplay = async (groupId) => {
    if (!groupId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `https://aitotabackend-sih2.onrender.com/human-agent/groups/${groupId}/contacts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(
          json?.error || json?.message || "Failed to load contacts"
        );
      }
      // Return contacts array - will be stored per group
      return Array.isArray(json?.data) ? json.data : [];
    } catch (e) {
      setError(e?.message || "Failed to load contacts");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "assigned") {
      // For assigned: show groups assigned to this human agent (not self-created)
      fetchAssignedGroups();
    }
  }, [activeTab, filter]);

  // Ensure AI Leads campaign cards load when AI tab is opened
  useEffect(() => {
    if (activeTab === "ai" && activeSection === "ai-leads") {
      fetchAssignedCampaigns();
    }
  }, [activeTab, activeSection, filter]);

  useEffect(() => {
    if (
      activeTab === "ai" &&
      activeSection === "ai-leads" &&
      selectedCampaignId
    ) {
      fetchAssignedContacts(1);
    }
  }, [activeTab, activeSection, filter, selectedCampaignId]);

  // Fetch assigned group contacts when Groups section is active
  useEffect(() => {
    if (activeTab === "ai" && activeSection === "groups") {
      fetchAssignedGroupContacts(1, filter);
    }
  }, [activeTab, activeSection, filter]);

  // Load My Report
  useEffect(() => {
    if (activeTab === "report") {
      fetchMyReport();
    }
  }, [activeTab, filter]);

  // Load My Leads
  useEffect(() => {
    if (activeTab === "leads") {
      fetchMyLeads();
    }
  }, [activeTab, filter]);

  // Reset selection when leaving AI tab
  useEffect(() => {
    if (activeTab !== "ai") {
      setSelectedCampaignId("");
      setContacts([]);
    }
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">My Dials</h2>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 days</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              activeTab === "ai"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("ai")}
          >
            My Assigned
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              activeTab === "calllog"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("calllog")}
          >
            My Call Log
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              activeTab === "leads"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("leads")}
          >
            My Leads
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              activeTab === "report"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab("report")}
          >
            My Reports
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        {false && activeTab === "assigned" && (
          <div>
            {loading && assignedGroups.length === 0 && (
              <div className="text-gray-600">Loading...</div>
            )}
            {!loading && assignedGroups.length === 0 && (
              <div className="text-gray-600">No assigned groups</div>
            )}
            {assignedGroups.length > 0 && !selectedGroupId && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedGroups.map((g) => (
                  <button
                    key={g._id}
                    type="button"
                    onClick={async () => {
                      setSelectedGroupId(g._id);
                      setSelectedGroupName(g.name || "Group");
                      await fetchGroupContacts(g._id);
                    }}
                    className="text-left bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-base font-semibold text-gray-900 truncate">
                        {g.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {g.createdAt
                          ? new Date(g.createdAt).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                    {g.description ? (
                      <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {g.description}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {g.contactsCount || (g.contacts || []).length || 0}{" "}
                        contacts
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Assigned to you
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedGroupId && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-semibold text-gray-900 m-0">
                    {selectedGroupName}
                  </h3>
                  <button
                    type="button"
                    className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                    onClick={() => {
                      setSelectedGroupId("");
                      setSelectedGroupName("");
                      setContacts([]);
                    }}
                  >
                    Back
                  </button>
                </div>
                <div className="text-sm text-gray-500 mb-3">Assigned Leads</div>
                {loading && <div className="text-gray-600">Loading...</div>}
                {!loading && contacts.length === 0 && (
                  <div className="text-gray-600">No leads</div>
                )}
                {contacts.length > 0 && (
                  <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Current
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Disposition
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contacts.map((ct, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {ct.name || "-"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {ct.phone || ct.number || "-"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {ct.leadStatus || "-"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {ct.createdAt
                                ? new Date(ct.createdAt).toLocaleDateString()
                                : "-"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {ct.createdAt
                                ? new Date(ct.createdAt).toLocaleTimeString()
                                : "-"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <select
                                  className="border rounded px-2 py-1 text-sm"
                                  value={dispoMap[idx] ?? ""}
                                  onChange={(e) =>
                                    setDispoMap((m) => ({
                                      ...m,
                                      [idx]: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select</option>
                                  {DISPO_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className={`px-3 py-1 rounded text-xs ${
                                    savingKey === idx || ct.__locked
                                      ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                                      : "bg-black text-white hover:bg-gray-800"
                                  }`}
                                  onClick={() => saveDisposition(idx, ct)}
                                  disabled={savingKey === idx || ct.__locked}
                                >
                                  {savingKey === idx
                                    ? "Saving..."
                                    : ct.__locked
                                    ? "Saved"
                                    : "Save"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "ai" && (
          <div>
            {/* Section Tabs */}
            <div className="mb-6 flex gap-3 border-b border-gray-200">
              <button
                className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                  activeSection === "ai-leads"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => {
                  setActiveSection("ai-leads");
                  setSelectedCampaignId("");
                  setContacts([]);
                }}
              >
                AI Leads
              </button>
              <button
                className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                  activeSection === "groups"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => {
                  setActiveSection("groups");
                  setGroupContacts([]);
                }}
              >
                Groups
              </button>
            </div>

            {/* AI Leads Section */}
            {activeSection === "ai-leads" && (
              <>
                {!selectedCampaignId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(campaigns || []).map((c) => (
                      <button
                        key={c.campaignId}
                        type="button"
                        className="text-left bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition cursor-pointer"
                        onClick={async () => {
                          setSelectedCampaignId(c.campaignId);
                          await fetchAssignedContacts(1);
                        }}
                        aria-label={`Open leads for ${c.campaignName}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-base font-semibold text-gray-900">
                              {c.campaignName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {c.category || "General"}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {c.lastAssignedAt
                              ? new Date(c.lastAssignedAt).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-xl font-bold text-blue-700">
                              {c.totalAssignedContacts || 0}
                            </div>
                            <div className="text-[11px] text-blue-700">
                              Assigned
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-xl font-bold text-green-700">
                              {c.connectedContacts || 0}
                            </div>
                            <div className="text-[11px] text-green-700">
                              Connected
                            </div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="text-xl font-bold text-orange-700">
                              {c.connectionRate || 0}%
                            </div>
                            <div className="text-[11px] text-orange-700">
                              Rate
                            </div>
                          </div>
                          <div className="col-span-3 text-center mt-2">
                            <span className="text-xs text-gray-600">
                              Updated by you:{" "}
                            </span>
                            <span className="text-xs font-semibold">
                              {c.updatedByMe || 0}
                            </span>
                            <span className="text-xs text-gray-600">
                              {" "}
                              / {c.totalAssignedContacts || 0}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                    {!loading && campaigns.length === 0 && (
                      <div className="text-gray-600">No AI leads</div>
                    )}
                    {loading && <div className="text-gray-600">Loading...</div>}
                  </div>
                )}

                {selectedCampaignId && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-semibold text-gray-900 m-0">
                        {selectedCampaign?.campaignName || "Campaign"}
                      </h3>
                      <button
                        type="button"
                        className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                        onClick={() => {
                          setSelectedCampaignId("");
                          setContacts([]);
                        }}
                      >
                        Back
                      </button>
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      {selectedCampaign?.lastAssignedAt
                        ? new Date(
                            selectedCampaign.lastAssignedAt
                          ).toLocaleDateString()
                        : ""}
                    </div>

                    {loading && <div className="text-gray-600">Loading...</div>}
                    {!loading && contacts.length === 0 && (
                      <div className="text-gray-600">No leads</div>
                    )}
                    {contacts.length > 0 && (
                      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Phone
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Assigned At
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Time
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Disposition
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {contacts.map((ct, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {ct.name || ct.contactName || "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {ct.phone || ct.number || "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {ct.leadStatus || "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {ct.assignedAt
                                    ? new Date(
                                        ct.assignedAt
                                      ).toLocaleDateString()
                                    : "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {ct.assignedAt
                                    ? new Date(
                                        ct.assignedAt
                                      ).toLocaleTimeString()
                                    : "-"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <select
                                      className="border rounded px-2 py-1 text-sm"
                                      value={
                                        dispoMap[idx] ?? (ct.leadStatus || "")
                                      }
                                      onChange={(e) =>
                                        setDispoMap((m) => ({
                                          ...m,
                                          [idx]: e.target.value,
                                        }))
                                      }
                                    >
                                      <option value="">Select</option>
                                      {DISPO_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      className={`px-3 py-1 rounded text-xs ${
                                        savingKey === idx
                                          ? "bg-gray-300 text-gray-700 cursor-wait"
                                          : "bg-black text-white hover:bg-gray-800"
                                      }`}
                                      onClick={() => saveDisposition(idx, ct)}
                                      disabled={savingKey === idx}
                                    >
                                      {savingKey === idx ? "Saving..." : "Save"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex justify-end gap-2 mt-4 p-3">
                          <button
                            className="px-3 py-1 border rounded-md text-sm"
                            disabled={contactsPage <= 1}
                            onClick={() =>
                              fetchAssignedContacts(contactsPage - 1)
                            }
                          >
                            Prev
                          </button>
                          <div className="text-sm text-gray-600 px-2 py-1">
                            Page {contactsPage} of {contactsTotalPages}
                          </div>
                          <button
                            className="px-3 py-1 border rounded-md text-sm"
                            disabled={contactsPage >= contactsTotalPages}
                            onClick={() =>
                              fetchAssignedContacts(contactsPage + 1)
                            }
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Groups Section - Group Cards with Assigned Contacts */}
            {activeSection === "groups" && (
              <div>
                {loading && groupContacts.length === 0 && (
                  <div className="text-gray-600">
                    Loading assigned groups...
                  </div>
                )}
                {!loading && groupContacts.length === 0 && (
                  <div className="text-gray-600">
                    No assigned contacts from groups
                  </div>
                )}
                {groupContacts.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupContacts.map((group) => (
                        <div
                          key={group._id}
                          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition"
                        >
                          {/* Group Card Header */}
                          <div className="mb-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-base font-semibold text-gray-900">
                                  {group.name}
                                </div>
                                {group.category && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {group.category}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={async () => {
                                  const isExpanding =
                                    expandedGroupId !== group._id;
                                  setExpandedGroupId(
                                    isExpanding ? group._id : null
                                  );

                                  // Fetch contacts when expanding (if not already loaded)
                                  if (
                                    isExpanding &&
                                    !groupContactsMap[group._id]
                                  ) {
                                    setLoadingGroupContacts((prev) => ({
                                      ...prev,
                                      [group._id]: true,
                                    }));
                                    const contacts =
                                      await fetchGroupContactsForDisplay(
                                        group._id
                                      );
                                    setGroupContactsMap((prev) => ({
                                      ...prev,
                                      [group._id]: contacts,
                                    }));
                                    setLoadingGroupContacts((prev) => {
                                      const next = { ...prev };
                                      delete next[group._id];
                                      return next;
                                    });
                                  }
                                }}
                                className="text-gray-500 hover:text-gray-700 text-lg"
                              >
                                {expandedGroupId === group._id ? "▼" : "▶"}
                              </button>
                            </div>
                            {group.description && (
                              <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {group.description}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {group.assignedContactsCount || 0} assigned
                                contact
                                {group.assignedContactsCount !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Contacts List */}
                          {expandedGroupId === group._id && (
                            <div className="mt-4 border-t pt-4 max-h-96 overflow-y-auto">
                              {loadingGroupContacts[group._id] ? (
                                <div className="text-sm text-gray-500 py-4 text-center">
                                  Loading contacts...
                                </div>
                              ) : !groupContactsMap[group._id] ||
                                groupContactsMap[group._id].length === 0 ? (
                                <div className="text-sm text-gray-500 py-4 text-center">
                                  No assigned contacts
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {groupContactsMap[group._id].map(
                                    (contact, idx) => (
                                      <div
                                        key={contact._id || idx}
                                        className="border rounded-lg p-3 bg-gray-50"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">
                                              {contact.name || "No name"}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                              {contact.phone}
                                            </div>
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {contact.assignedAt
                                              ? new Date(
                                                  contact.assignedAt
                                                ).toLocaleDateString()
                                              : ""}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                          <select
                                            className="border rounded px-2 py-1 text-xs flex-1"
                                            value={
                                              dispoMap[`${group._id}-${idx}`] ??
                                              (contact.leadStatus || "")
                                            }
                                            onChange={(e) =>
                                              setDispoMap((m) => ({
                                                ...m,
                                                [`${group._id}-${idx}`]:
                                                  e.target.value,
                                              }))
                                            }
                                          >
                                            <option value="">Select</option>
                                            {DISPO_OPTIONS.map((opt) => (
                                              <option key={opt} value={opt}>
                                                {opt}
                                              </option>
                                            ))}
                                          </select>
                                          <button
                                            className={`px-2 py-1 rounded text-xs ${
                                              savingKey ===
                                                `${group._id}-${idx}` ||
                                              contact.__locked
                                                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                                                : "bg-black text-white hover:bg-gray-800"
                                            }`}
                                            onClick={() =>
                                              saveDisposition(
                                                `${group._id}-${idx}`,
                                                contact
                                              )
                                            }
                                            disabled={
                                              savingKey ===
                                                `${group._id}-${idx}` ||
                                              contact.__locked
                                            }
                                          >
                                            {savingKey === `${group._id}-${idx}`
                                              ? "Saving..."
                                              : contact.__locked
                                              ? "Saved"
                                              : "Save"}
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <button
                        className="px-3 py-1 border rounded-md text-sm"
                        disabled={groupContactsPage <= 1}
                        onClick={() =>
                          fetchAssignedGroupContacts(groupContactsPage - 1)
                        }
                      >
                        Prev
                      </button>
                      <div className="text-sm text-gray-600 px-2 py-1">
                        Page {groupContactsPage} of {groupContactsTotalPages}
                      </div>
                      <button
                        className="px-3 py-1 border rounded-md text-sm"
                        disabled={groupContactsPage >= groupContactsTotalPages}
                        onClick={() =>
                          fetchAssignedGroupContacts(groupContactsPage + 1)
                        }
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === "calllog" && (
          <div>
            <h1>My Call Log</h1>
          </div>
        )}
        {activeTab === "leads" && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Leads Disposition
                </h3>
              </div>
              <LeadsDisposition
                dialsLeads={dialsLeads}
                fetchLeadDetails={fetchLeadDetails}
              />
            </div>

            {selectedLeadCategory && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {selectedLeadCategory?.replace(/([A-Z])/g, " $1").trim()}{" "}
                    Leads
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                      onClick={() => {
                        setSelectedLeadCategory(null);
                        setLeadDetails([]);
                      }}
                    >
                      Close
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() =>
                        selectedLeadCategory &&
                        fetchLeadDetails(selectedLeadCategory)
                      }
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
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leadDetails.map((lead, index) => (
                          <tr
                            key={lead._id || index}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {lead.name || lead.contactName || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {lead.phoneNumber ||
                                lead.contactNumber ||
                                lead.phone ||
                                "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {lead.leadStatus || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {lead.duration ? `${lead.duration}s` : "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {lead.createdAt
                                ? new Date(lead.createdAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {lead.createdAt
                                ? new Date(lead.createdAt).toLocaleTimeString()
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
          </div>
        )}
        {activeTab === "report" && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
          </div>
        )}
      </div>
    </div>
  );
}

export default HumanAgentMyDials;
