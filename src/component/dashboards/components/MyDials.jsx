import { API_BASE_URL } from "../../../config";
import React, { useState, useEffect } from "react";
import {
  FiPhone,
  FiUsers,
  FiDollarSign,
  FiDownload,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiClock,
  FiUser,
  FiMapPin,
  FiBarChart2,
} from "react-icons/fi";

function MyDials() {
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [leads, setLeads] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch dials report data
  const fetchDialsReport = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      // Map frontend filter values to backend filter values
      let backendFilter = filter;
      if (filter === "today") backendFilter = "today";
      else if (filter === "yesterday") backendFilter = "yesterday";
      else if (filter === "last7days") backendFilter = "last7days";
      else if (filter === "custom") backendFilter = "custom";

      console.log("Sending filter to dials report API:", backendFilter);

      const response = await fetch(
        `${API_BASE_URL}/client/dials/report?filter=${backendFilter}${
          startDate && endDate
            ? `&startDate=${startDate}&endDate=${endDate}`
            : ""
        }`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReports([
            {
              id: 1,
              title: "Dials Report",
              period:
                filter === "today"
                  ? "Today"
                  : filter === "yesterday"
                  ? "Yesterday"
                  : filter === "last7days"
                  ? "Last 7 Days"
                  : "Custom Range",
              totalCalls: data.data.totalCalls,
              avgDuration:
                Math.round((data.data.avgCallDuration / 60) * 100) / 100 +
                " min",
              conversionRate:
                data.data.totalCalls > 0
                  ? Math.round(
                      (data.data.totalConnected / data.data.totalCalls) * 100
                    ) + "%"
                  : "0%",
              generatedAt: new Date().toISOString(),
              totalConnected: data.data.totalConnected,
              totalNotConnected: data.data.totalNotConnected,
              totalConversationTime: data.data.totalConversationTime,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching dials report:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads data
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("clienttoken");
      // Map frontend filter values to backend filter values
      let backendFilter = filter;
      if (filter === "today") backendFilter = "today";
      else if (filter === "yesterday") backendFilter = "yesterday";
      else if (filter === "last7days") backendFilter = "last7days";
      else if (filter === "custom") backendFilter = "custom";

      console.log("Sending filter to leads API:", backendFilter);

      const response = await fetch(
        `${API_BASE_URL}/client/dials/leads?filter=${backendFilter}${
          startDate && endDate
            ? `&startDate=${startDate}&endDate=${endDate}`
            : ""
        }`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Transform the leads data to match the expected format
          const transformedLeads = [];
          Object.keys(data.data).forEach((category) => {
            if (data.data[category].count > 0) {
              data.data[category].data.forEach((lead) => {
                transformedLeads.push({
                  id: lead._id || Math.random(),
                  name: lead.contactName || "Unknown",
                  company: "N/A",
                  phone: lead.phoneNumber || "N/A",
                  email: "N/A",
                  status: category,
                  source: "dials",
                  lastContact:
                    lead.date || lead.time || new Date().toISOString(),
                  notes: `Lead Status: ${lead.leadStatus || "N/A"}`,
                  // Add all the actual data fields
                  time: lead.time,
                  date: lead.date,
                  phoneNumber: lead.phoneNumber,
                  transcript: lead.transcript,
                  leadStatus: lead.leadStatus,
                  category: lead.category,
                  duration: lead.duration,
                  callType: lead.callType,
                  notes: lead.notes,
                });
              });
            }
          });
          setLeads(transformedLeads);
        }
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or filter changes
  useEffect(() => {
    if (activeTab === "reports") {
      fetchDialsReport();
    } else if (activeTab === "leads") {
      fetchLeads();
    }
  }, [activeTab, filter, startDate, endDate]);

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">
          Reports & Analytics
        </h3>
        <div className="flex gap-4 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {filter === "custom" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </>
          )}

          <button
            onClick={fetchDialsReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiDownload className="text-sm" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiPhone className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? "..." : reports[0]?.totalCalls || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiClock className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? "..." : reports[0]?.avgDuration || "0 min"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiUsers className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Conversion Rate
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? "..." : reports[0]?.totalConnected || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiDollarSign className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Conversion Rate
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? "..." : reports[0]?.conversionRate || "0%"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Dials Summary
          </h4>
          <div className="text-center text-gray-600">
            <p>
              Filter applied:{" "}
              {filter === "today"
                ? "Today"
                : filter === "yesterday"
                ? "Yesterday"
                : filter === "last7days"
                ? "Last 7 Days"
                : "Custom Range"}
            </p>
            <p className="mt-2">
              Data loaded successfully. Use the metrics above to analyze your
              dials performance.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderLeads = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Lead Management</h3>
        <div className="flex gap-4 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {filter === "custom" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </>
          )}

          <button
            onClick={fetchLeads}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FiUsers className="text-sm" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">
                Active Leads
              </h4>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transcript
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No leads available. Select a filter and click Refresh to
                      load data.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          Category: {lead.category || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.contactName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.phoneNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lead.date
                            ? new Date(lead.date).toLocaleDateString()
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.time
                            ? new Date(lead.time).toLocaleTimeString()
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lead.leadStatus === "vvi" ||
                            lead.leadStatus === "Very Interested"
                              ? "bg-green-100 text-green-800"
                              : lead.leadStatus === "maybe" ||
                                lead.leadStatus === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : lead.leadStatus === "junk lead" ||
                                lead.leadStatus === "not required"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {lead.leadStatus || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.duration
                          ? `${
                              Math.round((lead.duration / 60) * 100) / 100
                            } min`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lead.callType === "incoming"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {lead.callType || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div
                          className="max-w-xs truncate"
                          title={lead.transcript || "No transcript"}
                        >
                          {lead.transcript
                            ? lead.transcript.length > 50
                              ? `${lead.transcript.substring(0, 50)}...`
                              : lead.transcript
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                          View
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Sales & Revenue</h3>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
          <FiDollarSign className="text-sm" />
          Add Sale
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiDollarSign className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">$40,000</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiBarChart2 className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Deals Closed</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiUser className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Commission</p>
              <p className="text-2xl font-semibold text-gray-900">$4,000</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Recent Sales</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Close Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {sale.customerName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${sale.dealValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.product}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.closeDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${sale.commission.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">My Dials</h1>
        <p className="text-gray-600 mt-1">
          Manage your calls, leads, and sales performance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("reports")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "reports"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiBarChart2 className="text-sm" />
              Reports
            </div>
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "leads"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiUsers className="text-sm" />
              Leads
            </div>
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "sales"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiDollarSign className="text-sm" />
              Sales Done
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "reports" && renderReports()}
        {activeTab === "leads" && renderLeads()}
        {activeTab === "sales" && renderSales()}
      </div>
    </div>
  );
}

export default MyDials;
