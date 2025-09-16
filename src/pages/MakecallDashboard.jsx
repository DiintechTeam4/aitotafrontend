import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_BASE_URL_MAKECALL } from "../config";

const MakecallDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [callForm, setCallForm] = useState({
    name: "",
    mobile: "",
    agentId: "", // Default agentKey
  });

  useEffect(() => {
    // Check if user is logged in
    const token = sessionStorage.getItem("makecallToken");
    const userData = sessionStorage.getItem("makecallUser");

    if (!token || !userData) {
      navigate("/makecall/login");
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = sessionStorage.getItem("makecallToken");
      const response = await fetch(
        `${API_BASE_URL_MAKECALL}/makecall/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        toast.error(data.message || "Failed to fetch dashboard data");
        if (response.status === 401) {
          sessionStorage.removeItem("makecallToken");
          sessionStorage.removeItem("makecallUser");
          sessionStorage.removeItem("makecallApiKey");
          navigate("/makecall/login");
        }
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("makecallToken");
    sessionStorage.removeItem("makecallUser");
    sessionStorage.removeItem("makecallApiKey");
    navigate("/makecall/login");
    toast.success("Logged out successfully");
  };

  const handleCallFormChange = (e) => {
    const { name, value } = e.target;
    setCallForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMakeCall = async (e) => {
    e.preventDefault();

    if (!callForm.mobile || !callForm.name || !callForm.agentId) {
      toast.error("Please fill in mobile number, name, and agent key");
      return;
    }

    try {
      setSubmitting(true);
      const token = sessionStorage.getItem("makecallToken");
      const response = await fetch(
        `${API_BASE_URL_MAKECALL}/makecall/calls/single`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: callForm.name,
            phone: callForm.mobile,
            agentId: callForm.agentId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Call initiated successfully!");
        setCallForm({ name: "", mobile: "", agentId: "" }); // Reset to default agentKey
        fetchDashboardData(); // Refresh dashboard data
      } else {
        toast.error(data.message || "Failed to make call");
      }
    } catch (error) {
      console.error("Make call error:", error);
      toast.error("Failed to make call");
    } finally {
      setSubmitting(false);
    }
  };

  const format = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString();
    } catch (_) {
      return "-";
    }
  };
  const formaTime = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_) {
      return "-";
    }
  };

  // Poll live status every 2s for current recent calls
  useEffect(() => {
    if (!dashboardData || !Array.isArray(dashboardData?.recentCalls)) return;

    let cancel = false;
    const token = sessionStorage.getItem("makecallToken");

    const poll = async () => {
      try {
        const latest = (dashboardData.recentCalls || []).find(
          (x) => x && x.uniqueId
        );
        const items = latest ? [latest] : [];
        const results = await Promise.all(
          items.map(async (it) => {
            try {
              const r = await fetch(
                `${API_BASE_URL_MAKECALL}/makecall/calls/single/live-status`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ uniqueId: it.uniqueId }),
                }
              );
              const b = await r.json();
              if (b?.success && b?.data) {
                return {
                  id: it.uniqueId,
                  status: b.data.status,
                  disposition: b.data.disposition,
                };
              }
            } catch (_) {}
            return null;
          })
        );
        if (!cancel) {
          const map = new Map();
          results.filter(Boolean).forEach((u) => map.set(u.id, u));
          if (map.size) {
            setDashboardData((prev) => {
              if (!prev) return prev;
              const next = {
                ...prev,
                recentCalls: [...(prev.recentCalls || [])],
              };
              next.recentCalls = next.recentCalls.map((rc) =>
                map.has(rc.uniqueId)
                  ? {
                      ...rc,
                      status: map.get(rc.uniqueId).status,
                      disposition: map.get(rc.uniqueId).disposition,
                    }
                  : rc
              );
              return next;
            });
          }
        }
      } catch (_) {}
    };

    const intId = setInterval(poll, 2000);
    poll();
    return () => {
      cancel = true;
      clearInterval(intId);
    };
  }, [dashboardData?.recentCalls]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Make Call Form */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
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
            Make a Call
          </h2>

          <form onSubmit={handleMakeCall} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={callForm.name}
                  onChange={handleCallFormChange}
                  placeholder="Enter your name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="mobile"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={callForm.mobile}
                  onChange={handleCallFormChange}
                  placeholder="Enter mobile number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="agentId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Agent Key
                </label>
                <input
                  type="text"
                  id="agentId"
                  name="agentId"
                  onChange={handleCallFormChange}
                  placeholder="Enter agent key (e.g., dc373a08)"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                submitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Calling...
                </span>
              ) : (
                "Make Call"
              )}
            </button>
          </form>

          {/*Logs Table*/}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Calls
              </h2>
              <button
                type="button"
                onClick={fetchDashboardData}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50"
                title="Refresh recent calls"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">S. No.</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Number</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Disposition</th>
                    <th className="py-2 pr-4">Unique ID</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboardData?.recentCalls || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-gray-500"
                      >
                        No calls yet
                      </td>
                    </tr>
                  ) : (
                    (dashboardData?.recentCalls || []).map((c, idx) => (
                      <tr
                        key={c.id || c.uniqueId || idx}
                        className="border-top border-gray-100"
                      >
                        <td className="py-2 pr-4 text-gray-700">{idx + 1}</td>
                        <td className="py-2 pr-4 text-gray-700">
                          {format(c.createdAt)}
                        </td>
                        <td className="py-2 pr-4 text-gray-900">
                          {formaTime(c.createdAt)}
                        </td>
                        <td className="py-2 pr-4 text-gray-900">
                          {c.name || c.contact_name || "-"}
                        </td>
                        <td className="py-2 pr-4 text-gray-900">
                          {c.mobile || "-"}
                        </td>
                        <td className="py-2 pr-4 capitalize">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              c.status === "ringing"
                                ? "bg-yellow-100 text-yellow-700"
                                : c.status === "ongoing"
                                ? "bg-blue-100 text-blue-700"
                                : c.status === "missed" ||
                                  c.status === "not_connected" ||
                                  c.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {c.status || "-"}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-700">
                          {c.disposition || "-"}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-600">
                          {c.uniqueId || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MakecallDashboard;
