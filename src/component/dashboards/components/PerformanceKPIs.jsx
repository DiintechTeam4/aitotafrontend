import React, { useState } from "react";
import {
  FiPlus,
  FiCalendar,
  FiX,
  FiTrendingUp,
  FiPhone,
  FiMail,
  FiUsers,
  FiTarget,
  FiClock,
} from "react-icons/fi";

const PerformanceKPIs = () => {
  const [startDate, setStartDate] = useState("2025-07-28");
  const [endDate, setEndDate] = useState("2025-07-30");

  const kpis = [
    { id: 1, title: "Total Calls Made", value: "0", timeFrame: "Last 7 days", icon: <FiPhone className="w-4 h-4" />, removable: false },
    { id: 2, title: "Total Emails", value: "0", timeFrame: "Last 7 days", icon: <FiMail className="w-4 h-4" />, removable: true },
    { id: 3, title: "Total AI Assistant", value: "0", timeFrame: "Last 7 days", icon: <FiTrendingUp className="w-4 h-4" />, removable: false },
    { id: 4, title: "Total Campaign", value: "0", timeFrame: "Last 7 days", icon: <FiTarget className="w-4 h-4" />, removable: false },
    { id: 5, title: "Total Call Duration", value: "00s", timeFrame: "Last 7 days", icon: <FiClock className="w-4 h-4" />, removable: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Performance Dashboard</h1>
            <p className="text-sm text-gray-500">Monitor your key performance indicators and business metrics</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
            <FiPlus className="w-4 h-4" />
            Add KPI
          </button>
        </div>

        {/* Date Range */}
        <div className="flex gap-3 mb-8">
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 bg-white text-gray-800 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 bg-white text-gray-800 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="bg-white border border-gray-200 rounded-xl p-4 relative group hover:shadow-sm transition-shadow"
            >
              {kpi.removable && (
                <button className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiX className="w-3 h-3" />
                </button>
              )}
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 mb-3">
                {kpi.icon}
              </div>
              <p className="text-xs text-gray-400 mb-1">{kpi.timeFrame}</p>
              <p className="text-sm font-medium text-gray-700 mb-2">{kpi.title}</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="text-center pt-4 md:pt-0">
              <p className="text-3xl font-bold text-gray-900 mb-1">7</p>
              <p className="text-sm text-gray-500">Active KPIs</p>
            </div>
            <div className="text-center pt-4 md:pt-0">
              <p className="text-3xl font-bold text-gray-900 mb-1">0</p>
              <p className="text-sm text-gray-500">Total Metrics</p>
            </div>
            <div className="text-center pt-4 md:pt-0">
              <p className="text-3xl font-bold text-gray-900 mb-1">0%</p>
              <p className="text-sm text-gray-500">Growth Rate</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerformanceKPIs;
