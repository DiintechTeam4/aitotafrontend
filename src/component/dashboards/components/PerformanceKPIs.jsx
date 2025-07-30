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
  FiDollarSign,
  FiClock,
} from "react-icons/fi";

const PerformanceKPIs = () => {
  const [startDate, setStartDate] = useState("2025-07-28");
  const [endDate, setEndDate] = useState("2025-07-30");

  const kpis = [
    
    {
      id: 1,
      title: "Total Calls Made",
      value: "0",
      timeFrame: "Last 7 days",
      color: "green",
      icon: <FiPhone className="w-4 h-4" />,
      removable: false,
    },
    {
      id: 2,
      title: "Total Emails",
      value: "0",
      timeFrame: "Last 7 days",
      color: "purple",
      icon: <FiMail className="w-4 h-4" />,
      removable: true,
    },
    {
      id: 3,
      title: "Total AI Assistant",
      value: "0",
      timeFrame: "Last 7 days",
      color: "indigo",
      icon: <FiTrendingUp className="w-4 h-4" />,
      removable: false,
    },
    {
      id: 4,
      title: "Total Campaign",
      value: "0",
      timeFrame: "Last 7 days",
      color: "orange",
      icon: <FiTarget className="w-4 h-4" />,
      removable: false,
    },
    {
      id: 5,
      title: "Total Call Duration",
      value: "00s",
      timeFrame: "Last 7 days",
      color: "cyan",
      icon: <FiClock className="w-4 h-4" />,
      removable: false,
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-600",
          dot: "bg-blue-500",
          title: "text-blue-900",
          value: "text-blue-700",
        };
      case "green":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: "text-green-600",
          dot: "bg-green-500",
          title: "text-green-900",
          value: "text-green-700",
        };
      case "purple":
        return {
          bg: "bg-purple-50",
          border: "border-purple-200",
          icon: "text-purple-600",
          dot: "bg-purple-500",
          title: "text-purple-900",
          value: "text-purple-700",
        };
      case "indigo":
        return {
          bg: "bg-indigo-50",
          border: "border-indigo-200",
          icon: "text-indigo-600",
          dot: "bg-indigo-500",
          title: "text-indigo-900",
          value: "text-indigo-700",
        };
      case "orange":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          icon: "text-orange-600",
          dot: "bg-orange-500",
          title: "text-orange-900",
          value: "text-orange-700",
        };
      case "emerald":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          icon: "text-emerald-600",
          dot: "bg-emerald-500",
          title: "text-emerald-900",
          value: "text-emerald-700",
        };
      case "cyan":
        return {
          bg: "bg-cyan-50",
          border: "border-cyan-200",
          icon: "text-cyan-600",
          dot: "bg-cyan-500",
          title: "text-cyan-900",
          value: "text-cyan-700",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          icon: "text-gray-600",
          dot: "bg-gray-500",
          title: "text-gray-900",
          value: "text-gray-700",
        };
    }
  };

  const handleRemoveKPI = (id) => {
    // Handle KPI removal logic here
    console.log("Remove KPI:", id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Performance Dashboard
            </h1>
            <p className="text-gray-600 mb-6">
              Monitor your key performance indicators and business metrics
            </p>

            {/* Date Range Selectors */}
            <div className="flex gap-4">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Add KPI Button */}
          <button className="px-6 py-3 bg-gradient-to-r bg-black text-white border * rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            <FiPlus className="w-4 h-4" />
            Add KPI
          </button>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {kpis.map((kpi) => {
            const colors = getColorClasses(kpi.color);
            return (
              <div
                key={kpi.id}
                className={`${colors.bg} ${colors.border} border rounded-xl p-4 relative shadow-sm hover:shadow-md transition-all duration-200 group`}
              >
                {/* Remove button for removable KPIs */}
                {kpi.removable && (
                  <button
                    onClick={() => handleRemoveKPI(kpi.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                )}

                {/* KPI Content */}
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-lg bg-white shadow-sm ${colors.icon} flex items-center justify-center`}
                  >
                    <div className="w-4 h-4">{kpi.icon}</div>
                  </div>

                  <div className="flex-1">
                    {/* Title */}
                    <h3
                      className={`font-semibold text-sm mb-1 ${colors.title}`}
                    >
                      {kpi.title}
                    </h3>

                    {/* Time Frame */}
                    <p className="text-gray-500 text-xs mb-2">
                      {kpi.timeFrame}
                    </p>

                    {/* Value */}
                    <p className={`text-xl font-bold ${colors.value}`}>
                      {kpi.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Performance Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">7</div>
              <div className="text-sm text-gray-600">Active KPIs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">0</div>
              <div className="text-sm text-gray-600">Total Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">0%</div>
              <div className="text-sm text-gray-600">Growth Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceKPIs;
