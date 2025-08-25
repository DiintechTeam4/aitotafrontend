"use client";

import { useState, useEffect } from "react";
import {
  FiCalendar,
  FiClock,
  FiPhone,
  FiUser,
  FiFilter,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiPlay,
  FiPause,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { API_BASE_URL } from "../../../config";

const CallLogs = ({ agentId, clientId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("last7days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [agent, setAgent] = useState(null);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [showTranscriptPopup, setShowTranscriptPopup] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";

    // Handle decimal seconds by rounding to nearest whole number
    const roundedSeconds = Math.round(seconds);

    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTimeOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTranscriptDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLeadStatusColor = (status) => {
    const statusColors = {
      vvi: "bg-green-100 text-green-800",
      very_interested: "bg-green-100 text-green-800",
      maybe: "bg-yellow-100 text-yellow-800",
      medium: "bg-yellow-100 text-yellow-800",
      enrolled: "bg-blue-100 text-blue-800",
      junk_lead: "bg-red-100 text-red-800",
      not_required: "bg-gray-100 text-gray-800",
      enrolled_other: "bg-purple-100 text-purple-800",
      decline: "bg-red-100 text-red-800",
      not_eligible: "bg-orange-100 text-orange-800",
      wrong_number: "bg-gray-100 text-gray-800",
      hot_followup: "bg-pink-100 text-pink-800",
      cold_followup: "bg-indigo-100 text-indigo-800",
      schedule: "bg-teal-100 text-teal-800",
      not_connected: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getLeadStatusLabel = (status) => {
    const statusLabels = {
      vvi: "Very Very Interested",
      very_interested: "Very Interested",
      maybe: "Maybe",
      medium: "Medium",
      enrolled: "Enrolled",
      junk_lead: "Junk Lead",
      not_required: "Not Required",
      enrolled_other: "Enrolled Other",
      decline: "Decline",
      not_eligible: "Not Eligible",
      wrong_number: "Wrong Number",
      hot_followup: "Hot Followup",
      cold_followup: "Cold Followup",
      schedule: "Schedule",
      not_connected: "Not Connected",
    };
    return statusLabels[status] || status;
  };

  const fetchCallLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("clienttoken");
      if (!token) {
        throw new Error("Client token not found");
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      if (filter && filter !== "all") {
        params.append("filter", filter);
      } else if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const response = await fetch(
        `${API_BASE_URL}/client/agents/${agentId}/call-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch call logs");
      }

      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setStatistics(data.data.statistics);
        setAgent(data.data.agent);
        setTotalPages(data.data.pagination.totalPages);
        setTotalLogs(data.data.pagination.totalLogs);
      } else {
        throw new Error(data.error || "Failed to fetch call logs");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching call logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId && clientId) {
      fetchCallLogs();
    }
  }, [agentId, clientId, filter, startDate, endDate, currentPage]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleDateRangeChange = () => {
    setFilter("all");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openTranscriptPopup = (log) => {
    setSelectedTranscript(log);
    setShowTranscriptPopup(true);
  };

  const closeTranscriptPopup = () => {
    setShowTranscriptPopup(false);
    setSelectedTranscript(null);
  };

  if (!agentId || !clientId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Agent information not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-16 py-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiPhone className="w-5 h-5" />
            Call Logs
          </h3>
          {agent && (
            <p className="text-sm text-gray-600">
              Call history for {agent.agentName}
            </p>
          )}
        </div>
        <button
          onClick={fetchCallLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalCalls}
                </p>
              </div>
              <FiPhone className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.totalConnected}
                </p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Not Connected
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.totalNotConnected}
                </p>
              </div>
              <FiXCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Duration
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatTime(statistics.avgCallDuration)}
                </p>
              </div>
              <FiClock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {["today", "yesterday", "last7days", "last30days"].map(
              (filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => handleFilterChange(filterOption)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filter === filterOption
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filterOption
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Custom Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(startDate || endDate) && (
              <button
                onClick={handleDateRangeChange}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <FiRefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading call logs...</p>
        </div>
      )}

      {/* Call Logs Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <FiPhone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No call logs found for the selected period
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Logs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-4 h-4 text-gray-400" />
                            {formatDate(log.time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FiPhone className="w-4 h-4 text-gray-400" />
                            {log.mobile || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            {formatTime(log.duration)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeadStatusColor(
                              log.leadStatus
                            )}`}
                          >
                            {getLeadStatusLabel(log.leadStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => openTranscriptPopup(log)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <FiFileText className="w-4 h-4" />
                            <span>Transcript</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {currentPage} of {totalPages} ({totalLogs}{" "}
                    total logs)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Transcript Popup */}
      {showTranscriptPopup && selectedTranscript && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FiFileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Call Transcript
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedTranscript.mobile} -{" "}
                    {formatTranscriptDate(selectedTranscript.time)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeTranscriptPopup}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 pb-4">
              {selectedTranscript.transcript ? (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Conversation Transcript
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto max-h-[calc(90vh-120px)] pb-10">
                    {(() => {
                      const rawLines = selectedTranscript.transcript
                        .split("\n")
                        .filter((line) => line.trim());

                      const messages = [];
                      let current = null;

                      for (const line of rawLines) {
                        // Try to extract timestamp like [2025-08-16T07:20:20.885Z]
                        const tsMatch = line.match(/\[([^\]]+)\]/);
                        let ts = null;
                        if (tsMatch) {
                          const d = new Date(tsMatch[1]);
                          if (!isNaN(d.getTime())) {
                            ts = d.toLocaleTimeString();
                          }
                        }

                        // Remove timestamp prefix
                        const withoutTs = line.replace(/\[[^\]]+\]\s*/, "");

                        // Determine speaker and text
                        const colonIdx = withoutTs.indexOf(":");
                        let speaker = "System";
                        let text = withoutTs;
                        if (colonIdx !== -1) {
                          speaker = withoutTs.substring(0, colonIdx).trim();
                          text = withoutTs.substring(colonIdx + 1).trim();
                        }

                        const isAgent = /^(ai|agent)/i.test(speaker);
                        const isUser = /^(user|customer)/i.test(speaker);

                        // Group consecutive lines from same speaker
                        if (
                          current &&
                          current.role ===
                            (isAgent ? "agent" : isUser ? "user" : "system")
                        ) {
                          current.text += (current.text ? " " : "") + text;
                          current.ts = ts || current.ts;
                        } else {
                          if (current) messages.push(current);
                          current = {
                            role: isAgent
                              ? "agent"
                              : isUser
                              ? "user"
                              : "system",
                            text,
                            ts,
                          };
                        }
                      }
                      if (current) messages.push(current);

                      return (
                        <div className="space-y-3 pb-8">
                          {messages.map((m, idx) => (
                            <div
                              key={idx}
                              className={`flex ${
                                m.role === "user"
                                  ? "justify-end"
                                  : m.role === "agent"
                                  ? "justify-start"
                                  : "justify-center"
                              }`}
                            >
                              {m.role === "system" ? (
                                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {m.text}
                                </div>
                              ) : (
                                <div
                                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm shadow-sm ${
                                    m.role === "agent"
                                      ? "bg-white border border-gray-200 text-gray-800"
                                      : "bg-blue-600 text-white"
                                  }`}
                                >
                                  <div className="font-medium mb-1 text-xs opacity-75">
                                    {m.role === "agent" ? "Agent" : "User"}
                                    {m.ts && (
                                      <span
                                        className={`ml-2 ${
                                          m.role === "agent"
                                            ? "text-gray-400"
                                            : "text-blue-100"
                                        }`}
                                      >
                                        {m.ts}
                                      </span>
                                    )}
                                  </div>
                                  <div className="leading-relaxed">
                                    {m.text}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Transcript Available
                  </h4>
                  <p className="text-gray-600">
                    This call doesn't have a transcript recorded yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallLogs;
